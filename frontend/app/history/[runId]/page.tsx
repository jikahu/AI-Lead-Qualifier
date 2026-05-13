import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type {
  LeadInput,
  Qualification,
  Tier,
} from "../../../../workflows/qualify-lead.schema";

const TIER_LABEL: Record<Tier, string> = {
  hot: "Hot lead",
  warm: "Warm lead",
  cold: "Cold lead",
};

const TIER_COLOR: Record<Tier, string> = {
  hot: "text-hot",
  warm: "text-warm",
  cold: "text-cold",
};

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qualifications")
    .select("status, input, result, error, created_at, completed_at")
    .eq("run_id", runId)
    .single();

  if (error || !data) notFound();

  const input = data.input as LeadInput;
  const result = data.result as Qualification | null;
  const tier = result?.tier as Tier | undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10 sm:py-16">
      <header className="flex items-center justify-between border-b border-border/60 pb-5 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        <Link
          href="/history"
          className="text-foreground/85 transition-colors hover:text-primary"
        >
          ← History
        </Link>
        <span className="flex items-center gap-2.5 text-foreground/85">
          <span className="status-dot text-cold" />
          <span className="text-foreground">Filed</span>
        </span>
      </header>

      <section className="mt-14 mb-10 sm:mt-20 sm:mb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          {input.company} · {input.name}
        </p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          The <em className="italic text-primary">read</em>.
        </h1>
      </section>

      {data.status === "failed" && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="py-6">
            <p className="font-display text-2xl text-foreground">
              Analysis didn&apos;t finish
            </p>
            {data.error && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {data.error}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {data.status === "pending" && (
        <Card className="border-border/70">
          <CardContent className="py-6 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Still running. Refresh this page in a moment.
          </CardContent>
        </Card>
      )}

      {result && tier && (
        <div className="space-y-10">
          <Card className="overflow-hidden border-border/70">
            <CardHeader className="border-b border-border/70 bg-card/50 py-5">
              <div
                className={`flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.32em] ${TIER_COLOR[tier]}`}
              >
                <span className="tier-square" />
                {TIER_LABEL[tier]}
              </div>
            </CardHeader>
            <CardContent className="py-10 sm:py-14">
              <div className="flex flex-col gap-4">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Score
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[140px] leading-[0.82] tracking-tighter tabular-nums sm:text-[200px]">
                    {result.score}
                  </span>
                  <span className="font-display text-3xl text-muted-foreground sm:text-4xl">
                    / 100
                  </span>
                </div>
              </div>
              <Separator className="my-9 opacity-60" />
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Analyst&apos;s read
                </p>
                <p className="mt-4 font-display text-[26px] italic leading-snug text-foreground sm:text-[32px]">
                  &ldquo;{result.reasoning}&rdquo;
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <SignalsCard
              title="Green flags"
              items={result.signals.positives}
              tone="positive"
            />
            <SignalsCard
              title="Concerns"
              items={result.signals.concerns}
              tone="concern"
            />
          </div>

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

          <div className="flex justify-end">
            <Link
              href="/"
              className={`${buttonVariants({ variant: "outline" })} gap-2`}
            >
              Run another →
            </Link>
          </div>
        </div>
      )}
    </main>
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
            <li key={i} className="flex gap-4 text-base leading-relaxed">
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
