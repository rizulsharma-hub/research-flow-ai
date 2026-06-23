import Link from 'next/link';
import {
  Sparkles, ArrowRight, Brain, Search, FileText, Zap,
  BarChart3, Globe, CheckCircle2, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PIPELINE_STEPS = [
  { icon: Search, label: 'Keyword Analysis', desc: 'Intent, entities, questions' },
  { icon: Globe, label: 'Competitor Research', desc: 'SERP gaps & opportunities' },
  { icon: Brain, label: 'Deep Research', desc: 'Stats, trends, expert data' },
  { icon: FileText, label: 'Outline Generation', desc: 'Structured H1/H2/H3 map' },
  { icon: Zap, label: 'Article Draft', desc: 'Full long-form content' },
  { icon: Sparkles, label: 'Humanization', desc: 'Natural expert voice' },
  { icon: BarChart3, label: 'SEO Package', desc: 'Meta, FAQ, schema' },
  { icon: CheckCircle2, label: 'Quality Review', desc: 'Scored across 4 dimensions' },
  { icon: Star, label: 'Final Compilation', desc: 'Publication-ready doc' },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'Powered by Claude',
    desc: 'Each stage uses Claude with specialized prompts crafted by expert SEO researchers and editors.',
  },
  {
    icon: Zap,
    title: 'Real-Time Streaming',
    desc: 'Watch every stage execute live. SSE streams progress from backend to browser with zero fake loading.',
  },
  {
    icon: Search,
    title: 'Deep Research First',
    desc: 'Industry stats, expert quotes, trends, and competitor gaps — all synthesized before a word is written.',
  },
  {
    icon: FileText,
    title: 'Human-Quality Output',
    desc: 'A dedicated humanization pass rewrites AI patterns out and injects natural rhythm and voice.',
  },
  {
    icon: BarChart3,
    title: 'Full SEO Package',
    desc: 'Meta title, description, FAQ schema, internal link suggestions — everything a post needs to rank.',
  },
  {
    icon: Star,
    title: 'Quality Scored',
    desc: 'Every article is audited on readability, SEO, coverage, and human-likeness before delivery.',
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: '$0',
    note: 'Your API key',
    features: ['5 articles / month', 'All 9 pipeline stages', 'Markdown export', 'Basic history'],
  },
  {
    name: 'Pro',
    price: '$29',
    note: '/ month',
    highlight: true,
    features: ['Unlimited articles', 'Priority queue', 'HTML + JSON export', 'Team access', 'API access'],
  },
  {
    name: 'Agency',
    price: '$99',
    note: '/ month',
    features: ['Everything in Pro', 'White-label', 'Custom prompts', 'Dedicated support', 'SLA'],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 backdrop-blur-xl bg-background/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-white">ResearchFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard">
              <Button size="sm" variant="glow">
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Claude · 9-Stage AI Pipeline
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.05] text-balance">
            Research. Write.{' '}
            <span className="gradient-text">Rank.</span>
          </h1>

          <p className="text-xl text-foreground/60 mb-10 max-w-2xl mx-auto text-balance leading-relaxed">
            ResearchFlow AI runs a 9-stage pipeline — from keyword analysis to quality review —
            and streams every step live to your browser. No fake loading. Real AI at work.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/new">
              <Button size="xl" variant="glow">
                Generate Your First Article
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="xl" variant="outline">
                View Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Bring your own Claude API key · Local-first · Open architecture
          </p>
        </div>
      </section>

      {/* Pipeline Visualization */}
      <section className="py-20 px-6 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">The 9-Stage Pipeline</h2>
            <p className="text-foreground/60">Every stage streams live progress to your browser</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {PIPELINE_STEPS.map(({ icon: Icon, label, desc }, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-200">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                </div>
                <p className="text-xs font-medium text-white/80 leading-tight mb-1">{label}</p>
                <p className="text-xs text-muted-foreground leading-tight hidden md:block">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-3">Everything you need to rank</h2>
            <p className="text-foreground/60">Not just an AI writer. A complete content research system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-6 hover:border-primary/20 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-3">Simple pricing</h2>
            <p className="text-foreground/60">Start free with your Claude API key. Upgrade when you need more.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map(({ name, price, note, features, highlight }) => (
              <div
                key={name}
                className={`glass-card p-6 ${highlight ? 'border-primary/40 glow-purple' : ''}`}
              >
                {highlight && (
                  <div className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-4 inline-block">
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-white text-lg">{name}</h3>
                <div className="mt-3 mb-6">
                  <span className="text-3xl font-bold text-white">{price}</span>
                  <span className="text-muted-foreground text-sm ml-1">{note}</span>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/70">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/new">
                  <Button
                    variant={highlight ? 'glow' : 'outline'}
                    className="w-full"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center border-t border-border/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to write better content, faster?</h2>
          <p className="text-foreground/60 mb-8">
            Add your Claude API key in Settings and start generating your first article in under a minute.
          </p>
          <Link href="/dashboard/new">
            <Button size="xl" variant="glow">
              Start Generating
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 ResearchFlow AI · Built with Next.js 15, Claude API, and BullMQ
        </p>
      </footer>
    </div>
  );
}
