import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { addArticleJob } from '../queues/articleQueue.js';
import { sseManager } from '../events/sseManager.js';
import { AppError } from '../middleware/errorHandler.js';
import { PIPELINE_STAGES } from '../types/index.js';

const createArticleSchema = z.object({
  topic: z.string().min(3).max(2000),
  primaryKeyword: z.string().min(2).max(200),
  secondaryKeywords: z.array(z.string()).max(10).default([]),
  targetAudience: z.string().min(3).max(200),
  country: z.string().min(2).max(100).default('United States'),
  contentType: z.enum(['blog_post', 'guide', 'tutorial', 'review', 'comparison', 'news', 'opinion']),
  wordCount: z.number().int().min(300).max(10000).default(2000),
  referenceUrls: z.array(z.string().url()).max(5).default([]),
});

export async function createArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createArticleSchema.parse(req.body);

    const article = await prisma.article.create({
      data: {
        topic: body.topic,
        primaryKeyword: body.primaryKeyword,
        secondaryKeywords: body.secondaryKeywords,
        targetAudience: body.targetAudience,
        country: body.country,
        contentType: body.contentType,
        wordCount: body.wordCount,
        status: 'QUEUED',
        stages: {
          createMany: {
            data: PIPELINE_STAGES.map((s) => ({
              stageName: s.name,
              stageIndex: s.index,
              status: 'PENDING' as const,
            })),
          },
        },
      },
      include: { stages: true },
    });

    await addArticleJob({
      articleId: article.id,
      topic: article.topic,
      primaryKeyword: article.primaryKeyword,
      secondaryKeywords: article.secondaryKeywords,
      targetAudience: article.targetAudience,
      country: article.country,
      contentType: article.contentType,
      wordCount: article.wordCount,
      referenceUrls: body.referenceUrls,
    });

    res.status(201).json({ data: article });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(400, err.errors.map((e) => e.message).join(', ')));
      return;
    }
    next(err);
  }
}

export async function listArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query['limit']) || 20));
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          stages: { orderBy: { stageIndex: 'asc' } },
          qualityReport: { select: { overall: true } },
        },
      }),
      prisma.article.count(),
    ]);

    res.json({
      data: articles,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { stageIndex: 'asc' } },
        researchReport: true,
        generatedArticle: true,
        seoPackage: true,
        qualityReport: true,
      },
    });

    if (!article) {
      next(new AppError(404, 'Article not found'));
      return;
    }

    res.json({ data: article });
  } catch (err) {
    next(err);
  }
}

export async function streamArticleEvents(req: Request, res: Response): Promise<void> {
  const id = String(req.params['id']);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  res.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeClient(id, res);
  });

  sseManager.addClient(id, res);

  const article = await prisma.article.findUnique({
    where: { id },
    include: { stages: { orderBy: { stageIndex: 'asc' } } },
  }).catch(() => null);

  if (article) {
    res.write(`data: ${JSON.stringify({
      jobId: article.jobId ?? id,
      articleId: id,
      event: 'JOB_CREATED',
      message: `Connected. Article status: ${article.status}`,
      data: { status: article.status, stages: article.stages },
      timestamp: new Date().toISOString(),
    })}\n\n`);
  }
}

export async function retryArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);

    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      next(new AppError(404, 'Article not found'));
      return;
    }

    if (article.status !== 'FAILED' && article.status !== 'RUNNING') {
      next(new AppError(400, 'Only failed or stuck articles can be retried'));
      return;
    }

    // Keep COMPLETED stages — only reset FAILED/RUNNING ones so the pipeline resumes
    await prisma.$transaction([
      prisma.article.update({
        where: { id },
        data: { status: 'QUEUED', errorMessage: null },
      }),
      prisma.pipelineStage.updateMany({
        where: { articleId: id, status: { in: ['FAILED', 'RUNNING'] } },
        data: { status: 'PENDING', error: null, startedAt: null, completedAt: null },
      }),
    ]);

    await addArticleJob({
      articleId: article.id,
      topic: article.topic,
      primaryKeyword: article.primaryKeyword,
      secondaryKeywords: article.secondaryKeywords,
      targetAudience: article.targetAudience,
      country: article.country,
      contentType: article.contentType,
      wordCount: article.wordCount,
    });

    res.json({ data: { message: 'Article queued for retry' } });
  } catch (err) {
    next(err);
  }
}

export async function retryFromStage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    const { stageName } = req.body as { stageName: string };

    const stageEntry = PIPELINE_STAGES.find((s) => s.name === stageName);
    if (!stageEntry) {
      next(new AppError(400, 'Invalid stage name'));
      return;
    }

    const article = await prisma.article.findUnique({ where: { id } });

    if (!article) {
      next(new AppError(404, 'Article not found'));
      return;
    }

    if (article.status === 'RUNNING') {
      next(new AppError(400, 'Cannot retry while article is running'));
      return;
    }

    await prisma.$transaction([
      prisma.article.update({
        where: { id },
        data: { status: 'QUEUED', errorMessage: null },
      }),
      prisma.pipelineStage.updateMany({
        where: { articleId: id, stageIndex: { gte: stageEntry.index } },
        data: { status: 'PENDING', error: null, startedAt: null, completedAt: null },
      }),
    ]);

    await addArticleJob({
      articleId: article.id,
      topic: article.topic,
      primaryKeyword: article.primaryKeyword,
      secondaryKeywords: article.secondaryKeywords,
      targetAudience: article.targetAudience,
      country: article.country,
      contentType: article.contentType,
      wordCount: article.wordCount,
    });

    res.json({ data: { message: `Retrying from stage: ${stageName}` } });
  } catch (err) {
    next(err);
  }
}

export async function deleteArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params['id']);
    await prisma.article.delete({ where: { id } });
    res.json({ data: { message: 'Article deleted' } });
  } catch (err) {
    next(err);
  }
}
