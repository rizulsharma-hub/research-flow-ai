import { Sparkles } from 'lucide-react';
import { NewArticleForm } from '@/components/forms/NewArticleForm';

export default function NewArticlePage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-medium text-primary uppercase tracking-wider">9-Stage Pipeline</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Generate New Article</h1>
        <p className="text-muted-foreground">
          Fill in your topic details. The AI pipeline will research, write, humanize, and SEO-optimize
          your article — streaming every step live.
        </p>
      </div>

      <div className="glass-card p-6">
        <NewArticleForm />
      </div>
    </div>
  );
}
