import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/env.server";
import { supabaseMisconfiguredResponse } from "@/lib/supabaseConfigError";

type Body = {
  company_name?: string;
  registration_number?: string;
  vat_number?: string;
  country?: string;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  claim_period_start?: string;
  claim_period_end?: string;
  claim_type?: string;
  total_claim_amount?: number | null;
  currency?: string;
  invoice_count?: number | null;
  claim_description?: string;
  bank_name?: string;
  account_holder_name?: string;
  iban?: string;
  swift_code?: string;
  invoice_references?: string;
  transaction_references?: string;
  additional_notes?: string;
  declaration_accepted?: boolean;
};

export async function POST(req: Request) {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    console.error(e);
    return supabaseMisconfiguredResponse();
  }

  try {
    const body = (await req.json()) as Body;

    if (!body.company_name?.trim()) {
      return NextResponse.json(
        { error: "company_name is required" },
        { status: 400 }
      );
    }

    const row = {
      company_name: body.company_name,
      registration_number: body.registration_number || null,
      vat_number: body.vat_number || null,
      country: body.country || null,
      address: body.address || null,
      contact_person: body.contact_person || null,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      claim_period_start: body.claim_period_start || null,
      claim_period_end: body.claim_period_end || null,
      claim_type: body.claim_type || null,
      total_claim_amount: body.total_claim_amount ?? null,
      currency: body.currency || "EUR",
      invoice_count: body.invoice_count ?? null,
      claim_description: body.claim_description || null,
      bank_name: body.bank_name || null,
      account_holder_name: body.account_holder_name || null,
      iban: body.iban || null,
      swift_code: body.swift_code || null,
      invoice_references: body.invoice_references || null,
      transaction_references: body.transaction_references || null,
      additional_notes: body.additional_notes || null,
      declaration_accepted: Boolean(body.declaration_accepted),
      status: "pending" as const,
    };

    const { data, error } = await supabase
      .from("submissions")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
