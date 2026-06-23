#!/usr/bin/env bash
set -e

echo ""
echo "🚀 ResearchFlow AI — Local Setup"
echo "================================"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from https://nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install from https://docker.com"; exit 1; }

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 20 ]; then
  echo "❌ Node.js 20+ required (found v$(node -v))"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo ""

# ── Step 1: Environment files ─────────────────────────────────────────────
echo "📄 Creating environment files..."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "   Created root .env"
fi

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "   Created backend/.env"
fi

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.local.example frontend/.env.local
  echo "   Created frontend/.env.local"
fi

echo ""

# ── Step 2: Start infrastructure ─────────────────────────────────────────
echo "🐳 Starting PostgreSQL and Redis..."
docker compose up -d
echo "   Waiting for services to be healthy..."
sleep 5
echo ""

# ── Step 3: Backend dependencies ──────────────────────────────────────────
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo ""

# ── Step 4: Database setup ────────────────────────────────────────────────
echo "🗄️  Setting up database..."
npm run db:generate
npm run db:push
echo ""
cd ..

# ── Step 5: Frontend dependencies ─────────────────────────────────────────
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo ""
cd ..

echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "  1. Get a FREE NVIDIA API key at https://build.nvidia.com → Get API Key"
echo "     a) Set NVIDIA_API_KEY=nvapi-... in backend/.env"
echo "     b) Or add it via Dashboard → Settings after starting the app"
echo ""
echo "  2. Start the backend:    cd backend && npm run dev"
echo "  3. Start the frontend:   cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
