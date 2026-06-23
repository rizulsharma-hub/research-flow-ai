import { Job } from 'bullmq';
import { prisma } from '../lib/prisma.js';
import { sseManager } from '../events/sseManager.js';
import * as claude from '../services/claudeService.js';
import type {
  ArticleJobData,
  StageName,
  PipelineEvent,
  KeywordAnalysisResult,
  CompetitorResearchResult,
  DeepResearchResult,
  OutlineResult,
  SeoPackageResult,
} from '../types/index.js';

function emit(articleId: string, jobId: string, event: PipelineEvent['event'], opts: {
  stage?: StageName;
  message?: string;
  data?: unknown;
} = {}): void {
  sseManager.sendEvent(articleId, {
    jobId,
    articleId,
    event,
    stage: opts.stage,
    message: opts.message,
    data: opts.data,
    timestamp: new Date().toISOString(),
  });
}

async function startStage(articleId: string, jobId: string, stageName: StageName, label: string): Promise<void> {
  await prisma.pipelineStage.update({
    where: { articleId_stageName: { articleId, stageName } },
    data: { status: 'RUNNING', startedAt: new Date() },
  });
  emit(articleId, jobId, 'STAGE_STARTED', { stage: stageName, message: `Starting ${label}...` });
}

async function completeStage(articleId: string, jobId: string, stageName: StageName, label: string, result: unknown): Promise<void> {
  await prisma.pipelineStage.update({
    where: { articleId_stageName: { articleId, stageName } },
    data: { status: 'COMPLETED', completedAt: new Date(), result: result as never },
  });
  emit(articleId, jobId, 'STAGE_COMPLETED', { stage: stageName, message: `${label} complete`, data: result });
}

async function failStage(articleId: string, jobId: string, stageName: StageName, error: string): Promise<void> {
  await prisma.pipelineStage.update({
    where: { articleId_stageName: { articleId, stageName } },
    data: { status: 'FAILED', error, completedAt: new Date() },
  });
  emit(articleId, jobId, 'STAGE_PROGRESS', { stage: stageName, message: `Error: ${error}` });
}

const FLUSH_MS = 300;

function makeChunkHandler(articleId: string, jobId: string, stageName: StageName, message: string) {
  let buffer = '';
  let lastFlush = 0;
  return (chunk: string) => {
    buffer += chunk;
    const now = Date.now();
    if (now - lastFlush >= FLUSH_MS) {
      lastFlush = now;
      sseManager.broadcastProgress(articleId, jobId, stageName, message, { partial: buffer });
    }
  };
}

function makeThinkingHandler(articleId: string, jobId: string, stageName: StageName) {
  let buffer = '';
  let lastEmit = 0;
  return (text: string) => {
    buffer += text;
    const now = Date.now();
    if (now - lastEmit > 500) {
      lastEmit = now;
      sseManager.sendEvent(articleId, {
        jobId,
        articleId,
        stage: stageName,
        event: 'STAGE_THINKING',
        message: 'Model reasoning...',
        data: { thinking: buffer.slice(-1500) },
        timestamp: new Date().toISOString(),
      });
    }
  };
}

