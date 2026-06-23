'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SeoPackage } from '@/lib/api';

interface Props {
  seoPackage: SeoPackage | null | undefined;
}

export function SeoViewer({ seoPackage }: Props) {
  const [schemaExpanded, setSchemaExpanded] = useState(false);
  const [copied, setCopied] = useState('');

  if (!seoPackage) {
    return (
      <p className="text-muted-foreground text-sm text-center py-12">
        SEO package will appear after the SEO stage completes.
      </p>
    );
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Meta Tags</h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">Meta Title</label>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${seoPackage.metaTitle && seoPackage.metaTitle.length > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {seoPackage.metaTitle?.length ?? 0}/60
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copy(seoPackage.metaTitle ?? '', 'title')}
                >
                  {copied === 'title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 font-medium text-sm text-white">
              {seoPackage.metaTitle ?? '—'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">Meta Description</label>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${seoPackage.metaDescription && seoPackage.metaDescription.length > 160 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {seoPackage.metaDescription?.length ?? 0}/160
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copy(seoPackage.metaDescription ?? '', 'desc')}
                >
                  {copied === 'desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground/80">
              {seoPackage.metaDescription ?? '—'}
            </div>
          </div>
        </div>

        <div className="border border-border/30 rounded-lg p-3 bg-black/20">
          <p className="text-xs text-muted-foreground mb-1">SERP Preview</p>
          <p className="text-base text-blue-400 hover:underline cursor-pointer font-medium leading-tight">
            {seoPackage.metaTitle ?? 'Title'}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">yoursite.com/article-slug</p>
          <p className="text-xs text-foreground/60 mt-1 line-clamp-2">
            {seoPackage.metaDescription ?? 'Description'}
          </p>
        </div>
      </section>

      {seoPackage.faq && seoPackage.faq.length > 0 && (
        <section className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">FAQ Section</h3>
          <div className="space-y-4">
            {seoPackage.faq.map((item, i) => (
              <div key={i} className="border-b border-border/30 last:border-0 pb-4 last:pb-0">
                <p className="text-sm font-medium text-white mb-1.5">Q: {item.question}</p>
                <p className="text-sm text-foreground/70">A: {item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {seoPackage.internalLinks && seoPackage.internalLinks.length > 0 && (
        <section className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Internal Link Suggestions</h3>
          <div className="space-y-2">
            {seoPackage.internalLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="flex-shrink-0 font-mono text-xs">
                  {link.anchorText}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <span className="text-foreground/70">{link.topic}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {seoPackage.schema && (
        <section className="glass-card p-5">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setSchemaExpanded((v) => !v)}
          >
            <h3 className="text-sm font-semibold text-white">JSON-LD Schema</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); copy(JSON.stringify(seoPackage.schema, null, 2), 'schema'); }}
                className="h-7 text-xs"
              >
                {copied === 'schema' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy
              </Button>
              {schemaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
          {schemaExpanded && (
            <pre className="mt-3 text-xs font-mono text-muted-foreground bg-black/30 rounded-lg p-4 overflow-x-auto">
              {JSON.stringify(seoPackage.schema, null, 2)}
            </pre>
          )}
        </section>
      )}
    </div>
  );
}
