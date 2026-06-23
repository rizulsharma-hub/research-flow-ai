'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateArticle } from '@/hooks/useArticle';
import { useArticleStore } from '@/stores/articleStore';
import { CONTENT_TYPES, COUNTRIES } from '@/lib/utils';

export function NewArticleForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateArticle();
  const reset = useArticleStore((s) => s.reset);

  const [form, setForm] = useState({
    topic: '',
    primaryKeyword: '',
    secondaryKeywordsRaw: '',
    targetAudience: '',
    country: 'United States',
    contentType: 'blog_post',
    wordCount: 2000,
  });
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.topic.trim() || !form.primaryKeyword.trim()) {
      setError('Topic and primary keyword are required.');
      return;
    }

    const secondaryKeywords = form.secondaryKeywordsRaw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      reset();
      const article = await mutateAsync({
        topic: form.topic.trim(),
        primaryKeyword: form.primaryKeyword.trim(),
        secondaryKeywords,
        targetAudience: form.targetAudience.trim() || 'General audience',
        country: form.country,
        contentType: form.contentType,
        wordCount: form.wordCount,
      });

      router.push(`/dashboard/article/${article.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="topic">
            Topic <span className="text-red-400">*</span>
          </Label>
          <Textarea
            id="topic"
            placeholder="e.g. How to build a personal brand as a software engineer in 2025"
            value={form.topic}
            onChange={(e) => set('topic', e.target.value)}
            rows={2}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryKeyword">
            Primary Keyword <span className="text-red-400">*</span>
          </Label>
          <Input
            id="primaryKeyword"
            placeholder="e.g. personal brand software engineer"
            value={form.primaryKeyword}
            onChange={(e) => set('primaryKeyword', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryKeywords">
            Secondary Keywords
            <span className="text-muted-foreground text-xs ml-2">(comma-separated)</span>
          </Label>
          <Input
            id="secondaryKeywords"
            placeholder="e.g. developer brand, coding portfolio, tech influencer"
            value={form.secondaryKeywordsRaw}
            onChange={(e) => set('secondaryKeywordsRaw', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            placeholder="e.g. Mid-level software engineers, 3-7 years experience"
            value={form.targetAudience}
            onChange={(e) => set('targetAudience', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Country</Label>
          <Select value={form.country} onValueChange={(v) => set('country', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Content Type</Label>
          <Select value={form.contentType} onValueChange={(v) => set('contentType', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wordCount">
            Target Word Count
            <span className="text-muted-foreground text-xs ml-2">(300 – 10,000)</span>
          </Label>
          <Input
            id="wordCount"
            type="number"
            min={300}
            max={10000}
            step={100}
            value={form.wordCount}
            onChange={(e) => set('wordCount', Number(e.target.value))}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" size="lg" variant="glow" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Starting Pipeline...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Article
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Runs a 9-stage AI pipeline. Estimated time: 3–8 minutes depending on word count.
      </p>
    </form>
  );
}
