import OpenAI from 'openai';
import type {
  ArticleJobData,
  KeywordAnalysisResult,
  CompetitorResearchResult,
  DeepResearchResult,
  OutlineResult,
  SeoPackageResult,
  QualityReportResult,
} from '../types/index.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const MODEL = 'meta/llama-3.3-70b-instruct';

function getClient(): OpenAI {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) {
    throw new Error(
      'NVIDIA API key not configured. Add NVIDIA_API_KEY=nvapi-... to backend/.env or set it in Dashboard → Settings.'
    );
  }
  return new OpenAI({ apiKey: key, baseURL: NVIDIA_BASE_URL });
}

const CALL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes per stage

async function complete(
  client: OpenAI,
  system: string,
  prompt: string,
  onChunk?: (text: string) => void,
  _onReasoning?: (text: string) => void,
  _budget = 4096,
  label = 'unknown'
): Promise<string> {
  console.log(`[NVIDIA] ${label} — calling ${MODEL}`);
  const t0 = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

  let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  try {
    stream = await client.chat.completions.create(
      {
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        stream: true,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 8192,
      },
      { signal: controller.signal }
    );
  } catch (err) {
    clearTimeout(timeout);
    console.error(`[NVIDIA] ${label} — request failed:`, err);
    throw err;
  }

  let full = '';
  let tokens = 0;
  let firstAt: number | null = null;

  try {
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (!text) continue;
      if (firstAt === null) {
        firstAt = Date.now();
        console.log(`[NVIDIA] ${label} — first token at +${firstAt - t0}ms`);
      }
      tokens++;
      full += text;
      onChunk?.(text);
    }
  } finally {
    clearTimeout(timeout);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[NVIDIA] ${label} — done in ${elapsed}s | tokens=${tokens} chars=${full.length}`);

  if (!full.trim()) {
    throw new Error(`${label}: model returned empty response`);
  }

  return full;
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // 1. Happy path
  try { return JSON.parse(cleaned) as T; } catch { /* fall through */ }

  // 2. Extract largest {...} block (handles leading/trailing prose)
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]) as T; } catch { /* fall through */ }

    // 3. Truncated JSON — try to auto-close open arrays/objects
    const partial = match[0];
    const repaired = autoClose(partial);
    try { return JSON.parse(repaired) as T; } catch { /* fall through */ }
  }

  throw new Error(`Model returned invalid JSON: ${cleaned.slice(0, 400)}`);
}

/** Closes unclosed brackets/braces so truncated JSON from token limits can be parsed */
function autoClose(s: string): string {
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  // Drop any trailing comma before we close
  let result = s.trimEnd().replace(/,\s*$/, '');
  // Close everything in reverse order
  while (stack.length) result += stack.pop();
  return result;
}

// ─── Stage 1: Keyword Analysis ─────────────────────────────────────────────

export async function runKeywordAnalysis(
  data: ArticleJobData,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<KeywordAnalysisResult> {
  const client = getClient();

  const system = `You are an expert SEO strategist with 15+ years of experience in keyword research and content strategy.
CRITICAL: Your ENTIRE response must be valid JSON — no markdown fences, no commentary before or after the JSON object.`;

  const prompt = `Perform a comprehensive keyword analysis for:

Topic: ${data.topic}
Primary Keyword: ${data.primaryKeyword}
Secondary Keywords: ${data.secondaryKeywords.join(', ') || 'none'}
Target Audience: ${data.targetAudience}
Country: ${data.country}
Content Type: ${data.contentType}
Target Word Count: ${data.wordCount}

Return ONLY a JSON object with this exact structure:
{
  "searchIntent": "informational",
  "intentDescription": "2-3 sentence explanation of what users want",
  "audienceProfile": "Who is searching this and their context",
  "userGoals": ["goal 1", "goal 2", "goal 3", "goal 4", "goal 5"],
  "painPoints": ["pain 1", "pain 2", "pain 3", "pain 4"],
  "semanticEntities": ["entity 1", "entity 2", "entity 3", "entity 4", "entity 5", "entity 6", "entity 7", "entity 8", "entity 9", "entity 10"],
  "relatedQuestions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7", "question 8"],
  "lsiKeywords": ["kw 1", "kw 2", "kw 3", "kw 4", "kw 5", "kw 6", "kw 7", "kw 8", "kw 9", "kw 10"],
  "contentAngle": "The unique positioning angle that will make this content stand out"
}`;

  const text = await complete(client, system, prompt, onChunk, onReasoning, 3072, "keyword_analysis");
  return parseJSON<KeywordAnalysisResult>(text);
}

// ─── Stage 2: Competitor Research ──────────────────────────────────────────

export async function runCompetitorResearch(
  data: ArticleJobData,
  keywordAnalysis: KeywordAnalysisResult,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<CompetitorResearchResult> {
  const client = getClient();

  const system = `You are an expert content strategist and competitive intelligence analyst.
