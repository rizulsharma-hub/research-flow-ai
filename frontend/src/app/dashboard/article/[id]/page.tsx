'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PipelineTimeline } from '@/components/pipeline/PipelineTimeline';
import { LiveLogViewer } from '@/components/pipeline/LiveLogViewer';
import { ArticleViewer } from '@/components/article/ArticleViewer';
import { useArticle, useRetryArticle, useRetryFromStage } from '@/hooks/useArticle';
import { useSSE } from '@/hooks/useSSE';
import { useArticleStore } from '@/stores/articleStore';
import { PIPELINE_STAGES } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ArticlePage({ params }: PageProps) {
  const { id } = use(params);
  const { data: article, isLoading, error, refetch } = useArticle(id);
  const { mutate: retry, isPending: retrying } = useRetryArticle();
  const { mutate: retryStage, isPending: retryingStage } = useRetryFromStage();
  const { initStages, reset } = useArticleStore();
  const jobStatus = useArticleStore((s) => s.jobStatus);

  // Always connect SSE — don't gate on article status (article is undefined on first render)
  useSSE(id);

  // Reset store only when navigating to a different article
  useEffect(() => {
    reset();
  }, [id]);

  // Sync stage states from DB on every react-query fetch (initial load + 2s polling)
  useEffect(() => {
    if (article?.stages) {
      initStages(article.stages);
    }
  }, [article]);

  useEffect(() => {
    if (jobStatus === 'completed' || jobStatus === 'failed') {
      const timer = setTimeout(() => refetch(), 1000);
      return () => clearTimeout(timer);
    }
  }, [jobStatus, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) return notFound();

  const completedStages = article.stages?.filter((s) => s.status === 'COMPLETED').length ?? 0;
  const totalStages = PIPELINE_STAGES.length;
  const progress = Math.round((completedStages / totalStages) * 100);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border/50 flex-shrink-0">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <StatusIndicator status={article.status} />
            <h1 className="text-base font-semibold text-white truncate">{article.topic}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {article.primaryKeyword} · {article.country} · Created {formatRelativeTime(article.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {(article.status === 'RUNNING' || article.status === 'QUEUED') && (
            <div className="text-xs text-muted-foreground">
              {completedStages}/{totalStages} stages · {progress}%
            </div>
          )}
          {article.status === 'FAILED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => retry(id)}
              disabled={retrying || retryingStage}
            >
              {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Resume
            </Button>
          )}
          {(article.status === 'FAILED' || article.status === 'COMPLETED') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => retryStage({ id, stageName: 'keyword_analysis' })}
              disabled={retrying || retryingStage}
            >
              {retryingStage ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Restart All
            </Button>
          )}
        </div>
      </div>

      {article.errorMessage && (
        <div className="mx-6 mt-4 flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{article.errorMessage}</span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-hidden grid grid-cols-[320px_1fr]">
        {/* Pipeline Panel */}
        <div className="border-r border-border/50 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline
            </h2>
            {article.status === 'RUNNING' && (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <PipelineTimeline
            onRetry={() => retry(id)}
            onRetryStage={(stageName) => retryStage({ id, stageName })}
          />
          <LiveLogViewer />
        </div>

        {/* Article Panel */}
        <div className="overflow-hidden">
          {article.status === 'COMPLETED' || article.generatedArticle ? (
            <ArticleViewer article={article} />
          ) : (
            <PipelineWaiting status={article.status} progress={progress} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  if (status === 'RUNNING') return (
    <Badge variant="running">
      <Loader2 className="w-3 h-3 animate-spin mr-1" /> Running
    </Badge>
  );
  if (status === 'COMPLETED') return (
    <Badge variant="success">
      <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
    </Badge>
  );
  if (status === 'FAILED') return (
    <Badge variant="destructive">
      <XCircle className="w-3 h-3 mr-1" /> Failed
    </Badge>
  );
  return <Badge variant="secondary">Queued</Badge>;
}

function PipelineWaiting({ status, progress }: { status: string; progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">{progress}%</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {status === 'QUEUED' ? 'Queued for processing…' : 'Pipeline running…'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Watch the pipeline progress on the left. The article will appear here once generation is complete.
      </p>
    </div>
  );
}
