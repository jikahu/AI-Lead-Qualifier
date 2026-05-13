import { tasks } from "@trigger.dev/sdk";
import { LeadInputSchema } from "../../../../workflows/qualify-lead.schema";
import { createClient } from "@/lib/supabase/server";
import { FREE_TIER_LIMIT, getMonthlyUsage, getPlanState } from "@/lib/billing";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await getPlanState(supabase, user.id);
  if (plan === "free") {
    const used = await getMonthlyUsage(supabase, user.id);
    if (used >= FREE_TIER_LIMIT) {
      return Response.json(
        {
          error: "limit_reached",
          message: `Free tier is limited to ${FREE_TIER_LIMIT} qualifications per month. Upgrade to Pro for unlimited.`,
          used,
          limit: FREE_TIER_LIMIT,
        },
        { status: 402 }
      );
    }
  }

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

  const handle = await tasks.trigger("qualify-lead", {
    ...parsed.data,
    userId: user.id,
  });

  const { error: insertError } = await supabase
    .from("qualifications")
    .insert({
      user_id: user.id,
      run_id: handle.id,
      status: "pending",
      input: parsed.data,
    });

  if (insertError) {
    // Don't fail the request — the task is already running and will still
    // write its result back via the service-role key. Log for diagnostics.
    console.error("qualifications insert failed", insertError);
  }

  return Response.json({
    runId: handle.id,
    publicAccessToken: handle.publicAccessToken,
  });
}