CRITICAL: Your ENTIRE response must be valid JSON — no markdown fences, no commentary.`;

  const prompt = `Perform competitor content analysis for:

Topic: ${data.topic}
Primary Keyword: ${data.primaryKeyword}
Country: ${data.country}
Search Intent: ${keywordAnalysis.searchIntent} — ${keywordAnalysis.intentDescription}

Return ONLY a JSON object:
{
  "topRankingPages": [
    {"title": "Title that would rank #1", "url": "domain.com/slug", "strength": "Specific ranking reason", "wordCount": 3200},
    {"title": "Title #2", "url": "domain2.com/slug", "strength": "Ranking reason", "wordCount": 2800},
    {"title": "Title #3", "url": "domain3.com/slug", "strength": "Ranking reason", "wordCount": 2100},
    {"title": "Title #4", "url": "domain4.com/slug", "strength": "Ranking reason", "wordCount": 1900},
    {"title": "Title #5", "url": "domain5.com/slug", "strength": "Ranking reason", "wordCount": 2400}
  ],
  "commonTopics": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5", "topic 6", "topic 7", "topic 8"],
  "commonHeadings": ["H2 heading 1", "heading 2", "heading 3", "heading 4", "heading 5", "heading 6", "heading 7", "heading 8", "heading 9", "heading 10"],
  "frequentlyAskedQuestions": ["question 1", "question 2", "question 3", "question 4", "question 5", "question 6", "question 7", "question 8"],
  "missingTopics": ["important topic most articles ignore", "missing 2", "missing 3", "missing 4", "missing 5"],
  "contentGaps": ["specific gap in existing content", "gap 2", "gap 3", "gap 4", "gap 5"],
  "opportunities": ["concrete differentiation opportunity", "opportunity 2", "opportunity 3", "opportunity 4"]
}`;

  const text = await complete(client, system, prompt, onChunk, onReasoning, 3072, "competitor_research");
  return parseJSON<CompetitorResearchResult>(text);
}

// ─── Stage 3: Deep Research ─────────────────────────────────────────────────

export async function runDeepResearch(
  data: ArticleJobData,
  keywordAnalysis: KeywordAnalysisResult,
  competitorResearch: CompetitorResearchResult,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<DeepResearchResult> {
  const client = getClient();

  const system = `You are a senior investigative researcher and industry analyst. You produce fact-rich, nuanced research grounded in real-world data.
CRITICAL: Your ENTIRE response must be valid JSON — no markdown fences, no commentary.`;

  const prompt = `Create a comprehensive research report for:

Topic: ${data.topic}
Primary Keyword: ${data.primaryKeyword}
Target Audience: ${data.targetAudience}
Unique Content Angle: ${keywordAnalysis.contentAngle}
Key Gaps to Address: ${competitorResearch.contentGaps.join('; ')}
Missing Topics to Cover: ${competitorResearch.missingTopics.join('; ')}

