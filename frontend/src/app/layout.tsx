import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ResearchFlow AI — AI Research & Blog Generation Platform',
  description:
    'Generate expert-quality, SEO-optimized long-form content with a 9-stage AI pipeline. Research, write, humanize, and optimize — all in one place.',
  keywords: ['AI writing', 'SEO content', 'blog generation', 'research AI', 'Claude AI'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
