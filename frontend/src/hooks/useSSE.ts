'use client';

import { useEffect, useRef, useCallback } from 'react';
import { startTransition } from 'react';
import { api } from '@/lib/api';
import { useArticleStore, type PipelineEvent } from '@/stores/articleStore';
import { streamingStore } from '@/lib/streamingStore';

export function useSSE(articleId: string | null, enabled = true) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addEvent = useArticleStore((s) => s.addEvent);

  const connect = useCallback(() => {
    if (!articleId || !enabled) return;
    if (eventSourceRef.current) eventSourceRef.current.close();

    const es = new EventSource(api.eventsUrl(articleId));
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as PipelineEvent;

        // STAGE_PROGRESS and STAGE_THINKING: update DOM directly via streamingStore
        // — never goes through React state, so zero re-renders during streaming
        if (event.event === 'STAGE_PROGRESS' && event.stage) {
          const partial = (event.data as { partial?: string })?.partial ?? '';
          streamingStore.emit(event.stage, partial);
          // Still push to Zustand for the log (message only, not content)
          startTransition(() => addEvent({ ...event, data: undefined }));
          return;
        }

        if (event.event === 'STAGE_THINKING' && event.stage) {
          const thinking = (event.data as { thinking?: string })?.thinking ?? '';
          streamingStore.emit(`${event.stage}:thinking`, thinking);
          return;
        }

        // Status events are urgent — update Zustand immediately (no deferral)
        addEvent(event);

        if (event.event === 'JOB_COMPLETED' || event.event === 'JOB_FAILED') {
          es.close();
          eventSourceRef.current = null;
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(connect, 3000);
    };
  }, [articleId, enabled, addEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
      streamingStore.clearAll();
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
  }, []);

  return { disconnect };
}