Return ONLY a JSON object:
{
  "industryOverview": "3-4 substantive paragraphs: current state, market size/growth, key players, recent evolution. Be specific with numbers and named examples.",
  "statistics": [
    {"fact": "Specific credible statistic — e.g. '72% of B2B buyers...'", "source": "Forrester Research, 2024"},
    {"fact": "Statistic 2", "source": "Source 2"},
    {"fact": "Statistic 3", "source": "Source 3"},
    {"fact": "Statistic 4", "source": "Source 4"},
    {"fact": "Statistic 5", "source": "Source 5"},
    {"fact": "Statistic 6", "source": "Source 6"},
    {"fact": "Statistic 7", "source": "Source 7"},
    {"fact": "Statistic 8", "source": "Source 8"}
  ],
  "trends": [
    {"trend": "Trend name", "impact": "2-3 sentences on real-world impact"},
    {"trend": "Trend 2", "impact": "Impact"},
    {"trend": "Trend 3", "impact": "Impact"},
    {"trend": "Trend 4", "impact": "Impact"},
    {"trend": "Trend 5", "impact": "Impact"}
  ],
  "expertInsights": [
    {"insight": "Non-obvious expert observation that changes how you think about the topic", "attribution": "Dr. Sarah Chen, VP Research, Gartner"},
    {"insight": "Expert insight 2", "attribution": "Marcus Webb, Founder, ContentOps Institute"},
    {"insight": "Expert insight 3", "attribution": "Realistic expert name and title"},
    {"insight": "Expert insight 4", "attribution": "Realistic expert name and title"}
  ],
  "painPoints": [
    {"problem": "Concrete scenario the audience faces", "solution": "Actionable solution with implementation steps"},
    {"problem": "Problem 2", "solution": "Solution 2"},
    {"problem": "Problem 3", "solution": "Solution 3"},
    {"problem": "Problem 4", "solution": "Solution 4"},
    {"problem": "Problem 5", "solution": "Solution 5"}
  ],
  "opportunities": ["Specific actionable opportunity", "Opportunity 2", "Opportunity 3", "Opportunity 4", "Opportunity 5"],
  "keyTakeaways": ["Critical insight 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5", "Takeaway 6"]
}`;

  const text = await complete(client, system, prompt, onChunk, onReasoning, 6144, "deep_research");
  return parseJSON<DeepResearchResult>(text);
}

// ─── Stage 4: Outline Generation ───────────────────────────────────────────

export async function runOutlineGeneration(
  data: ArticleJobData,
  keywordAnalysis: KeywordAnalysisResult,
  competitorResearch: CompetitorResearchResult,
  researchReport: DeepResearchResult,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<OutlineResult> {
  const client = getClient();

  const system = `You are a senior content architect who creates outlines that produce high-ranking, deeply satisfying long-form content.
CRITICAL: Your ENTIRE response must be valid JSON — no markdown fences, no commentary.`;

  const prompt = `Create a comprehensive content outline for:

Topic: ${data.topic}
Primary Keyword: "${data.primaryKeyword}"
Secondary Keywords: ${data.secondaryKeywords.join(', ') || 'none'}
Search Intent: ${keywordAnalysis.searchIntent}
Content Angle: ${keywordAnalysis.contentAngle}
Target Word Count: ${data.wordCount} words
Target Audience: ${data.targetAudience}
Key Takeaways to Incorporate: ${researchReport.keyTakeaways.join('; ')}
Content Gaps to Address: ${competitorResearch.contentGaps.join('; ')}

Return ONLY a JSON object:
{
  "h1": "Compelling H1 that includes primary keyword and promises specific value",
  "introduction": "3-4 sentence intro hook: surprising fact or scenario, reader's exact problem, specific outcome promised, credibility established",
  "sections": [
    {
      "h2": "Section heading with semantic keywords",
      "points": ["Specific point", "Data or stat to cite", "Real-world example", "Actionable takeaway"],
      "subsections": [
        {
          "h3": "Subsection heading",
          "points": ["Specific point", "Example or data"]
        }
      ]
    }
  ],
  "conclusion": "What to summarize, what CTA to include, forward-looking statement",
  "estimatedWordCount": ${data.wordCount}
}

Requirements: 6-8 major H2 sections, 2-4 subsections where depth is needed, logical build from problem → context → solution → implementation → results`;

  const text = await complete(client, system, prompt, onChunk, onReasoning, 6144, "outline_generation");
  return parseJSON<OutlineResult>(text);
}

// ─── Stage 5: Article Draft ─────────────────────────────────────────────────

export async function runArticleDraft(
  data: ArticleJobData,
  keywordAnalysis: KeywordAnalysisResult,
  researchReport: DeepResearchResult,
  outline: OutlineResult,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<string> {
  const client = getClient();

  const system = `You are an expert long-form content writer. Your writing is clear, substantive, and free of fluff.
Every paragraph earns its place. You back claims with data and use concrete named examples.
Format output as clean markdown. Do NOT wrap in code fences.`;

  const prompt = `Write a complete ~${data.wordCount}-word article.

TOPIC: ${data.topic}
PRIMARY KEYWORD: "${data.primaryKeyword}"
SECONDARY KEYWORDS: ${data.secondaryKeywords.join(', ') || 'none'}
TARGET AUDIENCE: ${data.targetAudience}
CONTENT ANGLE: ${keywordAnalysis.contentAngle}

