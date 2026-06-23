export const PIPELINE_STAGES = [
  { name: 'keyword_analysis', label: 'Keyword Analysis', index: 0 },
  { name: 'competitor_research', label: 'Competitor Research', index: 1 },
  { name: 'deep_research', label: 'Deep Research', index: 2 },
  { name: 'outline_generation', label: 'Outline Generation', index: 3 },
  { name: 'article_draft', label: 'Article Draft', index: 4 },
  { name: 'humanization', label: 'Humanization Pass', index: 5 },
  { name: 'seo_package', label: 'SEO Package', index: 6 },
  { name: 'quality_review', label: 'Quality Review', index: 7 },
  { name: 'final_compilation', label: 'Final Compilation', index: 8 },
] as const;

export type StageName = (typeof PIPELINE_STAGES)[number]['name'];
