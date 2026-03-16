# ScalpVision AI

ScalpVision AI is a full-stack trading signal platform for chart screenshot analysis across stock and crypto markets.

## Services

- `frontend`: Next.js 14 app with TailwindCSS and Framer Motion
- `backend`: Express API with PostgreSQL, Redis, JWT auth scaffolding, uploads, and WebSocket broadcasting
- `ai-service`: FastAPI image analysis engine with OpenCV and PyTorch-ready pipeline stubs

## Quick start

1. Copy `.env.example` to `.env`.
2. Install dependencies if you want to run services outside Docker:

```bash
cd frontend && npm install
cd ../backend && npm install
```

3. Start with Docker:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/health`
- AI service: `http://localhost:8000/health`

## Local development

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

AI service:

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment

Core values are defined in `.env.example`.

Important variables:

- `NEXT_PUBLIC_API_URL`: frontend to backend base URL
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: auth token signing secret
- `TWELVE_DATA_API_KEY`: optional stock data provider key
- `REDIS_URL`: optional cache connection

## Deployment targets

- Frontend: Vercel
- Backend: Render
- AI service: AWS GPU instance
- Database: Supabase PostgreSQL
- Cache: Redis Cloud
- Storage: S3-compatible bucket

## Live market data

- Crypto quotes use Binance public market data and refresh every 15 seconds in the UI.
- Stock quotes use Twelve Data when `TWELVE_DATA_API_KEY` is configured.
- If `TWELVE_DATA_API_KEY` is not set, the backend falls back to a public Yahoo Finance endpoint for current session pricing.

## GitHub readiness

- `package-lock.json` files are included for reproducible installs.
- Generated build output, logs, and local environment files are gitignored.
- Run `git init`, `git add .`, and push to your GitHub repository once you are happy with the local preview.