OUTLINE:
H1: ${outline.h1}
Introduction: ${outline.introduction}
${outline.sections.map((s, i) => `## ${i + 1}: ${s.h2}\nCover: ${s.points.join(' | ')}${s.subsections?.map(sub => `\n  ### ${sub.h3}: ${sub.points.join(' | ')}`).join('') ?? ''}`).join('\n\n')}
Conclusion: ${outline.conclusion}

KEY RESEARCH TO WEAVE IN:
${researchReport.industryOverview.slice(0, 400)}

Statistics (cite naturally):
${researchReport.statistics.slice(0, 6).map(s => `- "${s.fact}" (${s.source})`).join('\n')}

Expert quotes:
"${researchReport.expertInsights[0]?.insight}" — ${researchReport.expertInsights[0]?.attribution}
"${researchReport.expertInsights[1]?.insight}" — ${researchReport.expertInsights[1]?.attribution}

RULES:
- Start with a hook (surprising fact, bold claim, vivid scenario) — never "In today's..."
- Each H2 section minimum 150 words
- Address reader as "you"
- One specific named real-world example per major section
- Strong action-oriented conclusion
- FORBIDDEN: "delve", "leverage", "unlock", "game-changing", "cutting-edge", "seamlessly", "robust", "revolutionize"

Write the full article now:`;

  return complete(client, system, prompt, onChunk, onReasoning, 12288, "article_draft");
}

// ─── Stage 6: Humanization ──────────────────────────────────────────────────

export async function runHumanization(
  draft: string,
  data: ArticleJobData,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<string> {
  const client = getClient();

  const system = `You are a senior editor at a top-tier publication. You transform AI content into articles that read like a seasoned human expert wrote them.
Fix AI patterns: overly parallel structures, predictable transitions, generic examples, hedging language, hollow enthusiasm.
Format output as clean markdown. Do NOT wrap in code fences.`;

  const prompt = `Rewrite this article to read like an experienced human expert wrote it.

TOPIC: ${data.topic}
TARGET AUDIENCE: ${data.targetAudience}

CHANGES TO MAKE:
1. Break repetitive sentence rhythm — mix short (5-8 words) with complex (25-35 words) sentences
2. Replace every generic opener with something direct and specific
3. Add 2-3 first-person observations: "In my experience...", "What surprised me most..."
4. Sharpen every transition — earned, not formulaic
5. Replace vague examples with specific named ones
6. Cut any sentence that says nothing new
7. Make the conclusion memorable

STRICTLY FORBIDDEN — replace every instance:
"delve into" | "leverage" | "unlock" | "game-changing" | "cutting-edge" | "in today's fast-paced world" | "seamlessly" | "robust" | "comprehensive solution" | "revolutionize" | "transformative" | "It's worth noting" | "needless to say" | "at the end of the day" | "In conclusion" | "To summarize"

ORIGINAL DRAFT:
${draft.slice(0, 9000)}

Return the complete rewritten article in markdown:`;

  return complete(client, system, prompt, onChunk, onReasoning, 8192, "humanization");
}

// ─── Stage 7: SEO Package ───────────────────────────────────────────────────

export async function runSeoPackage(
  data: ArticleJobData,
  article: string,
  keywordAnalysis: KeywordAnalysisResult,
  competitorResearch: CompetitorResearchResult,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<SeoPackageResult> {
  const client = getClient();

  const system = `You are an expert technical SEO specialist and conversion copywriter.
CRITICAL: Your ENTIRE response must be valid JSON — no markdown fences, no commentary.`;

  const prompt = `Generate a complete SEO package for:

TOPIC: ${data.topic}
PRIMARY KEYWORD: "${data.primaryKeyword}"
SECONDARY KEYWORDS: ${data.secondaryKeywords.join(', ') || 'none'}
TARGET AUDIENCE: ${data.targetAudience}
ARTICLE OPENING: ${article.slice(0, 500)}
RELATED QUESTIONS: ${competitorResearch.frequentlyAskedQuestions.slice(0, 6).join(' | ')}

Return ONLY a JSON object:
{
  "metaTitle": "Under 60 characters. Primary keyword in first 40 chars. Specific, benefit-driven.",
  "metaDescription": "Exactly 150-158 characters. Include primary keyword. State what reader learns. Subtle CTA.",
  "faq": [
    {"question": "Specific question users actually search verbatim", "answer": "Direct complete answer in 2-3 sentences."},
    {"question": "Question 2", "answer": "Answer 2"},
    {"question": "Question 3", "answer": "Answer 3"},
    {"question": "Question 4", "answer": "Answer 4"},
    {"question": "Question 5", "answer": "Answer 5"},
    {"question": "Question 6", "answer": "Answer 6"},
    {"question": "Question 7", "answer": "Answer 7"}
  ],
  "schema": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Full article title",
    "description": "Article description",
    "keywords": "${data.primaryKeyword}, ${data.secondaryKeywords.slice(0, 3).join(', ')}",
    "author": {"@type": "Person", "name": "Author Name"},
    "publisher": {"@type": "Organization", "name": "Site Name"},
    "datePublished": "${new Date().toISOString().split('T')[0]}",
    "dateModified": "${new Date().toISOString().split('T')[0]}"
  },
  "internalLinks": [
    {"anchorText": "Natural anchor text", "topic": "Specific related topic to link to"},
    {"anchorText": "Anchor 2", "topic": "Topic 2"},
    {"anchorText": "Anchor 3", "topic": "Topic 3"},
    {"anchorText": "Anchor 4", "topic": "Topic 4"},
    {"anchorText": "Anchor 5", "topic": "Topic 5"}
  ]
}`;

  const text = await complete(client, system, prompt, onChunk, onReasoning, 3072, "seo_package");
  return parseJSON<SeoPackageResult>(text);
}

// ─── Stage 8: Quality Review ────────────────────────────────────────────────

export async function runQualityReview(
  data: ArticleJobData,
  article: string,
  keywordAnalysis: KeywordAnalysisResult,
  seoPackage: SeoPackageResult,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<QualityReportResult> {
  const client = getClient();

  const system = `You are a senior content quality director. You audit articles with critical precision.
Most articles score 65-85. Identify real, specific problems. Do not inflate scores.
CRITICAL: Your ENTIRE response must be valid JSON — no markdown fences, no commentary.`;

  const prompt = `Audit this article across four quality dimensions.

Primary Keyword: "${data.primaryKeyword}"
Search Intent: ${keywordAnalysis.searchIntent} — ${keywordAnalysis.intentDescription}
Meta Title (${seoPackage.metaTitle?.length ?? 0} chars): "${seoPackage.metaTitle}"
Meta Description (${seoPackage.metaDescription?.length ?? 0} chars): "${seoPackage.metaDescription}"

ARTICLE SAMPLE:
${article.slice(0, 2000)}

Return ONLY a JSON object:
{
  "readability": 78,
  "seoScore": 81,
  "coverage": 84,
  "humanLikeness": 86,
  "overall": 82,
  "feedback": {
    "strengths": ["Specific strength referencing actual content", "Strength 2", "Strength 3"],
    "improvements": ["Specific problem with location/reason", "Improvement 2", "Improvement 3"],
    "suggestions": ["Specific actionable suggestion", "Suggestion 2", "Suggestion 3"]
  }
}

Scoring: readability×0.2 + seoScore×0.25 + coverage×0.3 + humanLikeness×0.25 = overall`;

  const text = await complete(client, system, prompt, onChunk, onReasoning, 3072, "quality_review");
  return parseJSON<QualityReportResult>(text);
}

// ─── Stage 9: Final Compilation ─────────────────────────────────────────────

export async function runFinalCompilation(
  data: ArticleJobData,
  humanizedArticle: string,
  seoPackage: SeoPackageResult,
  qualityReport: QualityReportResult,
  onChunk?: (text: string) => void,
  onReasoning?: (text: string) => void
): Promise<string> {
  const client = getClient();

  const system = `You are a final-stage production editor assembling the publication-ready version of an article.
Apply only the changes needed. Polish, integrate the FAQ, and deliver.
Format output as clean markdown. Do NOT wrap in code fences.`;

  const prompt = `Assemble the final publication-ready article.

QUALITY SUGGESTIONS TO APPLY:
${qualityReport.feedback.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

ARTICLE TO FINALIZE:
${humanizedArticle.slice(0, 9000)}

FAQ TO INSERT (add as "## Frequently Asked Questions" section before the conclusion):
${seoPackage.faq.map((f, i) => `**${i + 1}. ${f.question}**\n\n${f.answer}`).join('\n\n')}

Instructions:
1. Apply the quality suggestions above (lightly — don't over-edit)
2. Insert the FAQ section before the final conclusion paragraph
3. Ensure strong opening and clear next-step conclusion
4. Return the complete final article in markdown`;

  return complete(client, system, prompt, onChunk, onReasoning, 4096, "final_compilation");
}
