# ResearchFlow AI

> Production-quality AI Research & Blog Generation Platform powered by Claude, Next.js 15, and a 9-stage streaming pipeline.

## Architecture

```
research-flow-ai/
├── frontend/          Next.js 15 + TypeScript + Tailwind + shadcn/ui
├── backend/           Express + TypeScript + BullMQ + Prisma
├── docker-compose.yml PostgreSQL 16 + Redis 7 (local dev)
└── setup.sh           One-command local setup
```

**Tech Stack**
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Query, Zustand
- **Backend**: Express, TypeScript, BullMQ, Prisma ORM
- **AI**: Anthropic Claude (`claude-sonnet-4-6`)
- **Database**: PostgreSQL
- **Queue**: BullMQ + Redis
- **Realtime**: Server-Sent Events (SSE)

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for Postgres + Redis)
- A Claude API key from [console.anthropic.com](https://console.anthropic.com)

### 1. Run setup

```bash
./setup.sh
```

This will:
1. Copy `.env` files
2. Start PostgreSQL + Redis via Docker Compose
3. Install all dependencies
4. Run Prisma migrations

### 2. Configure your Claude API key

```bash
# Option A: Set in backend/.env
echo 'CLAUDE_API_KEY=sk-ant-...' >> backend/.env

# Option B: Add via Dashboard → Settings after starting the app
```

### 3. Start the servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000**

---

## The 9-Stage Pipeline

| Stage | What it does |
|-------|-------------|
| **1. Keyword Analysis** | Search intent, semantic entities, PAA questions, LSI keywords |
| **2. Competitor Research** | Top ranking pages, content gaps, missing topics, opportunities |
| **3. Deep Research** | Industry overview, statistics, trends, expert insights, pain points |
| **4. Outline Generation** | H1/H2/H3 structure with point-by-point content map |
| **5. Article Draft** | Full long-form article from outline + research |
| **6. Humanization Pass** | Rewrites AI patterns out; adds natural rhythm and expert voice |
| **7. SEO Package** | Meta title, meta description, FAQ schema, internal link suggestions |
| **8. Quality Review** | Scores readability, SEO, coverage, human-likeness (0–100) |
| **9. Final Compilation** | Assembles publication-ready document with FAQ integrated |

Every stage streams live progress via SSE to the browser.

---

## API Endpoints

```
POST   /api/articles            Create article + start pipeline
GET    /api/articles            List articles (paginated)
GET    /api/articles/:id        Get article with all data
GET    /api/articles/:id/events SSE stream for live updates
POST   /api/articles/:id/retry  Retry a failed job
DELETE /api/articles/:id        Delete article

GET    /api/settings            Get settings
PATCH  /api/settings            Update settings

GET    /health                  Health check
```

## SSE Event Types

```json
{ "event": "JOB_CREATED",       "jobId": "...", "articleId": "..." }
{ "event": "STAGE_STARTED",     "stage": "keyword_analysis", "message": "..." }
{ "event": "STAGE_PROGRESS",    "stage": "deep_research",    "message": "...", "data": { "partial": "..." } }
{ "event": "STAGE_COMPLETED",   "stage": "article_draft",    "data": { "wordCount": 2104 } }
{ "event": "JOB_COMPLETED",     "data": { "wordCount": 2104 } }
{ "event": "JOB_FAILED",        "message": "Error details" }
```

## Database Schema

```
Article            → id, topic, keyword, status, createdAt
PipelineStage      → id, articleId, stageName, status, result
ResearchReport     → id, articleId, content (JSON)
GeneratedArticle   → id, articleId, outline, draft, humanized, final
SeoPackage         → id, articleId, metaTitle, metaDescription, faq, schema
QualityReport      → id, articleId, readability, seoScore, coverage, humanLikeness
Settings           → key, value
```

## Export Formats

From the Article Viewer:
- **Markdown** (`.md`) — clean markdown for CMS import
- **HTML** (`.html`) — publication-ready HTML
- **JSON** (`.json`) — full data including SEO package and quality scores
- **Copy to clipboard** — one click

## Deployment

### Frontend → Vercel

```bash
cd frontend
vercel deploy
# Set NEXT_PUBLIC_API_URL to your backend URL
```

### Backend → Railway

```bash
# Set environment variables in Railway dashboard:
# DATABASE_URL, REDIS_URL, CLAUDE_API_KEY, FRONTEND_URL, PORT, NODE_ENV
railway up
```

### Database → Supabase

Replace `DATABASE_URL` in backend `.env` with your Supabase connection string:
```
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

---

## Development Commands

```bash
# Backend
cd backend
npm run dev          # Start with hot reload
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run build        # TypeScript build

# Frontend
cd frontend
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint

# Infrastructure
docker compose up -d    # Start Postgres + Redis
docker compose down     # Stop services
docker compose logs -f  # View logs
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `CLAUDE_API_KEY` | Anthropic API key |
| `PORT` | Server port (default: 4000) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
