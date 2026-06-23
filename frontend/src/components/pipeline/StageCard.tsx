'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, XCircle, ChevronDown, ChevronUp, Zap, RotateCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { streamingStore } from '@/lib/streamingStore';
import type { StageState } from '@/stores/articleStore';

const STAGE_LABELS: Record<string, string> = {
  keyword_analysis: 'Keyword Analysis',
  competitor_research: 'Competitor Research',
  deep_research: 'Deep Research',
  outline_generation: 'Outline Generation',
  article_draft: 'Article Draft',
  humanization: 'Humanization Pass',
  seo_package: 'SEO Package',
  quality_review: 'Quality Review',
  final_compilation: 'Final Compilation',
};

const STAGE_ACTIVITY: Record<string, string[]> = {
  keyword_analysis:    ['Identifying search intent…', 'Mapping semantic entities…', 'Extracting LSI keywords…', 'Analyzing user goals…'],
  competitor_research: ['Scanning SERP results…', 'Identifying content gaps…', 'Analyzing competitor headings…', 'Finding opportunities…'],
  deep_research:       ['Gathering industry data…', 'Sourcing statistics…', 'Extracting expert insights…', 'Building research report…'],
  outline_generation:  ['Structuring H2 sections…', 'Mapping subsections…', 'Planning content flow…', 'Architecting article…'],
  article_draft:       ['Writing introduction…', 'Drafting body sections…', 'Adding data & examples…', 'Expanding key points…'],
  humanization:        ['Removing AI patterns…', 'Varying sentence rhythm…', 'Adding expert voice…', 'Polishing transitions…'],
  seo_package:         ['Crafting meta title…', 'Writing meta description…', 'Generating FAQ…', 'Building schema markup…'],
  quality_review:      ['Scoring readability…', 'Checking SEO signals…', 'Measuring topic coverage…', 'Assessing human-likeness…'],
  final_compilation:   ['Applying improvements…', 'Inserting FAQ section…', 'Final polish…', 'Assembling document…'],
};

interface Props {
  stage: StageState;
  index: number;
  isLast: boolean;
  onRetry?: () => void;
}

