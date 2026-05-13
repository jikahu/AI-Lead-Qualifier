import { headers } from "next/headers";
import { stripe, STRIPE_PRICE_ID_PRO } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlanState } from "@/lib/billing";

function originFromHeaders(h: Headers) {
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL!;
}

export async function POST() {
  if (!STRIPE_PRICE_ID_PRO) {
    return Response.json({ error: "STRIPE_PRICE_ID_PRO is not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planState = await getPlanState(supabase, user.id);
  if (planState.plan === "pro") {
    return Response.json({ error: "Already subscribed" }, { status: 409 });
  }

  try {
    // Reuse an existing Stripe customer if we already created one for this user;
    // otherwise create one and persist the id (service-role write — RLS blocks the user).
    let customerId = planState.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    const origin = originFromHeaders(await headers());

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_ID_PRO, quantity: 1 }],
      return_url: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return Response.json({ clientSecret: session.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("stripe checkout creation failed", err);
    return Response.json({ error: message }, { status: 502 });
  }
}
