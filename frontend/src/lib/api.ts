const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface Article {
  id: string;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  country: string;
  contentType: string;
  wordCount: number;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  jobId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  stages?: PipelineStage[];
  researchReport?: ResearchReport | null;
  generatedArticle?: GeneratedArticle | null;
  seoPackage?: SeoPackage | null;
  qualityReport?: QualityReport | null;
}

export interface PipelineStage {
  id: string;
  articleId: string;
  stageName: string;
  stageIndex: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result: unknown;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ResearchReport {
  id: string;
  content: Record<string, unknown>;
}

export interface GeneratedArticle {
  id: string;
  outline: Record<string, unknown> | null;
  draft: string | null;
  humanized: string | null;
  final: string | null;
  wordCount: number | null;
}

export interface SeoPackage {
  id: string;
  metaTitle: string | null;
  metaDescription: string | null;
  faq: Array<{ question: string; answer: string }> | null;
  schema: Record<string, unknown> | null;
  internalLinks: Array<{ anchorText: string; topic: string }> | null;
}

export interface QualityReport {
  id: string;
  readability: number | null;
  seoScore: number | null;
  coverage: number | null;
  humanLikeness: number | null;
  overall: number | null;
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  } | null;
}

export interface CreateArticleInput {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  country: string;
  contentType: string;
  wordCount: number;
  referenceUrls?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }

  const json = await res.json();
  return json.data as T;
}

export const api = {
  articles: {
    create: (data: CreateArticleInput) =>
      request<Article>('/api/articles', { method: 'POST', body: JSON.stringify(data) }),

    list: (page = 1, limit = 20) =>
      fetch(`${API_URL}/api/articles?page=${page}&limit=${limit}`)
        .then((r) => r.json())
        .then((j) => j as PaginatedResponse<Article>),

    get: (id: string) => request<Article>(`/api/articles/${id}`),

    retry: (id: string) =>
      request<{ message: string }>(`/api/articles/${id}/retry`, { method: 'POST' }),

    retryFromStage: (id: string, stageName: string) =>
      request<{ message: string }>(`/api/articles/${id}/retry-stage`, {
        method: 'POST',
        body: JSON.stringify({ stageName }),
      }),

    delete: (id: string) =>
      request<{ message: string }>(`/api/articles/${id}`, { method: 'DELETE' }),
  },

  settings: {
    get: () => request<Record<string, string>>('/api/settings'),
    update: (data: Record<string, unknown>) =>
      request<{ message: string }>('/api/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  eventsUrl: (articleId: string) => `${API_URL}/api/articles/${articleId}/events`,
};
