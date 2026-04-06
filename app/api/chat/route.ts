import {
  getOpenRouterClient,
  getSupabaseServerClient,
} from "@/lib/env.server";
import { supabaseMisconfiguredResponse } from "@/lib/supabaseConfigError";
import {
  retrieveRagContext,
  type RagScope,
} from "@/lib/chatRag";

type HistoryItem = { role: "user" | "assistant"; content: string };

function parseScope(v: unknown): RagScope {
  return v === "case" ? "case" : "overview";
}

export async function POST(req: Request) {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (e) {
    console.error(e);
    return supabaseMisconfiguredResponse();
  }

  try {
    const body = await req.json();
    const message = body.message;
    const scope = parseScope(body.scope);
    const caseQuery =
      typeof body.caseQuery === "string" ? body.caseQuery : undefined;
    const history: HistoryItem[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (h: unknown) =>
              h &&
              typeof h === "object" &&
              (h as HistoryItem).role &&
              typeof (h as HistoryItem).content === "string"
          )
          .map((h: HistoryItem) => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: String(h.content).slice(0, 12_000),
          }))
          .slice(-10)
      : [];

    if (typeof message !== "string" || !message.trim()) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const rag = await retrieveRagContext(supabase, scope, caseQuery);

    if (rag.useCannedReply && rag.cannedReply) {
      return Response.json({
        reply: rag.cannedReply,
        retrievedCount: rag.retrievedCount,
        scope: rag.scope,
        retrievalNote: rag.retrievalNote ?? null,
      });
    }

    const openai = getOpenRouterClient();
    if (!openai) {
      return Response.json(
        {
          code: "OPENAI_NOT_CONFIGURED" as const,
          error:
            "The screening assistant needs an LLM API key on the server (OpenRouter).",
          hint:
            "Vercel → Settings → Environment Variables: add OPENAI_API_KEY with your OpenRouter key (or OPENROUTER_API_KEY). Enable Preview and Production, then Redeploy. Get a key at openrouter.ai/keys.",
        },
        { status: 503 }
      );
    }

    const systemContent = `You are a professional VAT fraud screening copilot for internal reviewers.

Answer ONLY from the RETRIEVED CONTEXT below. Use a clear, concise tone suitable for compliance staff.

Rules:
- If the answer is not in the context, say so briefly and suggest switching retrieval mode (overview vs single case), refining keywords, or using the Evaluator with a submission UUID.
- For multiple matches, summarize each with company name and a short reference to id (you may shorten UUID to first 8 characters plus ellipsis when helpful).
- Use exact figures and statuses from context. If risk_score or risk_band are null or missing in a row, say risk was not scored for that row—do not guess.
- IBANs appear only as masked hints; never infer full account numbers.
- Never invent cases, amounts, or outcomes.
- Never mention SQL, database column names, schema errors, APIs, or internal errors—the user should not see technical implementation details.

RETRIEVED CONTEXT:
---
${rag.contextText}
---

Retrieval: scope=${rag.scope}, rows_in_context=${rag.retrievedCount}${rag.retrievalNote ? `, note=${rag.retrievalNote}` : ""}.`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        ...history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        { role: "user", content: message.trim() },
      ],
    });

    const reply =
      completion.choices[0].message.content ?? "No response returned.";

    return Response.json({
      reply,
      retrievedCount: rag.retrievedCount,
      scope: rag.scope,
      retrievalNote: rag.retrievalNote ?? null,
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      {
        error:
          "We couldn’t complete that request. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
