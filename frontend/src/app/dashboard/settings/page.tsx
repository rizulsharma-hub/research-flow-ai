'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings, useUpdateSettings } from '@/hooks/useArticle';
import { COUNTRIES, CONTENT_TYPES } from '@/lib/utils';

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutateAsync, isPending } = useUpdateSettings();
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    nvidiaApiKey: '',
    defaultWordCount: '2000',
    defaultCountry: 'United States',
    defaultAudience: '',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        nvidiaApiKey: '',
        defaultWordCount: settings.defaultWordCount ?? '2000',
        defaultCountry: settings.defaultCountry ?? 'United States',
        defaultAudience: settings.defaultAudience ?? '',
      });
    }
  }, [settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      defaultWordCount: Number(form.defaultWordCount),
      defaultCountry: form.defaultCountry,
      defaultAudience: form.defaultAudience,
    };
    if (form.nvidiaApiKey.trim()) {
      payload.nvidiaApiKey = form.nvidiaApiKey.trim();
    }
    await mutateAsync(payload);
    setSaved(true);
    setForm((f) => ({ ...f, nvidiaApiKey: '' }));
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your API key and default generation preferences.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          <section className="glass-card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white border-b border-border/50 pb-3">API Configuration</h2>

            <div className="space-y-2">
              <Label htmlFor="apiKey">NVIDIA API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  placeholder={settings?.nvidiaApiKey ? `Current key: ${settings.nvidiaApiKey}` : 'nvapi-...'}
                  value={form.nvidiaApiKey}
                  onChange={(e) => setForm((f) => ({ ...f, nvidiaApiKey: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey((v) => !v)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Free key from{' '}
                <a href="https://build.nvidia.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  build.nvidia.com
                </a>{' '}
                → click <strong>Get API Key</strong>. Leave blank to keep the existing key.
              </p>
            </div>
          </section>

          <section className="glass-card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white border-b border-border/50 pb-3">Generation Defaults</h2>

            <div className="space-y-2">
              <Label>Default Word Count</Label>
              <Input
                type="number"
                min={300}
                max={10000}
                step={100}
                value={form.defaultWordCount}
                onChange={(e) => setForm((f) => ({ ...f, defaultWordCount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Country</Label>
              <Select
                value={form.defaultCountry}
                onValueChange={(v) => setForm((f) => ({ ...f, defaultCountry: v }))}
              >
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
              <Label>Default Target Audience</Label>
              <Input
                placeholder="e.g. Marketing professionals, SaaS founders"
                value={form.defaultAudience}
                onChange={(e) => setForm((f) => ({ ...f, defaultAudience: e.target.value }))}
              />
            </div>
          </section>

          <Button type="submit" variant="glow" disabled={isPending} className="w-full">
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check className="w-4 h-4 text-emerald-400" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Settings</>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
