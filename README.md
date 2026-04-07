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

### n8n not running after submit

1. **Env:** Set `N8N_WEBHOOK_URL` (and redeploy) to the **Production** webhook URL from n8n Cloud — same as in `.env.example`.
2. **Workflow:** In n8n, the workflow must be **Active** (toggle on). Copy the **Webhook** node’s **Production URL** (not “Test URL” unless you use that deliberately).
3. **Path:** URL must match your Webhook node path (e.g. `/webhook/vat-claim`).
4. **Auth:** If the Webhook node uses **Authentication**, the app must send the same credentials (currently it sends JSON only — disable webhook auth for this integration or add headers in code).
5. After submit, the success banner mentions if n8n was skipped or returned an error (HTTP status). Check **Vercel → Deployment → Functions / Logs** for `n8n webhook non-OK` if needed.

### n8n review webhook (Approve / Reject on dashboard)

The app POSTs to `N8N_REVIEW_WEBHOOK_URL` with JSON including `submissionId`, `submission_id`, `case_id`, `new_status`, `review_notes`, etc.

1. **Lookup the AI row by `submission_id`:** The submit workflow writes `fraud_workflow_results` with **`submission_id`** (same UUID as `submissions.id`). A Supabase “get rows” node that filters by **`case_id` only** will fail unless you also store that column when the row is created. Prefer **`submission_id` = webhook submission UUID** for the review “Fetch case” step.
2. **Map webhook body:** After the Webhook node, use a **Set** node (not a manual “wait for input” step) to read `$json.body.submissionId` (and fallbacks) into fields used by the next node.
3. **Respond early** in n8n if the chain is slow, so the HTTP request does not time out.

Reference workflow JSON (`n8n/VAT-sentinel-model-2-copy.fixed.json`) is updated so **Fetch Case** filters `fraud_workflow_results` by **`submission_id`** and **Review Input** maps from the webhook body.

## Requirements

- **Node.js** 20+ (see `engines` in `package.json`).