export function StageCard({ stage, index, isLast, onRetry }: Props) {
  const { status, stageName, messages, result } = stage;
  const isRunning = status === 'RUNNING';
  const isCompleted = status === 'COMPLETED';

  // Elapsed timer — counts up while RUNNING, local state only (doesn't affect parent)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isRunning) { setElapsed(0); return; }
    const t0 = stage.startedAt ?? Date.now();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [isRunning, stage.startedAt]);

  // Rotating activity description while running
  const [activityIdx, setActivityIdx] = useState(0);
  useEffect(() => {
    if (!isRunning) { setActivityIdx(0); return; }
    const interval = setInterval(() => setActivityIdx((i) => (i + 1) % (STAGE_ACTIVITY[stageName]?.length ?? 1)), 2500);
    return () => clearInterval(interval);
  }, [isRunning, stageName]);

  // Stream ref — updated directly from streamingStore, ZERO React re-renders
  const streamRef = useRef<HTMLPreElement>(null);
  const charCountRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!isRunning) return;
    return streamingStore.subscribe(stageName, (text) => {
      if (streamRef.current && text) {
        streamRef.current.textContent = text.slice(-600);
      }
      if (charCountRef.current && text) {
        charCountRef.current.textContent = `${text.length.toLocaleString()} chars`;
      }
    });
  }, [isRunning, stageName]);

  // Auto-expand when running; remember user toggle for completed
  const [userExpanded, setUserExpanded] = useState(false);
  useEffect(() => {
    if (isRunning) setUserExpanded(false); // reset so auto-expand takes over
  }, [isRunning]);
  const isExpanded = isRunning || (isCompleted && userExpanded);

  const fmtElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const lineColor = { PENDING: 'bg-border', RUNNING: 'bg-blue-500', COMPLETED: 'bg-emerald-500', FAILED: 'bg-red-500' }[status];

  return (
    <div className="flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.04 }}>
          {status === 'PENDING'   && <Circle className="w-5 h-5 text-muted-foreground/40" />}
          {status === 'RUNNING'   && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
          {status === 'COMPLETED' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {status === 'FAILED'    && <XCircle className="w-5 h-5 text-red-400" />}
        </motion.div>
        {!isLast && (
          <motion.div
            className={cn('w-0.5 flex-1 mt-1.5 rounded-full transition-colors duration-700', lineColor)}
            style={{ minHeight: 24 }}
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.04 + 0.15, duration: 0.4 }}
          />
        )}
      </div>

      {/* Card */}
      <motion.div
        className="flex-1 pb-3"
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04 + 0.08 }}
      >
        <div
          className={cn(
            'rounded-xl border transition-all duration-300',
            status === 'PENDING'   && 'border-border/30 bg-card/20',
            status === 'RUNNING'   && 'border-blue-500/40 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.08)]',
            status === 'COMPLETED' && 'border-emerald-500/30 bg-emerald-500/5 cursor-pointer hover:border-emerald-500/50',
            status === 'FAILED'    && 'border-red-500/30 bg-red-500/5',
            isRunning ? 'p-4' : 'p-3'
          )}
          onClick={() => isCompleted && setUserExpanded((v) => !v)}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'text-sm font-semibold',
                  status === 'PENDING'   && 'text-muted-foreground/50',
                  status === 'RUNNING'   && 'text-blue-300',
                  status === 'COMPLETED' && 'text-emerald-300',
                  status === 'FAILED'    && 'text-red-300',
                )}>
                  {STAGE_LABELS[stageName] ?? stageName}
                </span>

                {isRunning && (
                  <>
                    <span className="flex items-center gap-1 text-[11px] text-blue-400/80 font-medium">
                      <Zap className="w-3 h-3" />
                      Live
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {fmtElapsed(elapsed)}
                    </span>
                    <span ref={charCountRef} className="text-[11px] text-muted-foreground/60 tabular-nums" />
                  </>
                )}
              </div>

              {/* Activity description while running */}
              {isRunning && (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activityIdx}
                    className="text-xs text-blue-400/70 mt-0.5"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                  >
                    {STAGE_ACTIVITY[stageName]?.[activityIdx] ?? messages[messages.length - 1] ?? ''}
                  </motion.p>
                </AnimatePresence>
              )}

              {status === 'PENDING' && (
                <p className="text-[11px] text-muted-foreground/40 mt-0.5">Waiting…</p>
              )}
            </div>

            {isCompleted && (
              <div className="flex-shrink-0 mt-0.5">
                {userExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
              </div>
            )}
          </div>

          {/* Running: live stream window */}
          {isRunning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mt-3 overflow-hidden"
            >
              <div className="rounded-lg bg-black/30 border border-blue-500/10 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[10px] text-blue-400/60 font-mono uppercase tracking-wider">Output stream</span>
                </div>
                <pre
                  ref={streamRef}
                  className="text-[11px] text-muted-foreground/80 font-mono whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto"
                >
                  <span className="text-muted-foreground/30 italic">Waiting for first token…</span>
                </pre>
                <span className="inline-block w-1.5 h-3.5 bg-blue-400 animate-pulse mt-1" />
              </div>
            </motion.div>
          )}

          {/* Completed: expandable result */}
          <AnimatePresence>
            {isExpanded && isCompleted && result != null && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/5">
                  <StageResult stageName={stageName} result={result} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Failed: error + retry */}
          {status === 'FAILED' && (
            <div className="mt-2 flex items-start justify-between gap-3">
              {stage.error && (
                <p className="text-xs text-red-400/80 font-mono flex-1">{stage.error.slice(0, 200)}</p>
              )}
              {onRetry && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRetry(); }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-colors flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Resume
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StageResult({ stageName, result }: { stageName: string; result: unknown }) {
  const data = result as Record<string, unknown>;

  if (stageName === 'keyword_analysis') return (
    <div className="space-y-2 text-xs">
      <div className="flex gap-2">
        <span className="text-muted-foreground shrink-0">Intent:</span>
        <span className="text-emerald-300 font-medium capitalize">{String(data.searchIntent ?? '')}</span>
      </div>
      {Array.isArray(data.lsiKeywords) && (
        <div>
          <p className="text-muted-foreground mb-1">LSI Keywords:</p>
          <div className="flex flex-wrap gap-1">
            {(data.lsiKeywords as string[]).slice(0, 6).map((k, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 text-[10px]">{k}</span>
            ))}
          </div>
        </div>
      )}
      {Array.isArray(data.relatedQuestions) && (
        <div>
          <p className="text-muted-foreground mb-1">Top Questions:</p>
          <ul className="space-y-0.5">
            {(data.relatedQuestions as string[]).slice(0, 3).map((q, i) => (
              <li key={i} className="text-foreground/60">• {q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (stageName === 'competitor_research') return (
    <div className="space-y-2 text-xs">
      {Array.isArray(data.contentGaps) && (
        <div>
          <p className="text-muted-foreground mb-1">Content Gaps Found:</p>
          <ul className="space-y-0.5">
            {(data.contentGaps as string[]).slice(0, 3).map((g, i) => (
              <li key={i} className="text-foreground/60">• {g}</li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(data.opportunities) && (
        <div>
          <p className="text-muted-foreground mb-1">Opportunities:</p>
          <ul className="space-y-0.5">
            {(data.opportunities as string[]).slice(0, 2).map((o, i) => (
              <li key={i} className="text-emerald-400/70">✦ {o}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (stageName === 'deep_research') return (
    <div className="space-y-2 text-xs">
      {Array.isArray(data.statistics) && (
        <div>
          <p className="text-muted-foreground mb-1">Key Statistics:</p>
          {(data.statistics as Array<{fact: string; source: string}>).slice(0, 2).map((s, i) => (
            <p key={i} className="text-foreground/60 mb-1">"{s.fact}" <span className="text-muted-foreground/50">— {s.source}</span></p>
          ))}
        </div>
      )}
      {Array.isArray(data.keyTakeaways) && (
        <div>
          <p className="text-muted-foreground mb-1">Takeaways:</p>
          <ul className="space-y-0.5">
            {(data.keyTakeaways as string[]).slice(0, 2).map((t, i) => (
              <li key={i} className="text-foreground/60">• {t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (stageName === 'outline_generation') return (
    <div className="text-xs space-y-1">
      {typeof data.h1 === 'string' && (
        <p className="text-white/80 font-medium">{data.h1}</p>
      )}
      {Array.isArray(data.sections) && (
        <ul className="space-y-0.5 mt-1">
          {(data.sections as Array<{h2: string}>).slice(0, 4).map((s, i) => (
            <li key={i} className="text-foreground/50 text-[11px]">H2 {i + 1}: {s.h2}</li>
          ))}
          {(data.sections as unknown[]).length > 4 && (
            <li className="text-muted-foreground/40 text-[11px]">+{(data.sections as unknown[]).length - 4} more sections…</li>
          )}
        </ul>
      )}
    </div>
  );

  if (stageName === 'quality_review') {
    const scores = [
      { key: 'readability', label: 'Readability' },
      { key: 'seoScore', label: 'SEO' },
      { key: 'coverage', label: 'Coverage' },
      { key: 'humanLikeness', label: 'Human-like' },
    ];
    return (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {scores.map(({ key, label }) => {
            const score = Number(data[key] ?? 0);
            return (
              <div key={key}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn('font-medium', score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-yellow-400' : 'text-red-400')}>{score}</span>
                </div>
                <div className="h-1 rounded-full bg-white/5">
                  <div className={cn('h-full rounded-full', score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        {typeof data.overall === 'number' && (
          <p className="text-center text-muted-foreground">Overall: <span className="text-white font-bold">{data.overall}/100</span></p>
        )}
      </div>
    );
  }

  if (typeof data.wordCount === 'number') return (
    <p className="text-xs text-muted-foreground">
      Generated <span className="text-emerald-300 font-semibold">{data.wordCount.toLocaleString()}</span> words
    </p>
  );

  return (
    <pre className="text-xs text-muted-foreground/60 font-mono whitespace-pre-wrap max-h-28 overflow-y-auto">
      {JSON.stringify(result, null, 2).slice(0, 300)}
    </pre>
  );
}
