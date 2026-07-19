# NewsPulse AI Backend (FastAPI)

An autonomous newsroom of cooperating agents that pull US and celebrity news in
near real time, deduplicate overlapping coverage, and verify each story across
multiple trusted sources. Serves the Next.js frontend over a small REST API.

## Agents (pipeline)

1. **IngestionAgent** pulls every trusted RSS feed concurrently (US news + celebrity across US/UK/CA/AU).
2. **DuplicateDetectionAgent** removes repeated stories.
3. **VerificationAgent** clusters coverage into events and scores each by the number of independent publishers (`Verified` when 2 or more).
4. **ExtractionAgent** (on demand) pulls the full article body + hero image for the reader.
5. **AI JournalistAgent** (optional) writes a grounded, cited research brief using Gemini. Disabled cleanly if no key/quota.

A background scheduler runs the pipeline on startup and every `REFRESH_INTERVAL` seconds.

## Run

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    |    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # optional, has sensible defaults
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Liveness + whether a snapshot exists |
| GET | `/api/status` | Pipeline + per-agent status and metrics |
| GET | `/api/events` | `{ us, celebrity, status }` |
| GET | `/api/us?categories=Politics,Business` | US events, optional category filter |
| GET | `/api/celebrity?limit=20` | Top celebrity events |
| GET | `/api/article/{id}` | One event + extracted body (+ brief if enabled) |
| POST | `/api/refresh` | Trigger an immediate refresh |

## Connect the frontend

In `frontend/.env.local` set:

```
BACKEND_URL=http://127.0.0.1:8000
```

The Next.js app then reads live data from this backend and falls back to its own
built-in ingestion if the backend is unreachable.
