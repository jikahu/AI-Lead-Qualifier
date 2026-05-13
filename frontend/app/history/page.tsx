import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type {
  LeadInput,
  Qualification,
  Tier,
} from "../../../workflows/qualify-lead.schema";

type Status = "pending" | "completed" | "failed";

type Row = {
  id: string;
  run_id: string;
  status: Status;
  input: LeadInput;
  result: Qualification | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

const TIER_LABEL: Record<Tier, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

const TIER_COLOR: Record<Tier, string> = {
  hot: "text-hot",
  warm: "text-warm",
  cold: "text-cold",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qualifications")
    .select("id, run_id, status, input, result, error, created_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as Row[];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10 sm:py-16">
      <header className="flex items-center justify-between border-b border-border/60 pb-5 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <Link
          href="/"
          className="text-foreground/85 transition-colors hover:text-primary"
        >
          ← New read
        </Link>
        <span className="flex items-center gap-2.5 text-foreground/85">
          <span className="status-dot text-primary" />
          <span className="text-foreground">History</span>
        </span>
      </header>

      <section className="mt-16 mb-10 sm:mt-20 sm:mb-12">
        <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          Past <em className="italic text-primary">reads</em>.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Your last 50 qualifications. Click any row to revisit the analyst&apos;s read.
        </p>
      </section>

      {error && (
        <Card className="mb-8 border-destructive/40 bg-destructive/10">
          <CardContent className="py-5 font-mono text-xs uppercase tracking-[0.18em] text-destructive">
            ✗ Couldn&apos;t load history: {error.message}
          </CardContent>
        </Card>
      )}

      {rows.length === 0 && !error && (
        <Card className="border-border/70">
          <CardContent className="px-6 py-10 text-center sm:px-10 sm:py-14">
            <p className="font-display text-2xl text-foreground sm:text-3xl">
              Nothing here yet.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Run your first qualification and it&apos;ll show up here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.22em] text-primary underline-offset-4 hover:underline"
            >
              Start →
            </Link>
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {rows.map((row) => (
          <HistoryRow key={row.id} row={row} />
        ))}
      </ul>
    </main>
  );
}

function HistoryRow({ row }: { row: Row }) {
  const tier = row.result?.tier as Tier | undefined;
  const score = row.result?.score;

  const content = (
    <Card className="overflow-hidden border-border/70 transition-colors hover:border-primary/50">
      <CardContent className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-7">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl text-foreground sm:text-2xl">
            {row.input.company}
          </p>
          <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {row.input.name}
            {row.input.title ? ` · ${row.input.title}` : ""} · {formatDate(row.created_at)}
          </p>
        </div>

        <Separator orientation="vertical" className="hidden h-10 sm:block" />

        <div className="flex items-center gap-5">
          <StatusBadge status={row.status} />

          {row.status === "completed" && tier && score !== undefined ? (
            <div className="flex items-baseline gap-2">
              <span className={`font-display text-3xl tabular-nums ${TIER_COLOR[tier]}`}>
                {score}
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.28em] ${TIER_COLOR[tier]}`}
              >
                {TIER_LABEL[tier]}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (row.status === "completed") {
    return (
      <li>
        <Link href={`/history/${row.run_id}`} className="block">
          {content}
        </Link>
      </li>
    );
  }

  return <li>{content}</li>;
}

function StatusBadge({ status }: { status: Status }) {
  const label = status === "pending" ? "Running" : status === "failed" ? "Failed" : "Filed";
  const cls =
    status === "pending"
      ? "text-warm"
      : status === "failed"
        ? "text-destructive"
        : "text-cold";
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-[0.28em] ${cls}`}
    >
      {label}
    </span>
  );
}
