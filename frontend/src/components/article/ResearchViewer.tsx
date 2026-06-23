'use client';

import { TrendingUp, BarChart2, Lightbulb, AlertCircle, Target, Globe, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ResearchReport, PipelineStage } from '@/lib/api';

interface Props {
  report: ResearchReport | null | undefined;
  stages?: PipelineStage[];
}

export function ResearchViewer({ report, stages }: Props) {
  const kwStage = stages?.find((s) => s.stageName === 'keyword_analysis');
  const crStage = stages?.find((s) => s.stageName === 'competitor_research');

  const kw = kwStage?.result as Record<string, unknown> | null;
  const cr = crStage?.result as Record<string, unknown> | null;
  const data = report?.content as Record<string, unknown> | null;

  if (!data && !kw) {
    return (
      <p className="text-muted-foreground text-sm text-center py-12">
        Research data will appear as stages complete.
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {kw && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Keyword Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Search Intent</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="mb-2">{String(kw.searchIntent ?? '')}</Badge>
                <p className="text-sm text-foreground/70">{String(kw.intentDescription ?? '')}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Content Angle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">{String(kw.contentAngle ?? '')}</p>
              </CardContent>
            </Card>

            {Array.isArray(kw.relatedQuestions) && (
              <Card className="bg-card/50 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Related Questions (PAA)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(kw.relatedQuestions as string[]).map((q, i) => (
                      <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">?</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {Array.isArray(kw.semanticEntities) && (
              <Card className="bg-card/50 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Semantic Entities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(kw.semanticEntities as string[]).map((e, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {cr && Array.isArray(cr.topRankingPages) && (cr.topRankingPages as unknown[]).length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> Reference Websites Analyzed
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {(cr.topRankingPages as Array<{ title: string; url: string; strength: string; wordCount: number }>).map((page, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-card/30 hover:bg-card/50 transition-colors group">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{page.title}</p>
                  <p className="text-xs text-blue-400/70 truncate mt-0.5">{page.url}</p>
                  {page.strength && (
                    <p className="text-xs text-muted-foreground mt-1">{page.strength}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {page.wordCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">{page.wordCount.toLocaleString()} words</span>
                  )}
                  <a
                    href={page.url.startsWith('http') ? page.url : `https://${page.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cr && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" /> Competitor Gaps & Opportunities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(cr.contentGaps) && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Content Gaps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {(cr.contentGaps as string[]).map((g, i) => (
                      <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                        <span className="text-yellow-400 flex-shrink-0 mt-0.5">◦</span> {g}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {Array.isArray(cr.opportunities) && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {(cr.opportunities as string[]).map((o, i) => (
                      <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                        <span className="text-emerald-400 flex-shrink-0 mt-0.5">✦</span> {o}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {data && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" /> Deep Research Report
          </h3>
          <div className="space-y-4">
            {data.industryOverview != null && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Industry Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/70 leading-relaxed">{String(data.industryOverview)}</p>
                </CardContent>
              </Card>
            )}

            {Array.isArray(data.statistics) && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">Key Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(data.statistics as Array<{ fact: string; source: string }>).map((s, i) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-3">
                        <p className="text-sm text-foreground/80">{s.fact}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.source}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {Array.isArray(data.trends) && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(data.trends as Array<{ trend: string; impact: string }>).map((t, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium text-white">{t.trend}</p>
                        <p className="text-xs text-foreground/60 mt-0.5">{t.impact}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {Array.isArray(data.expertInsights) && (
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> Expert Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(data.expertInsights as Array<{ insight: string; attribution: string }>).map((e, i) => (
                      <div key={i} className="glass-card p-3">
                        <p className="text-sm text-foreground/80 italic">"{e.insight}"</p>
                        <p className="text-xs text-muted-foreground mt-1">— {e.attribution}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
