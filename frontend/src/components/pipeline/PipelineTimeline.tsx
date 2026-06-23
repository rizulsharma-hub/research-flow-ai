'use client';

import { useArticleStore } from '@/stores/articleStore';
import { StageCard } from './StageCard';
import { PIPELINE_STAGES } from '@/lib/constants';
import { motion } from 'framer-motion';

interface Props {
  onRetry?: () => void;
}

export function PipelineTimeline({ onRetry }: Props) {
  const stageStates = useArticleStore((s) => s.stageStates);

  const completed = Object.values(stageStates).filter((s) => s.status === 'COMPLETED').length;
  const running = Object.values(stageStates).find((s) => s.status === 'RUNNING');
  const total = PIPELINE_STAGES.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="space-y-3">
      {/* Overall progress bar */}
      {(completed > 0 || running) && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-muted-foreground">
              {running
                ? `Stage ${completed + 1}/9 — ${running.stageName.replace(/_/g, ' ')}`
                : `${completed}/${total} stages complete`}
            </span>
            <span className="text-[11px] font-semibold text-white tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {PIPELINE_STAGES.map((stage, index) => {
        const state = stageStates[stage.name] ?? {
          stageName: stage.name,
          status: 'PENDING' as const,
          messages: [],
        };
        return (
          <StageCard
            key={stage.name}
            stage={state}
            index={index}
            isLast={index === PIPELINE_STAGES.length - 1}
            onRetry={state.status === 'FAILED' ? onRetry : undefined}
          />
        );
      })}
    </div>
  );
}
