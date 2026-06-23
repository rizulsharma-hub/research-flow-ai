import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import articleRoutes from './routes/articleRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { startWorker } from './queues/articleQueue.js';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT ?? 4000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
    // Allow all Vercel preview and production deployments
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/articles', articleRoutes);
app.use('/api/settings', settingsRoutes);

app.use(notFound);
app.use(errorHandler);

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] Connected to PostgreSQL');

    // Load API key from DB into process.env if not already set via .env
    if (!process.env['NVIDIA_API_KEY']) {
      const stored = await prisma.settings.findUnique({ where: { key: 'nvidiaApiKey' } });
      if (stored?.value) {
        process.env['NVIDIA_API_KEY'] = stored.value;
        console.log('[Settings] Loaded NVIDIA_API_KEY from database');
      }
    }

    startWorker();

    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
