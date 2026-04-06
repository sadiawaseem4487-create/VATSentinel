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

**Supabase is required** for submit, dashboard, and chat. Put **`.env.local` in the repository root** (next to `package.json`). If you still have an old copy under `fraud-frontend/`, run:

```bash
cp fraud-frontend/.env.local .env.local
```

Otherwise:

```bash
cp .env.example .env.local
```

Fill in from [Supabase](https://supabase.com/dashboard) → your project → **Project Settings → API**:

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon** `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key (keep secret; server-only) |

Then add OpenRouter (`OPENAI_API_KEY`) and n8n URLs as in `.env.example`. **Restart** the dev server after editing `.env.local`.

```bash
npm install
npm run dev
```

Open **http://localhost:3947** (dev server port is set in `package.json`).

### If Vercel shows 404 but the build is “Ready”

- **Project → Settings → General:** **Root Directory** must be empty (repo root). Do **not** set an **Output Directory** manually for Next.js.
- **Deployments:** open the deployment and confirm the **Production** URL (not only a preview alias).

## Deploy on Vercel

1. Import this repo in [Vercel](https://vercel.com/new).
2. Leave **Root Directory** empty (or `.`) — the app is at the repo root.
3. **Settings → Environment Variables:** add the **same keys** as in `.env.local` — at minimum `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Missing Supabase keys cause **“Server is not configured (Supabase)”** on the dashboard and APIs.
4. **Redeploy** after saving variables.
5. The app calls **Supabase**, **OpenRouter** (via `OPENAI_API_KEY`), and **n8n Cloud** webhooks from the server only.

## Requirements

- **Node.js** 20+ (see `engines` in `package.json`).
