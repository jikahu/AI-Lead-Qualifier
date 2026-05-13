import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getPlanState } from "@/lib/billing";

function originFromHeaders(h: Headers) {
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL!;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stripeCustomerId } = await getPlanState(supabase, user.id);
  if (!stripeCustomerId) {
    return Response.json({ error: "No Stripe customer on file" }, { status: 400 });
  }

  const origin = originFromHeaders(await headers());
  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/billing`,
  });

  return Response.json({ url: portal.url });
}
