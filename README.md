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

## Publish this website

This repo is prepared for:

- Vercel for the frontend from `frontend`
- Render for the backend and AI service using `render.yaml`
- Supabase for PostgreSQL

### 1. Create the database

Create a Supabase project and run the SQL in `infra/db/init.sql`.

Then set:

- `DATABASE_URL` in Render for the backend

### 2. Deploy backend and AI on Render

1. Push this repo to GitHub.
2. In Render, create a new Blueprint.
3. Select this repository so Render reads `render.yaml`.
4. Fill in missing environment values:
   - `DATABASE_URL`
   - `FRONTEND_URL`
   - `AI_SERVICE_URL`
   - `REDIS_URL` if used
   - `TWELVE_DATA_API_KEY` optional

### 3. Deploy frontend on Vercel

1. Import this repo in Vercel.
2. Set root directory to `frontend`.
3. Add:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
4. Deploy.

### 4. Production env examples

- `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
- `NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com/ws`
- `FRONTEND_URL=https://your-frontend.vercel.app`
- `AI_SERVICE_URL=https://your-ai-service.onrender.com`

## Live market data

- Crypto quotes use Binance public market data and refresh every 15 seconds in the UI.
- Stock quotes use Twelve Data when `TWELVE_DATA_API_KEY` is configured.
- If `TWELVE_DATA_API_KEY` is not set, the backend falls back to a public Yahoo Finance endpoint for current session pricing.

## GitHub readiness

- `package-lock.json` files are included for reproducible installs.
- Generated build output, logs, and local environment files are gitignored.
- Run `git init`, `git add .`, and push to your GitHub repository once you are happy with the local preview.
