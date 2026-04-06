-- OPTIONAL — only if you do NOT already have a VAT intake table.
--
-- This app writes to **public.submissions** (see /api/submit). Supabase already
-- exposes that table in your project with columns such as company_name,
-- vat_number, status, risk_band, ai_score, etc.
--
-- Use this file only when starting a fresh database with no `submissions` table.
-- If you prefer the name vat_claim_submissions instead, create it and change
-- app/api/submit/route.ts to .from("vat_claim_submissions").

create table if not exists public.vat_claim_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  company_name text not null,
  registration_number text,
  vat_number text,
  country text,
  address text,

  contact_person text,
  contact_email text,
  contact_phone text,

  claim_period_start date,
  claim_period_end date,
  claim_type text,
  total_claim_amount numeric(18, 2),
  currency text default 'EUR',
  invoice_count integer,
  claim_description text,

  bank_name text,
  account_holder_name text,
  iban text,
  swift_code text,

  invoice_references text,
  transaction_references text,
  additional_notes text,

  declaration_accepted boolean not null default false,
  status text not null default 'pending'
);

create index if not exists vat_claim_submissions_created_at_idx
  on public.vat_claim_submissions (created_at desc);

create index if not exists vat_claim_submissions_status_idx
  on public.vat_claim_submissions (status);

-- If PostgREST still says "schema cache", run in SQL Editor:
--   notify pgrst, 'reload schema';
