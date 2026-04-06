# VAT Sentinel

Next.js app for VAT reclaim intake, evaluator workspace, screening assistant, and n8n webhooks.

## Repository layout

The Next.js app lives at the **repository root** (no subfolder) so **Vercel** can build with default settings.

| Path | Purpose |
|------|--------|
| `app/` | Routes and API |
| `n8n/` | Exported n8n workflow JSON (reference) |
| `supabase/migrations/` | SQL migrations (reference) |

## Run locally

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase, OpenRouter, and n8n webhook URLs

npm install
npm run dev
```

Open **http://localhost:3947** (port is set in `package.json`).

## Deploy on Vercel

1. Import this repo in [Vercel](https://vercel.com/new).
2. Leave **Root Directory** empty (or `.`) — the app is at the repo root.
3. Add **Environment Variables** from `.env.example` (Production, and Preview if needed).
4. Deploy. The app calls **Supabase**, **OpenRouter** (via `OPENAI_API_KEY`), and **n8n Cloud** webhooks from the server only.

## Requirements

- **Node.js** 20+ (see `engines` in `package.json`).
