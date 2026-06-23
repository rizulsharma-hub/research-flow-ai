'use client';

import { useState } from 'react';
import { Download, Copy, Check, FileText, Search, Layout, BarChart3, BookOpen, ExternalLink } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResearchViewer } from './ResearchViewer';
import { OutlineViewer } from './OutlineViewer';
import { SeoViewer } from './SeoViewer';
import { QualityViewer } from './QualityViewer';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Article } from '@/lib/api';
import { countWords } from '@/lib/utils';

interface Props {
  article: Article;
}

export function ArticleViewer({ article }: Props) {
  const [copied, setCopied] = useState(false);

  const finalContent = article.generatedArticle?.final;
  const humanizedContent = article.generatedArticle?.humanized;
  const displayContent = finalContent ?? humanizedContent ?? article.generatedArticle?.draft ?? '';

  const wordCount = displayContent ? countWords(displayContent) : (article.generatedArticle?.wordCount ?? 0);

  async function copyToClipboard() {
    if (!displayContent) return;
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadAs(format: 'md' | 'html' | 'json') {
    if (!displayContent) return;

    let content = displayContent;
    let mime = 'text/markdown';
    let ext = 'md';

    if (format === 'html') {
      content = `<!DOCTYPE html><html><head><title>${article.topic}</title></head><body>\n${displayContent}\n</body></html>`;
      mime = 'text/html';
      ext = 'html';
    } else if (format === 'json') {
      content = JSON.stringify({
        topic: article.topic,
        primaryKeyword: article.primaryKeyword,
        article: displayContent,
        seo: article.seoPackage,
        quality: article.qualityReport,
      }, null, 2);
      mime = 'application/json';
      ext = 'json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.primaryKeyword.replace(/\s+/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">{article.topic}</h2>
          {wordCount > 0 && (
            <Badge variant="secondary" className="flex-shrink-0">
              {wordCount.toLocaleString()} words
            </Badge>
          )}
        </div>

        {displayContent && (
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <div className="flex items-center gap-1">
              {(['md', 'html', 'json'] as const).map((fmt) => (
                <Button key={fmt} variant="outline" size="sm" onClick={() => downloadAs(fmt)}>
                  <Download className="w-3.5 h-3.5" />
                  .{fmt}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="article" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-3 border-b border-border/50">
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            {[
              { value: 'article', label: 'Article', icon: FileText },
              { value: 'research', label: 'Research', icon: Search },
              { value: 'outline', label: 'Outline', icon: Layout },
              { value: 'seo', label: 'SEO', icon: ExternalLink },
              { value: 'quality', label: 'Quality', icon: BarChart3 },
              { value: 'sources', label: 'Sources', icon: BookOpen },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-3 py-1.5 rounded-md text-sm"
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="article" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6 max-w-4xl mx-auto">
                {displayContent ? (
                  <MarkdownRenderer content={displayContent} />
                ) : (
                  <ArticlePlaceholder status={article.status} />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="research" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                <ResearchViewer report={article.researchReport} stages={article.stages} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="outline" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                <OutlineViewer generatedArticle={article.generatedArticle} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="seo" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                <SeoViewer seoPackage={article.seoPackage} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="quality" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                <QualityViewer report={article.qualityReport} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sources" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                <SourcesViewer stages={article.stages} />
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ArticlePlaceholder({ status }: { status: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-primary/50" />
      </div>
      <p className="text-muted-foreground">
        {status === 'RUNNING' || status === 'QUEUED'
          ? 'Article is being generated…'
          : 'No article content yet.'}
      </p>
    </div>
  );
}

function SourcesViewer({ stages }: { stages?: Array<{ stageName: string; result: unknown }> }) {
  const researchStage = stages?.find((s) => s.stageName === 'deep_research');
  const data = researchStage?.result as Record<string, unknown> | null;
  const stats = data?.statistics as Array<{ fact: string; source: string }> | undefined;
  const experts = data?.expertInsights as Array<{ insight: string; attribution: string }> | undefined;

  if (!stats && !experts) {
    return (
      <p className="text-muted-foreground text-sm text-center py-12">
        Sources will appear after deep research completes.
      </p>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {stats && stats.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-4">Statistics & Data Points</h3>
          <div className="space-y-3">
            {stats.map((s, i) => (
              <div key={i} className="glass-card p-4">
                <p className="text-sm text-foreground/80">{s.fact}</p>
                <p className="text-xs text-muted-foreground mt-1">Source: {s.source}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {experts && experts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-4">Expert Insights</h3>
          <div className="space-y-3">
            {experts.map((e, i) => (
              <div key={i} className="glass-card p-4 border-l-2 border-primary/30">
                <p className="text-sm text-foreground/80 italic">"{e.insight}"</p>
                <p className="text-xs text-muted-foreground mt-1">— {e.attribution}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
