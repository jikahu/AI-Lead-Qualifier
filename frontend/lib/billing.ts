import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_TIER_LIMIT = 5;
export const PRO_PRICE_USD = 29;

export type Plan = "free" | "pro";

export type PlanState = {
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

// A profile row may have plan='pro' with status='canceled' — they keep Pro
// access until current_period_end. Resolve that here so callers don't have to.
function resolvePlan(row: ProfileRow): Plan {
  if (row.plan !== "pro") return "free";
  if (
    row.subscription_status === "canceled" &&
    row.current_period_end &&
    new Date(row.current_period_end).getTime() < Date.now()
  ) {
    return "free";
  }
  return "pro";
}

type ProfileRow = {
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
};

export async function getPlanState(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanState> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "plan, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end"
    )
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (!data) {
    return {
      plan: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      currentPeriodEnd: null,
    };
  }

  return {
    plan: resolvePlan(data),
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    subscriptionStatus: data.subscription_status,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
  };
}

// Start of the current calendar month in UTC. Resets on the 1st at 00:00 UTC.
export function startOfMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getMonthlyUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("qualifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonthUtc().toISOString());
  return count ?? 0;
}
