'use client';

import { CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { scoreColor, scoreBg, cn } from '@/lib/utils';
import type { QualityReport } from '@/lib/api';

interface Props {
  report: QualityReport | null | undefined;
}

const SCORES = [
  { key: 'readability', label: 'Readability' },
  { key: 'seoScore', label: 'SEO Score' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'humanLikeness', label: 'Human Likeness' },
] as const;

export function QualityViewer({ report }: Props) {
  if (!report || report.overall === null) {
    return (
      <p className="text-muted-foreground text-sm text-center py-12">
        Quality report will appear after the quality review stage completes.
      </p>
    );
  }

  const overall = report.overall ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className={cn('glass-card p-6 text-center', scoreBg(overall))}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Overall Score</p>
        <div className={cn('text-6xl font-bold', scoreColor(overall))}>{overall}</div>
        <div className="text-muted-foreground text-sm mt-1">/ 100</div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Score Breakdown</h3>
        {SCORES.map(({ key, label }) => {
          const score = report[key] ?? 0;
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-foreground/70">{label}</span>
                <span className={cn('font-semibold', scoreColor(score))}>{score}/100</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {report.feedback && (
        <div className="grid grid-cols-1 gap-4">
          {report.feedback.strengths.length > 0 && (
            <div className="glass-card p-4">
              <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4" /> Strengths
              </h4>
              <ul className="space-y-2">
                {report.feedback.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.feedback.improvements.length > 0 && (
            <div className="glass-card p-4">
              <h4 className="text-sm font-semibold text-yellow-400 flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" /> Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {report.feedback.improvements.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="text-yellow-400 flex-shrink-0 mt-0.5">◦</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.feedback.suggestions.length > 0 && (
            <div className="glass-card p-4">
              <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4" /> Suggestions
              </h4>
              <ul className="space-y-2">
                {report.feedback.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="text-blue-400 flex-shrink-0 mt-0.5">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
