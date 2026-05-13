"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

export function CheckoutEmbed() {
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) setMissingKey(true);
  }, []);

  // Fetch the client secret once, eagerly. If it fails, render an error card
  // instead of mounting the iframe — Stripe's iframe shows a generic
  // "Something went wrong" page on session errors, which is worse than nothing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/checkout", { method: "POST" });
        let data: { clientSecret?: string; error?: string } | null = null;
        try {
          data = await res.json();
        } catch {
          /* non-JSON response */
        }
        if (!res.ok) {
          const msg = data?.error ?? `Checkout failed (${res.status})`;
          if (!cancelled) setError(msg);
          return;
        }
        if (!data?.clientSecret) {
          if (!cancelled) setError("Stripe did not return a client secret.");
          return;
        }
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        if (!cancelled) setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchClientSecret = useCallback(
    () =>
      clientSecret
        ? Promise.resolve(clientSecret)
        : Promise.reject(new Error("clientSecret not ready")),
    [clientSecret]
  );

  if (missingKey) {
    return (
      <ErrorBlock
        title="Checkout unavailable"
        message="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured."
      />
    );
  }

  if (error) {
    return (
      <ErrorBlock
        title="Couldn't start checkout"
        message={error}
        hint="If this looks like a Stripe configuration issue, double-check STRIPE_PRICE_ID_PRO matches a real Price in your Stripe dashboard."
      />
    );
  }

  if (!clientSecret) {
    return <LoadingBlock />;
  }

  return (
    <div className="overflow-hidden rounded-md">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Loading checkout…
      </p>
    </div>
  );
}

function ErrorBlock({
  title,
  message,
  hint,
}: {
  title: string;
  message: string;
  hint?: string;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-destructive">
        ✗ {title}
      </p>
      <p className="max-w-sm text-sm text-foreground/90">{message}</p>
      {hint && (
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
