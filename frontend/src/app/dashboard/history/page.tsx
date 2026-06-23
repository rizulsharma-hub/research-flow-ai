'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useArticles, useDeleteArticle } from '@/hooks/useArticle';
import { formatDate, truncate, scoreColor } from '@/lib/utils';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useArticles(page);
  const { mutate: deleteArticle, isPending: deleting } = useDeleteArticle();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const articles = data?.data ?? [];

  async function handleDelete(id: string) {
    setDeletingId(id);
    deleteArticle(id, { onSettled: () => setDeletingId(null) });
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-muted-foreground mt-1">
          All generated articles ({data?.meta.total ?? 0} total)
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Topic</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Keyword</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-border/30 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/article/${article.id}`} className="text-sm text-white hover:text-primary transition-colors">
                        {truncate(article.topic, 50)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-primary/70">{article.primaryKeyword}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={article.status} />
                    </td>
                    <td className="px-4 py-3">
                      {article.qualityReport?.overall ? (
                        <span className={`text-sm font-medium ${scoreColor(article.qualityReport.overall)}`}>
                          {article.qualityReport.overall}/100
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(article.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link href={`/dashboard/article/${article.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-400"
                          onClick={() => handleDelete(article.id)}
                          disabled={deleting && deletingId === article.id}
                        >
                          {deleting && deletingId === article.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {articles.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">No articles found.</div>
            )}
          </div>

          {data && data.meta.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground py-1.5 px-3">
                {page} / {data.meta.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'secondary' | 'running' | 'success' | 'destructive' }> = {
    QUEUED: { label: 'Queued', variant: 'secondary' },
    RUNNING: { label: 'Running', variant: 'running' },
    COMPLETED: { label: 'Completed', variant: 'success' },
    FAILED: { label: 'Failed', variant: 'destructive' },
  };
  const c = map[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
