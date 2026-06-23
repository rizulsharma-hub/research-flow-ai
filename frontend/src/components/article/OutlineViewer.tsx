'use client';

import { Layout } from 'lucide-react';
import type { GeneratedArticle } from '@/lib/api';

interface OutlineSection {
  h2: string;
  points: string[];
  subsections?: Array<{ h3: string; points: string[] }>;
}

interface Outline {
  h1: string;
  introduction: string;
  sections: OutlineSection[];
  conclusion: string;
  estimatedWordCount?: number;
}

interface Props {
  generatedArticle: GeneratedArticle | null | undefined;
}

export function OutlineViewer({ generatedArticle }: Props) {
  const outline = generatedArticle?.outline as Outline | null;

  if (!outline) {
    return (
      <p className="text-muted-foreground text-sm text-center py-12">
        Outline will appear after generation completes.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Article Structure</span>
          {outline.estimatedWordCount && (
            <span className="ml-auto text-xs text-muted-foreground">
              ~{outline.estimatedWordCount.toLocaleString()} words
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="border-l-2 border-primary pl-4">
            <p className="text-xs text-primary/60 uppercase tracking-wider mb-1">H1</p>
            <h2 className="text-lg font-bold text-white">{outline.h1}</h2>
          </div>

          <div className="ml-4 pl-4 border-l border-border/40">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Introduction</p>
            <p className="text-sm text-foreground/70">{outline.introduction}</p>
          </div>

          {outline.sections.map((section, i) => (
            <div key={i} className="space-y-2">
              <div className="border-l-2 border-violet-500/40 pl-4">
                <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-1">H2</p>
                <h3 className="text-base font-semibold text-white/90">{section.h2}</h3>
              </div>

              {section.points.length > 0 && (
                <ul className="ml-8 space-y-1">
                  {section.points.map((p, j) => (
                    <li key={j} className="text-sm text-foreground/60 flex items-start gap-2">
                      <span className="text-muted-foreground mt-1 flex-shrink-0">·</span>
                      {p}
                    </li>
                  ))}
                </ul>
              )}

              {section.subsections?.map((sub, j) => (
                <div key={j} className="ml-8 space-y-1">
                  <div className="border-l border-indigo-500/30 pl-3">
                    <p className="text-xs text-indigo-400/60 uppercase tracking-wider mb-0.5">H3</p>
                    <h4 className="text-sm font-medium text-white/80">{sub.h3}</h4>
                  </div>
                  <ul className="ml-4 space-y-1">
                    {sub.points.map((p, k) => (
                      <li key={k} className="text-xs text-foreground/50 flex items-start gap-1.5">
                        <span className="mt-1 flex-shrink-0">·</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}

          <div className="ml-4 pl-4 border-l border-border/40">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conclusion</p>
            <p className="text-sm text-foreground/70">{outline.conclusion}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
