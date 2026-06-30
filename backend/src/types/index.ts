export type ArticleStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type StageStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type StageName =
  | 'keyword_analysis'
  | 'competitor_research'
  | 'deep_research'
  | 'outline_generation'
  | 'article_draft'
  | 'humanization'
  | 'seo_package'
  | 'quality_review'
  | 'final_compilation';

export type SSEEventType =
  | 'JOB_CREATED'
  | 'STAGE_STARTED'
  | 'STAGE_PROGRESS'
  | 'STAGE_THINKING'
  | 'STAGE_COMPLETED'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED';

export interface PipelineEvent {
  jobId: string;
  articleId: string;
  stage?: StageName;
  event: SSEEventType;
  message?: string;
  data?: unknown;
  timestamp: string;
}

export interface ArticleJobData {
  articleId: string;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  country: string;
  contentType: string;
  wordCount: number;
  referenceUrls?: string[];
}

export const PIPELINE_STAGES: { name: StageName; label: string; index: number }[] = [
  { name: 'keyword_analysis', label: 'Keyword Analysis', index: 0 },
  { name: 'competitor_research', label: 'Competitor Research', index: 1 },
  { name: 'deep_research', label: 'Deep Research', index: 2 },
  { name: 'outline_generation', label: 'Outline Generation', index: 3 },
  { name: 'article_draft', label: 'Article Draft', index: 4 },
  { name: 'humanization', label: 'Humanization Pass', index: 5 },
  { name: 'seo_package', label: 'SEO Package', index: 6 },
  { name: 'quality_review', label: 'Quality Review', index: 7 },
  { name: 'final_compilation', label: 'Final Compilation', index: 8 },
];

export interface KeywordAnalysisResult {
  searchIntent: string;
  intentDescription: string;
  audienceProfile: string;
  userGoals: string[];
  painPoints: string[];
  semanticEntities: string[];
  relatedQuestions: string[];
  lsiKeywords: string[];
  contentAngle: string;
}

export interface CompetitorResearchResult {
  topRankingPages: Array<{
    title: string;
    url: string;
    strength: string;
    wordCount: number;
  }>;
  commonTopics: string[];
  commonHeadings: string[];
  frequentlyAskedQuestions: string[];
  missingTopics: string[];
  contentGaps: string[];
  opportunities: string[];
}

export interface DeepResearchResult {
  industryOverview: string;
  statistics: Array<{ fact: string; source: string }>;
  trends: Array<{ trend: string; impact: string }>;
  expertInsights: Array<{ insight: string; attribution: string }>;
  painPoints: Array<{ problem: string; solution: string }>;
  opportunities: string[];
  keyTakeaways: string[];
}

export interface OutlineResult {
  h1: string;
  introduction: string;
  sections: Array<{
    h2: string;
    points: string[];
    subsections?: Array<{
      h3: string;
      points: string[];
    }>;
  }>;
  conclusion: string;
  estimatedWordCount: number;
}

export interface SeoPackageResult {
  metaTitle: string;
  metaDescription: string;
  faq: Array<{ question: string; answer: string }>;
  schema: Record<string, unknown>;
  internalLinks: Array<{ anchorText: string; topic: string }>;
}

export interface QualityReportResult {
  readability: number;
  seoScore: number;
  coverage: number;
  humanLikeness: number;
  overall: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
}

export interface CreateArticleInput {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  country: string;
  contentType: string;
  wordCount: number;
}