export async function processPipelineJob(job: Job<ArticleJobData>): Promise<void> {
  const data = job.data;
  const { articleId } = data;
  const jobId = job.id ?? 'unknown';

  emit(articleId, jobId, 'JOB_CREATED', { message: 'Pipeline started' });

  await prisma.article.update({
    where: { id: articleId },
    data: { status: 'RUNNING', jobId },
  });

  // Load saved stage results so we can resume from where we left off
  const savedStages = await prisma.pipelineStage.findMany({
    where: { articleId },
    orderBy: { stageIndex: 'asc' },
  });
  const completed = new Set(
    savedStages.filter((s) => s.status === 'COMPLETED').map((s) => s.stageName)
  );
  const stageResult = (name: string) => savedStages.find((s) => s.stageName === name)?.result;

  const [savedGenerated, savedSeo] = await Promise.all([
    prisma.generatedArticle.findUnique({ where: { articleId } }),
    prisma.seoPackage.findUnique({ where: { articleId } }),
  ]);

  // Pre-populate from DB — overwritten if the stage re-runs
  let keywordAnalysis = stageResult('keyword_analysis') as KeywordAnalysisResult;
  let competitorResearch = stageResult('competitor_research') as CompetitorResearchResult;
  let deepResearch = stageResult('deep_research') as DeepResearchResult;
  let outline = (savedGenerated?.outline ?? stageResult('outline_generation')) as OutlineResult;
  let draft = savedGenerated?.draft ?? '';
  let humanized = savedGenerated?.humanized ?? '';
  let seoPackage: SeoPackageResult = savedSeo
    ? {
        metaTitle: savedSeo.metaTitle ?? '',
        metaDescription: savedSeo.metaDescription ?? '',
        faq: (savedSeo.faq as SeoPackageResult['faq']) ?? [],
        schema: (savedSeo.schema as Record<string, unknown>) ?? {},
        internalLinks: (savedSeo.internalLinks as SeoPackageResult['internalLinks']) ?? [],
      }
    : undefined!;

  try {
    // ── Stage 1: Keyword Analysis ───────────────────────────────────────────
    if (!completed.has('keyword_analysis')) {
      try {
        await startStage(articleId, jobId, 'keyword_analysis', 'Keyword Analysis');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'keyword_analysis',
          message: 'Analyzing search intent, entities, and user goals...',
        });
        keywordAnalysis = await claude.runKeywordAnalysis(
          data,
          makeChunkHandler(articleId, jobId, 'keyword_analysis', 'Analyzing keywords...'),
          makeThinkingHandler(articleId, jobId, 'keyword_analysis')
        );
        await completeStage(articleId, jobId, 'keyword_analysis', 'Keyword Analysis', keywordAnalysis);
      } catch (err) {
        await failStage(articleId, jobId, 'keyword_analysis', err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }

    // ── Stage 2: Competitor Research ────────────────────────────────────────
    if (!completed.has('competitor_research')) {
      try {
        await startStage(articleId, jobId, 'competitor_research', 'Competitor Research');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'competitor_research',
          message: 'Simulating SERP research and competitor gap analysis...',
        });
        competitorResearch = await claude.runCompetitorResearch(
          data,
          keywordAnalysis,
          makeChunkHandler(articleId, jobId, 'competitor_research', 'Extracting competitor insights...'),
          makeThinkingHandler(articleId, jobId, 'competitor_research')
        );
        await completeStage(articleId, jobId, 'competitor_research', 'Competitor Research', competitorResearch);
      } catch (err) {
        await failStage(articleId, jobId, 'competitor_research', err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }

    // ── Stage 3: Deep Research ──────────────────────────────────────────────
    if (!completed.has('deep_research')) {
      try {
        await startStage(articleId, jobId, 'deep_research', 'Deep Research');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'deep_research',
          message: 'Compiling industry data, statistics, and expert insights...',
        });
        deepResearch = await claude.runDeepResearch(
          data,
          keywordAnalysis,
          competitorResearch,
          makeChunkHandler(articleId, jobId, 'deep_research', 'Researching industry data...'),
          makeThinkingHandler(articleId, jobId, 'deep_research')
        );
        await prisma.researchReport.upsert({
          where: { articleId },
          create: { articleId, content: deepResearch as never },
          update: { content: deepResearch as never },
        });
        await completeStage(articleId, jobId, 'deep_research', 'Deep Research', deepResearch);
      } catch (err) {
        await failStage(articleId, jobId, 'deep_research', err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }

    // ── Stage 4: Outline Generation ─────────────────────────────────────────
    if (!completed.has('outline_generation')) {
      try {
        await startStage(articleId, jobId, 'outline_generation', 'Outline Generation');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'outline_generation',
          message: 'Structuring article architecture based on research...',
        });
        outline = await claude.runOutlineGeneration(
          data,
          keywordAnalysis,
          competitorResearch,
          deepResearch,
          makeChunkHandler(articleId, jobId, 'outline_generation', 'Generating outline...'),
          makeThinkingHandler(articleId, jobId, 'outline_generation')
        );
        await prisma.generatedArticle.upsert({
          where: { articleId },
          create: { articleId, outline: outline as never },
          update: { outline: outline as never },
        });
        await completeStage(articleId, jobId, 'outline_generation', 'Outline Generation', outline);
      } catch (err) {
        await failStage(articleId, jobId, 'outline_generation', err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }

    // ── Stage 5: Article Draft ──────────────────────────────────────────────
    if (!completed.has('article_draft')) {
      try {
        await startStage(articleId, jobId, 'article_draft', 'Article Draft');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'article_draft',
          message: `Writing ${data.wordCount}-word article draft...`,
        });
        draft = await claude.runArticleDraft(
          data,
          keywordAnalysis,
          deepResearch,
          outline,
          makeChunkHandler(articleId, jobId, 'article_draft', 'Writing article...'),
          makeThinkingHandler(articleId, jobId, 'article_draft')
        );
        await prisma.generatedArticle.update({ where: { articleId }, data: { draft } });
        await completeStage(articleId, jobId, 'article_draft', 'Article Draft', { wordCount: draft.split(/\s+/).length });
      } catch (err) {
        await failStage(articleId, jobId, 'article_draft', err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }

    // ── Stage 6: Humanization ───────────────────────────────────────────────
    if (!completed.has('humanization')) {
      try {
        await startStage(articleId, jobId, 'humanization', 'Humanization Pass');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'humanization',
          message: 'Rewriting for natural human voice and expert rhythm...',
        });
        humanized = await claude.runHumanization(
          draft,
          data,
          makeChunkHandler(articleId, jobId, 'humanization', 'Humanizing content...'),
          makeThinkingHandler(articleId, jobId, 'humanization')
        );
        await prisma.generatedArticle.update({ where: { articleId }, data: { humanized } });
        await completeStage(articleId, jobId, 'humanization', 'Humanization Pass', {
          wordCount: humanized.split(/\s+/).length,
        });
      } catch (err) {
        await failStage(articleId, jobId, 'humanization', err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }

    // ── Stage 7: SEO Package ────────────────────────────────────────────────
    if (!completed.has('seo_package')) {
      try {
        await startStage(articleId, jobId, 'seo_package', 'SEO Package');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'seo_package',
          message: 'Generating meta title, description, FAQ, and schema...',
        });
        seoPackage = await claude.runSeoPackage(
          data,
          humanized,
          keywordAnalysis,
          competitorResearch,
          makeChunkHandler(articleId, jobId, 'seo_package', 'Building SEO package...'),
          makeThinkingHandler(articleId, jobId, 'seo_package')
        );
        await prisma.seoPackage.upsert({
          where: { articleId },
          create: {
            articleId,
            metaTitle: seoPackage.metaTitle,
            metaDescription: seoPackage.metaDescription,
            faq: seoPackage.faq as never,
            schema: seoPackage.schema as never,
            internalLinks: seoPackage.internalLinks as never,
          },
          update: {
            metaTitle: seoPackage.metaTitle,
            metaDescription: seoPackage.metaDescription,
            faq: seoPackage.faq as never,
            schema: seoPackage.schema as never,
            internalLinks: seoPackage.internalLinks as never,
          },
        });
        await completeStage(articleId, jobId, 'seo_package', 'SEO Package', seoPackage);
      } catch (err) {
        await failStage(articleId, jobId, 'seo_package', err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }

    // ── Stage 8: Quality Review ─────────────────────────────────────────────
    if (!completed.has('quality_review')) {
      try {
        await startStage(articleId, jobId, 'quality_review', 'Quality Review');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'quality_review',
          message: 'Scoring readability, SEO, coverage, and human-likeness...',
        });
        const qualityReport = await claude.runQualityReview(
          data,
          humanized,
          keywordAnalysis,
          seoPackage,
          makeChunkHandler(articleId, jobId, 'quality_review', 'Running quality audit...'),
          makeThinkingHandler(articleId, jobId, 'quality_review')
        );
        await prisma.qualityReport.upsert({
          where: { articleId },
          create: {
            articleId,
            readability: qualityReport.readability,
            seoScore: qualityReport.seoScore,
            coverage: qualityReport.coverage,
            humanLikeness: qualityReport.humanLikeness,
            overall: qualityReport.overall,
            feedback: qualityReport.feedback as never,
          },
          update: {
            readability: qualityReport.readability,
            seoScore: qualityReport.seoScore,
            coverage: qualityReport.coverage,
            humanLikeness: qualityReport.humanLikeness,
            overall: qualityReport.overall,
            feedback: qualityReport.feedback as never,
          },
        });
        await completeStage(articleId, jobId, 'quality_review', 'Quality Review', qualityReport);

        // ── Stage 9: Final Compilation ────────────────────────────────────
        await startStage(articleId, jobId, 'final_compilation', 'Final Compilation');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'final_compilation',
          message: 'Assembling final publication-ready document...',
        });
        const finalArticle = await claude.runFinalCompilation(
          data,
          humanized,
          seoPackage,
          qualityReport,
          makeChunkHandler(articleId, jobId, 'final_compilation', 'Compiling final document...'),
          makeThinkingHandler(articleId, jobId, 'final_compilation')
        );
        const wordCount = finalArticle.split(/\s+/).length;
        await prisma.generatedArticle.update({ where: { articleId }, data: { final: finalArticle, wordCount } });
        await completeStage(articleId, jobId, 'final_compilation', 'Final Compilation', { wordCount });
      } catch (err) {
        await failStage(
          articleId, jobId,
          completed.has('quality_review') ? 'final_compilation' : 'quality_review',
          err instanceof Error ? err.message : 'Unknown error'
        );
        throw err;
      }
    } else if (!completed.has('final_compilation')) {
      // quality_review done but final_compilation wasn't
      try {
        const qualityReport = stageResult('quality_review') as Parameters<typeof claude.runFinalCompilation>[3];
        await startStage(articleId, jobId, 'final_compilation', 'Final Compilation');
        emit(articleId, jobId, 'STAGE_PROGRESS', {
          stage: 'final_compilation',
          message: 'Assembling final publication-ready document...',
        });
        const finalArticle = await claude.runFinalCompilation(
          data,
          humanized,
          seoPackage,
          qualityReport,
          makeChunkHandler(articleId, jobId, 'final_compilation', 'Compiling final document...'),
          makeThinkingHandler(articleId, jobId, 'final_compilation')
        );
        const wordCount = finalArticle.split(/\s+/).length;
        await prisma.generatedArticle.update({ where: { articleId }, data: { final: finalArticle, wordCount } });
        await completeStage(articleId, jobId, 'final_compilation', 'Final Compilation', { wordCount });
      } catch (err) {
        await failStage(articleId, jobId, 'final_compilation', err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    }

    // ── Job Complete ─────────────────────────────────────────────────────────
    await prisma.article.update({
      where: { id: articleId },
      data: { status: 'COMPLETED' },
    });
    emit(articleId, jobId, 'JOB_COMPLETED', { message: 'Article generation complete!' });

  } catch (err) {
    // Any unhandled stage error lands here — mark article FAILED and notify frontend
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await prisma.article.update({
      where: { id: articleId },
      data: { status: 'FAILED', errorMessage: msg },
    });
    emit(articleId, jobId, 'JOB_FAILED', { message: msg });
    throw err;
  }
}
