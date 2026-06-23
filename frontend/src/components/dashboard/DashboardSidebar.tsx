'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, LayoutDashboard, History, Settings, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/new', label: 'New Article', icon: PenLine, exact: false },
  { href: '/dashboard/history', label: 'History', icon: History, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/50 h-screen sticky top-0 flex flex-col bg-background/80 backdrop-blur-xl">
      <div className="p-5 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">ResearchFlow</p>
            <p className="text-xs text-muted-foreground">AI Content Studio</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
              isActive(href, exact)
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="glass-card p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-white">9-Stage Pipeline</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Keyword → Research → Outline → Draft → Humanize → SEO → Quality
          </p>
        </div>
      </div>
    </aside>
  );
}
