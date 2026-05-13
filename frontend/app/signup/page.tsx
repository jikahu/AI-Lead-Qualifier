"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type AuthState } from "@/app/actions/auth";

const INITIAL: AuthState = { error: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, INITIAL);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10 sm:py-16">
      <header className="flex items-center border-b border-border/60 pb-5 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <span className="flex items-center gap-2.5 text-foreground/85">
          <span className="status-dot text-primary" />
          <span className="text-foreground">Create account</span>
        </span>
      </header>

      <section className="mt-16 mb-12 sm:mt-24">
        <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          Get a <em className="italic text-primary">read</em> on every lead.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Make an account to score leads and keep your history private.
        </p>
      </section>

      <Card className="overflow-hidden border-border/70">
        <form action={formAction}>
          <CardContent className="space-y-7 px-6 py-9 sm:px-10 sm:py-10">
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
                minLength={8}
                autoComplete="new-password"
                className="h-11 text-base"
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                At least 8 characters.
              </p>
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
              {isPending ? "Creating account…" : "Create account"}
            </Button>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Already have one?{" "}
              <Link
                href="/login"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
