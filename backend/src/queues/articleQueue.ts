import { Queue, Worker, QueueEvents } from 'bullmq';
import { processPipelineJob } from '../jobs/pipelineJob.js';
import type { ArticleJobData } from '../types/index.js';

const QUEUE_NAME = 'article-pipeline';

function redisConnection() {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port, 10) || 6379,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null as null,
      enableReadyCheck: false,
    };
  } catch {
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null as null, enableReadyCheck: false };
  }
}

const connection = redisConnection();

export const articleQueue = new Queue<ArticleJobData, unknown, 'generate'>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 1,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection() });

let worker: Worker<ArticleJobData, unknown, 'generate'> | null = null;

export function startWorker(): void {
  worker = new Worker<ArticleJobData, unknown, 'generate'>(
    QUEUE_NAME,
    async (job) => {
      console.log(`[Worker] Processing job ${job.id} for article ${job.data.articleId}`);
      await processPipelineJob(job);
      console.log(`[Worker] Completed job ${job.id}`);
    },
    {
      connection: redisConnection(),
      concurrency: 2,
      lockDuration: 600000,   // 10 min — Nemotron reasoning takes time
      lockRenewTime: 120000,  // renew lock every 2 min
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error:', err.message);
  });

  console.log('[Worker] Started and listening for jobs');
}

export async function addArticleJob(data: ArticleJobData): Promise<string> {
  const jobId = `article-${data.articleId}`;

  // BullMQ deduplicates by jobId — remove any stale job so the new one is always enqueued
  const stale = await articleQueue.getJob(jobId);
  if (stale) {
    await stale.remove().catch(() => {});
  }

  const job = await articleQueue.add('generate', data, { jobId });
  return job.id ?? data.articleId;
}

export async function closeQueue(): Promise<void> {
  await worker?.close();
  await articleQueue.close();
  await queueEvents.close();
}
