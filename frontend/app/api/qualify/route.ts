import { tasks } from "@trigger.dev/sdk";
import { LeadInputSchema } from "../../../../workflows/qualify-lead.schema";
import type { qualifyLead } from "../../../../workflows/qualify-lead.task";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LeadInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const handle = await tasks.trigger<typeof qualifyLead>(
    "qualify-lead",
    parsed.data
  );

  return Response.json({
    runId: handle.id,
    publicAccessToken: handle.publicAccessToken,
  });
}
