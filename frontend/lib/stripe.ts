import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key);
  return _stripe;
}

// Proxy so module evaluation never touches process.env — Next.js's "collecting
// page data" step imports this file at build time, and a top-level throw there
// crashes the build even when the var is correctly set at runtime.
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const value = Reflect.get(getStripe(), prop);
    return typeof value === "function" ? value.bind(getStripe()) : value;
  },
});

export const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
