"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthState } from "@/app/actions/auth";

const INITIAL: AuthState = { error: null };

function ConfirmationNotice() {
  const params = useSearchParams();
  if (params.get("check_email") !== "1") return null;
  return (
    <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
      ✓ Check your inbox to confirm your email, then sign in.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, INITIAL);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10 sm:py-16">
      <header className="flex items-center border-b border-border/60 pb-5 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <span className="flex items-center gap-2.5 text-foreground/85">
          <span className="status-dot text-primary" />
          <span className="text-foreground">Sign in</span>
        </span>
      </header>

      <section className="mt-16 mb-12 sm:mt-24">
        <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          Welcome <em className="italic text-primary">back</em>.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Sign in to read your leads and pull up past qualifications.
        </p>
      </section>

      <Card className="overflow-hidden border-border/70">
        <form action={formAction}>
          <CardContent className="space-y-7 px-6 py-9 sm:px-10 sm:py-10">
            <Suspense fallback={null}>
              <ConfirmationNotice />
            </Suspense>

            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="h-11 text-base"
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="password"
                className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground"
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-11 text-base"
              />
            </div>

            {state.error && (
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-destructive">
                ✗ {state.error}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-border/70 bg-card/50 px-6 py-6 sm:px-10">
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="h-12 w-full text-sm font-medium tracking-wide"
            >
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              New here?{" "}
              <Link
                href="/signup"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
