"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  TriangleAlert,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type {
  Qualification,
  Tier,
} from "../../../../workflows/qualify-lead.schema";
import type { qualifyLead } from "../../../../workflows/qualify-lead.task";

const STATUS_LABEL: Record<string, string> = {
  QUEUED: "Queued",
  WAITING_FOR_DEPLOY: "Waiting on deploy",
  EXECUTING: "Reading the room",
  REATTEMPTING: "Re-reading",
  FROZEN: "Frozen",
  CANCELED: "Canceled",
  FAILED: "Analysis failed",
  CRASHED: "Crashed",
  TIMED_OUT: "Timed out",
  COMPLETED: "Filed",
};

const TERMINAL = new Set([
  "COMPLETED",
  "FAILED",
  "CRASHED",
  "CANCELED",
  "TIMED_OUT",
]);

const PROGRESS_BY_STATUS: Record<string, number> = {
  QUEUED: 18,
  WAITING_FOR_DEPLOY: 25,
  EXECUTING: 65,
  REATTEMPTING: 50,
  COMPLETED: 100,
  FAILED: 100,
  CRASHED: 100,
};

function useCountUp(target: number | undefined, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === undefined) return;
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export default function ResultsPage() {
  const params = useParams<{ runId: string }>();
  const searchParams = useSearchParams();
  const runId = params.runId;
  const accessToken = searchParams.get("token") ?? undefined;

  const { run, error: runError } = useRealtimeRun<typeof qualifyLead>(runId, {
    accessToken,
    enabled: Boolean(runId && accessToken),
  });

  const result = run?.output as Qualification | undefined;
  const status = run?.status;
  const score = useCountUp(result?.score);

  const isWorking =
    Boolean(status) && !result && !TERMINAL.has(status as string);
  const failed =
    status && ["FAILED", "CRASHED", "TIMED_OUT", "CANCELED"].includes(status);

  const progressValue = result ? 100 : (PROGRESS_BY_STATUS[status ?? ""] ?? 5);
  const statusLabel = STATUS_LABEL[status as string] ?? "Initiating";

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10 sm:py-16">
      {/* ── Top rail ────────────────────────────── */}
      <Reveal delay={0}>
        <div className="flex items-center justify-between border-b border-border/60 pb-5 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground/85 transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <span className="flex items-center gap-2.5">
            {isWorking ? (
              <>
                <span className="status-dot pulse-soft text-warm" />
                {statusLabel}
              </>
            ) : failed ? (
              <>
                <span className="status-dot text-destructive" />
                {statusLabel}
              </>
            ) : (
              <>
                <span className="status-dot text-cold" />
                Filed
              </>
            )}
          </span>
        </div>
      </Reveal>

      {/* ── Header ─────────────────────────────── */}
      <Reveal delay={120}>
        <div className="mt-14 mb-12 sm:mt-20 sm:mb-16">
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
            The <em className="italic text-primary">read</em>.
          </h1>
        </div>
      </Reveal>

      {/* ── Progress while running ─────────────── */}
      {!result && !failed && (
        <Reveal delay={240}>
          <div className="mb-10">
            <div className="mb-3 flex items-center justify-end">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/85">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                {statusLabel}
              </p>
            </div>
            <Progress value={progressValue} className="h-1.5" />
          </div>
        </Reveal>
      )}

      {runError && (
        <Card className="mb-8 border-destructive/40 bg-destructive/10">
          <CardContent className="flex items-start gap-3 py-5">
            <TriangleAlert className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="font-display text-xl">Realtime error</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {runError.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {failed && (
        <Card className="mb-8 border-destructive/40">
          <CardContent className="flex items-start gap-4 py-6">
            <TriangleAlert className="mt-0.5 size-5 text-destructive" />
            <div className="flex-1">
              <p className="font-display text-2xl">Analysis didn't finish</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusLabel}. Head back and try again.
              </p>
            </div>
            <Link
              href="/"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back
            </Link>
          </CardContent>
        </Card>
      )}

      {!result && !failed && <ResultSkeleton />}

      {result && <ResultView result={result} score={score} />}

    </main>
  );
}

/* ─────────────────────────────────────────────── */

function Reveal({
  children,
  delay = 0,
  as: As = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: React.ElementType;
}) {
  return (
    <As
      className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </As>
  );
}

function TierMark({ tier }: { tier: Tier }) {
  const config: Record<Tier, { label: string; cls: string }> = {
    hot: { label: "Hot lead", cls: "text-hot" },
    warm: { label: "Warm lead", cls: "text-warm" },
    cold: { label: "Cold lead", cls: "text-cold" },
  };
  const { label, cls } = config[tier];
  return (
    <div
      className={`flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.32em] ${cls}`}
    >
      <span className="tier-square" />
      {label}
    </div>
  );
}

function ResultView({
  result,
  score,
}: {
  result: Qualification;
  score: number;
}) {
  return (
    <div className="space-y-10">
      {/* ── Score + Tier ──────────────────────── */}
      <Reveal delay={240}>
        <Card className="overflow-hidden border-border/70">
          <CardHeader className="border-b border-border/70 bg-card/50 py-5">
            <TierMark tier={result.tier as Tier} />
          </CardHeader>
          <CardContent className="py-10 sm:py-14">
            <div className="flex flex-col gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Score
              </p>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[140px] leading-[0.82] tracking-tighter tabular-nums sm:text-[200px]">
                  {score}
                </span>
                <span className="font-display text-3xl text-muted-foreground sm:text-4xl">
                  / 100
                </span>
              </div>
            </div>
            <Separator className="my-9 opacity-60" />
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Analyst's read
              </p>
              <p className="mt-4 font-display text-[26px] italic leading-snug text-foreground sm:text-[32px]">
                &ldquo;{result.reasoning}&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* ── Signals ──────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Reveal delay={420}>
          <SignalsCard
            title="Green flags"
            items={result.signals.positives}
            tone="positive"
          />
        </Reveal>
        <Reveal delay={520}>
          <SignalsCard
            title="Concerns"
            items={result.signals.concerns}
            tone="concern"
          />
        </Reveal>
      </div>

      {/* ── Next move ────────────────────────── */}
      <Reveal delay={640}>
        <Card className="overflow-hidden border-border/70">
          <CardHeader className="border-b border-border/70 bg-card/50 py-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Next move
            </p>
          </CardHeader>
          <CardContent className="py-8">
            <CardTitle className="font-display text-[26px] leading-snug sm:text-[32px]">
              <span className="mr-2 text-primary">→</span>
              {result.suggestedNextStep}
            </CardTitle>
          </CardContent>
        </Card>
      </Reveal>

      {/* ── Footer ───────────────────────────── */}
      <Reveal delay={760}>
        <div className="flex justify-end">
          <Link
            href="/"
            className={`${buttonVariants({ variant: "outline" })} gap-2`}
          >
            Run another <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

function SignalsCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "concern";
}) {
  const markerCls = tone === "positive" ? "text-cold" : "text-hot";
  const marker = tone === "positive" ? "+" : "—";

  return (
    <Card className="h-full overflow-hidden border-border/70">
      <CardHeader className="border-b border-border/70 bg-card/50 py-5">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
          {title}
        </p>
      </CardHeader>
      <CardContent className="py-7">
        <ul className="space-y-4">
          {items.map((item, i) => (
            <li
              key={i}
              className="animate-in fade-in slide-in-from-left-2 duration-500 flex gap-4 text-base leading-relaxed"
              style={{
                animationDelay: `${640 + i * 80}ms`,
                animationFillMode: "both",
              }}
            >
              <span
                className={`mt-0.5 select-none font-mono text-base font-semibold ${markerCls}`}
              >
                {marker}
              </span>
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-10">
      <Card className="border-border/70">
        <CardHeader className="border-b border-border/70 bg-card/50 py-5">
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent className="py-10 sm:py-14">
          <Skeleton className="mb-3 h-3 w-16" />
          <Skeleton className="h-[140px] w-72" />
          <Separator className="my-9 opacity-60" />
          <Skeleton className="mb-3 h-3 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} className="border-border/70">
            <CardHeader className="border-b border-border/70 bg-card/50 py-5">
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent className="py-7 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70">
        <CardHeader className="border-b border-border/70 bg-card/50 py-5">
          <Skeleton className="h-3 w-20" />
        </CardHeader>
        <CardContent className="py-8">
          <Skeleton className="h-7 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
