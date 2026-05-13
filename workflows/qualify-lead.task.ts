import { metadata, schemaTask } from "@trigger.dev/sdk";
import { OPENAI_MODEL, openai, supabaseAdmin } from "../tools";
import {
  LeadTaskInputSchema,
  QualificationSchema,
  type Qualification,
} from "./qualify-lead.schema";

const SYSTEM_PROMPT = `You are a B2B sales qualification analyst.

OUTPUT FORMAT — follow exactly:
1. First, write 1–3 sentences of your analytical read in plain prose. No headings, no preamble, just the analyst's voice.
2. Then write a line containing only: ---
3. Then output a single JSON object (no markdown, no code fences) matching this shape:
{
  "score": number 0-100,
  "tier": "hot" | "warm" | "cold",
  "reasoning": "1-3 sentence explanation (same content as the prose above)",
  "signals": {
    "positives": ["bullet", "bullet"],
    "concerns": ["bullet", "bullet"]
  },
  "suggestedNextStep": "1 sentence action for the sales rep"
}

RULES:
- "hot" = score >= 70, "warm" = 40-69, "cold" = < 40.
- BUDGET RANGE is one of the strongest signals. $250K+ with a senior title and tight timeline is almost always hot. "Under $10K" or "Not disclosed" leans cold unless other signals are very strong.
- TIMELINE: "Immediate (< 1 month)" or "1 – 3 months" suggests active buying intent (hot). "12+ months" or "Just exploring" leans cold/warm.
- PRIMARY PAIN POINT: weigh whether it sounds specific and urgent vs. vague. A specific, costly pain point with a tight timeline is the strongest combination.
- Combine signals: budget × timeline × seniority is the core triangle. Pain-point clarity multiplies it.
- If a non-mandatory field (title, industry, companySize) is missing, lean cold and call it out as a concern.
- Larger companies (200+) are usually positive. Tiny companies (1–10) aren't necessarily bad — depends on budget and pain.
- Personal email domains (gmail, yahoo, outlook) are a mild concern, not a dealbreaker.
- Be concise and specific. No marketing fluff.`;

const SEPARATOR = "---";

function stripCodeFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export const qualifyLead = schemaTask({
  id: "qualify-lead",
  schema: LeadTaskInputSchema,
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: true,
  },
  run: async (payload, { ctx }): Promise<Qualification> => {
    const { userId, ...lead } = payload;

    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(lead) },
      ],
      temperature: 0.2,
      stream: true,
    });

    let buffer = "";
    let inJson = false;
    let lastPushed = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (!delta) continue;
      buffer += delta;

      if (!inJson) {
        const sepIdx = buffer.indexOf(SEPARATOR);
        const prose = (sepIdx === -1 ? buffer : buffer.slice(0, sepIdx)).trim();
        if (sepIdx !== -1) inJson = true;
        // Only push when the visible prose actually grew, to avoid spamming metadata.
        if (prose && prose !== lastPushed) {
          lastPushed = prose;
          metadata.set("preview", prose);
        }
      }
    }

    const sepIdx = buffer.indexOf(SEPARATOR);
    const jsonText =
      sepIdx !== -1 ? buffer.slice(sepIdx + SEPARATOR.length) : buffer;
    const parsed = JSON.parse(stripCodeFences(jsonText));
    const result = QualificationSchema.parse(parsed);

    const { error } = await supabaseAdmin
      .from("qualifications")
      .update({
        status: "completed",
        result,
        completed_at: new Date().toISOString(),
      })
      .eq("run_id", ctx.run.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to persist qualification result", error);
    }

    return result;
  },
  onFailure: async ({ payload, error, ctx }) => {
    const message = error instanceof Error ? error.message : String(error);
    await supabaseAdmin
      .from("qualifications")
      .update({
        status: "failed",
        error: message,
        completed_at: new Date().toISOString(),
      })
      .eq("run_id", ctx.run.id)
      .eq("user_id", payload.userId);
  },
});
