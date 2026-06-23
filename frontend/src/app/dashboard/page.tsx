'use client';

import Link from 'next/link';
import { PenLine, Loader2, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useArticles, useDeleteArticle } from '@/hooks/useArticle';
import { formatRelativeTime, truncate, scoreColor } from '@/lib/utils';
import type { Article } from '@/lib/api';

function StatusBadge({ status }: { status: Article['status'] }) {
  const config = {
    QUEUED: { label: 'Queued', variant: 'secondary', icon: Clock },
    RUNNING: { label: 'Running', variant: 'running', icon: Loader2 },
    COMPLETED: { label: 'Done', variant: 'success', icon: CheckCircle2 },
    FAILED: { label: 'Failed', variant: 'destructive', icon: XCircle },
  }[status];

  const Icon = config.icon;
  return (
    <Badge variant={config.variant as 'secondary'}>
      <Icon className={`w-3 h-3 mr-1 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useArticles();
  const { mutate: deleteArticle } = useDeleteArticle();

  const articles = data?.data ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {data?.meta.total ?? 0} article{(data?.meta.total ?? 0) !== 1 ? 's' : ''} generated
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button variant="glow">
            <PenLine className="w-4 h-4" />
            New Article
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary/50" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No articles yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Generate your first article by entering a topic and keyword. The AI pipeline will do the rest.
          </p>
          <Link href="/dashboard/new">
            <Button variant="glow">
              <PenLine className="w-4 h-4" />
              Generate First Article
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {articles.map((article) => (
            <Link key={article.id} href={`/dashboard/article/${article.id}`}>
              <div className="glass-card p-5 hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <StatusBadge status={article.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(article.createdAt)}
                      </span>
                      {article.qualityReport?.overall && (
                        <span className={`text-xs font-medium ${scoreColor(article.qualityReport.overall)}`}>
                          Score: {article.qualityReport.overall}/100
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                      {truncate(article.topic, 80)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="text-primary/70">{article.primaryKeyword}</span>
                      {' · '}
                      {article.contentType.replace('_', ' ')}
                      {' · '}
                      {article.wordCount.toLocaleString()} words target
                      {' · '}
                      {article.country}
                    </p>
                  </div>

                  {article.stages && (
                    <div className="flex-shrink-0">
                      <div className="text-xs text-muted-foreground mb-1 text-right">
                        {article.stages.filter((s) => s.status === 'COMPLETED').length} / {article.stages.length}
                      </div>
                      <div className="flex gap-0.5">
                        {article.stages.map((stage) => (
                          <div
                            key={stage.id}
                            className={`w-2 h-6 rounded-sm ${
                              stage.status === 'COMPLETED' ? 'bg-emerald-500/60' :
                              stage.status === 'RUNNING' ? 'bg-blue-500/60 animate-pulse' :
                              stage.status === 'FAILED' ? 'bg-red-500/60' :
                              'bg-border'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
