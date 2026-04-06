# VAT Sentinel

Next.js app for VAT reclaim intake, evaluator workspace, screening assistant, and n8n webhooks.

## Repository layout

| Path | Purpose |
|------|--------|
| **`fraud-frontend/`** | Next.js 16 application — **use this as the Vercel root directory** |
| `fraud-frontend/n8n/` | Exported n8n workflow JSON (reference) |
| `fraud-frontend/supabase/migrations/` | SQL migrations (reference) |

## Run locally

```bash
cd fraud-frontend
cp .env.example .env.local
# Edit .env.local with your Supabase, OpenRouter, and n8n webhook URLs

npm install
npm run dev
```

Open **http://localhost:3947** (port is set in `package.json`).

## Deploy on Vercel

1. Import this repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to **`fraud-frontend`**.
3. Add **Environment Variables** from `fraud-frontend/.env.example` (Production, and Preview if needed).
4. Deploy. The app calls **Supabase**, **OpenRouter** (via `OPENAI_API_KEY`), and **n8n Cloud** webhooks from the server only.

## Requirements

- **Node.js** 20+ (see `engines` in `fraud-frontend/package.json`).
