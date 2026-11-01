# NewsPulse AI · Frontend

Next.js 16 (App Router) editorial dashboard for NewsPulse AI.

## Responsibilities

- US, International, and Celebrity news sections with category filtering and search
- Article reader with full-text extraction and PDF export
- Broadcast-style social post generator (`/api/generate-post`)
- Newsletter data endpoint (`/api/newsletter`)
- Built-in RSS ingestion used as a fallback whenever the FastAPI backend is unreachable

## Development

```bash
npm install
cp .env.example .env.local   # optional: GEMINI_API_KEY, BACKEND_URL
npm run dev                  # http://localhost:3000
```

| Script          | Purpose                    |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Create a production build  |
| `npm run start` | Serve the production build |
| `npm run lint`  | Run ESLint                 |

See the [root README](../README.md) for the full architecture and configuration reference.
