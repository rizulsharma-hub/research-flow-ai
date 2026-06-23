import { create } from 'zustand';
import type { PipelineStage } from '@/lib/api';

export type SSEEventType =
  | 'JOB_CREATED'
  | 'STAGE_STARTED'
  | 'STAGE_PROGRESS'
  | 'STAGE_THINKING'
  | 'STAGE_COMPLETED'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED';

export interface PipelineEvent {
  jobId: string;
  articleId: string;
  stage?: string;
  event: SSEEventType;
  message?: string;
  data?: unknown;
  timestamp: string;
}

export interface StageState {
  stageName: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  messages: string[];
  result?: unknown;
  error?: string;
  startedAt?: number; // ms timestamp — used for elapsed timer
}

interface ArticleStore {
  events: PipelineEvent[];
  stageStates: Record<string, StageState>;
  jobStatus: 'idle' | 'running' | 'completed' | 'failed';
  logs: string[];

  addEvent: (event: PipelineEvent) => void;
  initStages: (stages: PipelineStage[]) => void;
  reset: () => void;
}

export const useArticleStore = create<ArticleStore>((set) => ({
  events: [],
  stageStates: {},
  jobStatus: 'idle',
  logs: [],

  addEvent: (event) => {
    set((state) => {
      const logs = [
        ...state.logs,
        `[${new Date(event.timestamp).toLocaleTimeString()}] ${event.event}${event.stage ? ` [${event.stage}]` : ''}: ${event.message ?? ''}`,
      ].slice(-200);

      const stageStates = { ...state.stageStates };

      if (event.stage) {
        const current = stageStates[event.stage] ?? {
          stageName: event.stage,
          status: 'PENDING' as const,
          messages: [],
        };

        if (event.event === 'STAGE_STARTED') {
          stageStates[event.stage] = {
            ...current,
            status: 'RUNNING',
            startedAt: Date.now(),
            messages: [event.message ?? ''],
          };
        } else if (event.event === 'STAGE_PROGRESS') {
          stageStates[event.stage] = {
            ...current,
            messages: [...current.messages, event.message ?? ''].slice(-5),
          };
        } else if (event.event === 'STAGE_COMPLETED') {
          stageStates[event.stage] = {
            ...current,
            status: 'COMPLETED',
            result: event.data,
            startedAt: undefined,
          };
        } else if (event.event === 'STAGE_THINKING' || event.event === 'JOB_CREATED') {
          // handled by streamingStore in useSSE — no state change needed
        }
      }

      let jobStatus = state.jobStatus;
      if (event.event === 'JOB_CREATED' || event.event === 'STAGE_STARTED') jobStatus = 'running';
      if (event.event === 'JOB_COMPLETED') jobStatus = 'completed';
      if (event.event === 'JOB_FAILED') jobStatus = 'failed';

      return { events: [...state.events, event].slice(-500), stageStates, jobStatus, logs };
    });
  },

  initStages: (stages) => {
    set((state) => {
      const stageStates: Record<string, StageState> = {};
      for (const stage of stages) {
        const existing = state.stageStates[stage.stageName];
        stageStates[stage.stageName] = {
          stageName: stage.stageName,
          status: stage.status,
          // Preserve messages accumulated from SSE (polling would blank them otherwise)
          messages: existing?.messages ?? [],
          result: stage.result ?? undefined,
          // Keep existing startedAt if already set (don't reset elapsed timer on each poll)
          startedAt: stage.status === 'RUNNING'
            ? (existing?.startedAt ?? Date.now())
            : undefined,
        };
      }
      return { stageStates };
    });
  },

  reset: () => set({ events: [], stageStates: {}, jobStatus: 'idle', logs: [] }),
}));
