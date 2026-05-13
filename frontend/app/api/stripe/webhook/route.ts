import type Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Active states keep `plan='pro'`. Anything else is treated as free unless a
// canceled subscription is still inside its current period — getPlanState handles that.
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

type ProfileUpdate = {
  plan: "free" | "pro";
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  updated_at: string;
};

// `current_period_end` lives on subscription items in Stripe API 2024-09+,
// but on the subscription root in older versions. Read whichever is present.
function readPeriodEnd(sub: Stripe.Subscription): number | null {
  const item = sub.items.data[0] as { current_period_end?: number } | undefined;
  if (item?.current_period_end) return item.current_period_end;
  const root = sub as unknown as { current_period_end?: number };
  return root.current_period_end ?? null;
}

function buildUpdate(sub: Stripe.Subscription): ProfileUpdate {
  const periodEnd = readPeriodEnd(sub);
  // Canceled stays on plan='pro' so they keep access until period_end. The
  // billing helper resolves it to 'free' once the period actually expires.
  const plan = ACTIVE_STATUSES.has(sub.status)
    ? "pro"
    : sub.status === "canceled"
      ? "pro"
      : "free";
  return {
    plan,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

async function applySubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId =
    (sub.metadata?.supabase_user_id as string | undefined) ??
    (await lookupUserByCustomer(customerId));

  if (!userId) {
    console.error("stripe webhook: no supabase user for customer", customerId);
    return;
  }

  const update = buildUpdate(sub);
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ ...update, stripe_customer_id: customerId })
    .eq("id", userId);
  if (error) console.error("stripe webhook: profile update failed", error);
}

async function lookupUserByCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(`Signature verification failed: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;
        const subId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await applySubscription(sub);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed":
      case "invoice.payment_succeeded": {
        // Invoice subscription field moved between API versions; check both.
        const invoice = event.data.object as Stripe.Invoice;
        const legacy = (invoice as unknown as { subscription?: string | { id: string } | null })
          .subscription;
        const modern = invoice.parent?.subscription_details?.subscription;
        const ref = legacy ?? modern ?? null;
        const subId = typeof ref === "string" ? ref : (ref as { id: string } | null)?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(sub);
        }
        break;
      }
    }
  } catch (err) {
    console.error("stripe webhook handler error", err);
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
