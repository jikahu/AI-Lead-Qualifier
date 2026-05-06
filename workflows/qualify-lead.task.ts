import { schemaTask } from "@trigger.dev/sdk";
import { OPENAI_MODEL, openai } from "../tools";
import {
  LeadInputSchema,
  QualificationSchema,
  type Qualification,
} from "./qualify-lead.schema";

const SYSTEM_PROMPT = `You are a B2B sales qualification analyst.

Given a lead's information, return a JSON object that scores the lead from 0 (cold) to 100 (hot) and explains your reasoning.

Output JSON shape:
{
  "score": number 0-100,
  "tier": "hot" | "warm" | "cold",
  "reasoning": "1-3 sentence explanation",
  "signals": {
    "positives": ["bullet", "bullet"],
    "concerns": ["bullet", "bullet"]
  },
  "suggestedNextStep": "1 sentence action for the sales rep"
}

Rules:
- "hot" = score >= 70, "warm" = 40-69, "cold" = < 40.
- BUDGET RANGE is one of the strongest signals. $250K+ with a senior title and tight timeline is almost always hot. "Under $10K" or "Not disclosed" leans cold unless other signals are very strong.
- TIMELINE: "Immediate (< 1 month)" or "1 – 3 months" suggests active buying intent (hot). "12+ months" or "Just exploring" leans cold/warm.
- PRIMARY PAIN POINT: weigh whether it sounds specific and urgent vs. vague. A specific, costly pain point with a tight timeline is the strongest combination.
- Combine signals: budget × timeline × seniority is the core triangle. Pain-point clarity multiplies it.
- If a non-mandatory field (title, industry, companySize) is missing, lean cold and call it out as a concern.
- Larger companies (200+) are usually positive. Tiny companies (1–10) aren't necessarily bad — depends on budget and pain.
- Personal email domains (gmail, yahoo, outlook) are a mild concern, not a dealbreaker.
- Be concise and specific. No marketing fluff.`;

export const qualifyLead = schemaTask({
  id: "qualify-lead",
  schema: LeadInputSchema,
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: true,
  },
  run: async (lead): Promise<Qualification> => {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(lead) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message.content;
    if (!raw) throw new Error("OpenAI returned no content");

    return QualificationSchema.parse(JSON.parse(raw));
  },
});
