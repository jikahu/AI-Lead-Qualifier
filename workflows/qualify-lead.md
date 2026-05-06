# qualify-lead

Score and qualify a B2B sales lead based on form input.

## Input

| Field     | Type     | Required | Notes                                  |
|-----------|----------|----------|----------------------------------------|
| `name`    | string   | yes      | Lead's full name                        |
| `email`   | string   | yes      | Must be a valid email                  |
| `company` | string   | yes      | Company name                           |
| `title`   | string   | no       | Job title — strong signal when present |
| `notes`   | string   | no       | Free-text context from the sales rep   |

The Zod schema in [qualify-lead.task.ts](qualify-lead.task.ts) is the source of truth. The frontend form validates against the same schema.

## Output

```ts
{
  score: number,           // 0–100
  tier: "hot" | "warm" | "cold",
  reasoning: string,       // 1–3 sentences
  signals: {
    positives: string[],   // bullet points
    concerns: string[],    // bullet points
  },
  suggestedNextStep: string  // 1 sentence action for the sales rep
}
```

## Scoring rubric

The LLM is prompted to follow these bands:

| Tier | Score range | Meaning                                    |
|------|-------------|--------------------------------------------|
| hot  | 70–100      | Strong fit, clear intent, decision-maker   |
| warm | 40–69       | Plausible fit, needs more discovery        |
| cold | 0–39        | Weak fit, missing key info, or low intent  |

If a key field (company, title) is missing, the model leans cold and lists the gap as a concern.

## Behavior

- Single OpenAI chat completion using `OPENAI_MODEL` (default `gpt-4o-mini`).
- `response_format: { type: "json_object" }` — output is parsed and re-validated through Zod before returning.
- `temperature: 0.2` — qualifications should be reproducible across re-runs.
- `maxDuration: 120` seconds — generous ceiling; a normal call returns in 2–5s.

## Failure modes

- **OpenAI returns non-JSON** → throws, Trigger.dev retries per the task's retry policy.
- **OpenAI returns JSON that doesn't match the schema** → Zod throws, Trigger.dev retries.
- **OpenAI key missing** → throws on first call. Set `OPENAI_API_KEY` in the Trigger.dev project env.

## Examples

**Input — hot lead**
```json
{
  "name": "Sarah Chen",
  "email": "schen@acmebank.com",
  "company": "Acme Bank",
  "title": "VP of Engineering",
  "notes": "Asked for a demo, evaluating us vs 2 competitors, decision in 2 weeks."
}
```
Expected: `tier: "hot"`, score in the 80s, positives mention seniority + active eval + tight timeline.

**Input — cold lead**
```json
{
  "name": "Anonymous",
  "email": "anon@gmail.com",
  "company": "Self-employed"
}
```
Expected: `tier: "cold"`, score < 30, concerns mention personal email + missing title + no context.
