# NewsPulse AI

An autonomous, self-refreshing newsroom. NewsPulse ingests live RSS from trusted publishers, clusters overlapping coverage into events, cross-verifies them across independent sources, and presents everything in a premium editorial dashboard — with one-click, broadcast-style social post generation.

## Features

- **Live verified news** — US, International, and Celebrity (US / UK / CA / AU) sections, refreshed automatically every 5 minutes.
- **Cross-source verification** — stories are clustered by event; an event is "verified" when 2+ independent publishers report it.
- **AI research briefs** — grounded summaries via a local model (Ollama) or Google Gemini; strict "cite or omit" prompting.
- **Post generator** — pick a ratio (1:1, 9:16, 16:9), get a broadcast-style graphic: photo background, circular zoom inset, BREAKING badge, red/white condensed headline. Exact, legible text every time (composed with real typography, not an image model).
- **Article PDF export**, full-text article extraction, per-publisher credibility scores, working search.

## Architecture

```
frontend/   Next.js 16 (App Router, Tailwind v4) — UI, RSS fallback ingestion,
            post composer (next/og), search, auto-refresh
backend/    FastAPI — agent pipeline (Ingestion → Dedup → Verification →
            Extraction → Journalist → Image) + 5-minute scheduler
```

The frontend works standalone (its own RSS ingestion). When `BACKEND_URL` is set it prefers the Python newsroom and falls back gracefully if it's down.

## Run it

### Backend (optional, recommended)

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows  ·  source .venv/bin/activate on mac/linux
pip install -r requirements.txt
cp .env.example .env          # then edit .env
uvicorn app.main:app --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # then edit .env.local
npm run dev                   # http://localhost:3000
```

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | both `.env` files | AI briefs (Gemini) + Nano Banana image backgrounds. Optional — the app degrades gracefully without it. |
| `LLM_PROVIDER` | `backend/.env` | `gemini` (default) or `ollama` for a fully local, free brain. |
| `OLLAMA_URL` / `OLLAMA_MODEL` | `backend/.env` | Local model settings (default `http://localhost:11434`, `llama3.2`). |
| `BACKEND_URL` | `frontend/.env.local` | Point the UI at the FastAPI newsroom. |
| `REFRESH_INTERVAL` | `backend/.env` | Scheduler cadence in seconds (default 300). |

Secrets live only in `.env` / `.env.local`, which are gitignored.
