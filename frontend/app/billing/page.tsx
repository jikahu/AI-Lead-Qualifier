import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import {
  FREE_TIER_LIMIT,
  PRO_PRICE_USD,
  getMonthlyUsage,
  getPlanState,
} from "@/lib/billing";

import { CheckoutEmbed } from "./checkout-embed";
import { ManageButton } from "./manage-button";

export const metadata = { title: "Billing" };

const FEATURES = [
  "Unlimited lead qualifications every month",
  "Live AI analyst — see reasoning stream in real time",
  "Detailed scoring with positive signals, concerns, and next steps",
  "Full qualification history, searchable",
  "Priority access to new features",
];

function isStripeConfigured() {
  const price = process.env.STRIPE_PRICE_ID_PRO;
  const secret = process.env.STRIPE_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const ok = (v: string | undefined) =>
    Boolean(v && !v.endsWith("...") && v.length > 8);
  return ok(price) && ok(secret) && ok(publishable);
}

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/billing");

  const [planState, usage] = await Promise.all([
    getPlanState(supabase, user.id),
    getMonthlyUsage(supabase, user.id),
  ]);
  const stripeReady = isStripeConfigured();
  const isPro = planState.plan === "pro";

  const periodEndLabel = planState.currentPeriodEnd
    ? planState.currentPeriodEnd.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const willCancel = planState.subscriptionStatus === "canceled";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 sm:py-16">
      <header className="flex items-center gap-5 border-b border-border/60 pb-5 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <Link
          href="/"
          className="text-foreground/85 transition-colors hover:text-primary"
        >
          ← Back
        </Link>
        <span className="text-foreground">Billing</span>
      </header>

      <section className="mt-16 mb-12 sm:mt-20">
        <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          {isPro ? (
            <>
              You&apos;re on <em className="italic text-primary">Pro</em>.
            </>
          ) : (
            <>
              Upgrade to <em className="italic text-primary">Pro</em>.
            </>
          )}
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {isPro
            ? "Unlimited qualifications, priority for new features. Manage card, invoices, or cancel any time."
            : `Free covers ${FREE_TIER_LIMIT} qualifications per month. Pro is $${PRO_PRICE_USD}/month for unlimited — and unlocks everything below.`}
        </p>
      </section>

      {isPro ? (
        <Card className="overflow-hidden border-border/70">
          <CardContent className="space-y-7 px-6 py-9 sm:px-10 sm:py-10">
            <div className="grid grid-cols-2 gap-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <div>
                <div className="text-foreground/60">Current plan</div>
                <div className="mt-2 text-base normal-case tracking-normal text-foreground sm:text-lg">
                  Pro — unlimited
                </div>
              </div>
              {periodEndLabel && (
                <div>
                  <div className="text-foreground/60">
                    {willCancel ? "Access until" : "Renews"}
                  </div>
                  <div className="mt-2 text-base normal-case tracking-normal text-foreground sm:text-lg">
                    {periodEndLabel}
                  </div>
                </div>
              )}
            </div>

            <Separator className="opacity-60" />

            <div>
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                What&apos;s included
              </p>
              <FeatureList />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/70 bg-card/50 px-6 py-6 sm:px-10">
            <ManageButton />
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <ProFeaturesCard usage={usage} />
          <Card className="overflow-hidden border-border/70">
            <CardContent className="px-6 py-9 sm:px-8 sm:py-10">
              <div className="mb-6 flex items-baseline justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Payment
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Secured by Stripe
                </p>
              </div>
              {stripeReady ? <CheckoutEmbed /> : <NotConfiguredNotice />}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function ProFeaturesCard({ usage }: { usage: number }) {
  return (
    <Card className="overflow-hidden border-border/70">
      <CardContent className="space-y-8 px-6 py-9 sm:px-8 sm:py-10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
            Pro plan
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-[80px] leading-none tracking-tight text-foreground">
              ${PRO_PRICE_USD}
            </span>
            <span className="font-mono text-sm text-muted-foreground">
              / month
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            For teams that qualify more than {FREE_TIER_LIMIT} leads a month and
            want the analyst on call without the meter ticking.
          </p>
        </div>

        <Separator className="opacity-60" />

        <FeatureList />

        <Separator className="opacity-60" />

        <div className="grid gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="status-dot text-primary" />
            <span>
              This month on free — {usage} / {FREE_TIER_LIMIT} used
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="status-dot text-cold" />
            <span>Cancel anytime. No contract.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureList() {
  return (
    <ul className="space-y-4">
      {FEATURES.map((f) => (
        <li
          key={f}
          className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90 sm:text-[15px]"
        >
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Check className="size-3 text-primary" strokeWidth={3} />
          </span>
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

function NotConfiguredNotice() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-destructive">
        ✗ Checkout unavailable
      </p>
      <p className="max-w-sm text-base text-foreground/90">
        Stripe isn&apos;t fully configured yet.
      </p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
        Set{" "}
        <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-foreground/80">
          STRIPE_PRICE_ID_PRO
        </code>
        ,{" "}
        <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-foreground/80">
          STRIPE_SECRET_KEY
        </code>
        , and{" "}
        <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-foreground/80">
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        </code>{" "}
        in{" "}
        <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-foreground/80">
          frontend/.env.local
        </code>{" "}
        and restart the dev server.
      </p>
    </div>
  );
}
