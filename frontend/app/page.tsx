import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { FREE_TIER_LIMIT, getMonthlyUsage, getPlanState } from "@/lib/billing";

import { QualifyForm } from "./qualify-form";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Proxy already redirects unauthenticated users; this is just for type narrowing.
  if (!user) return null;

  const [planState, used] = await Promise.all([
    getPlanState(supabase, user.id),
    getMonthlyUsage(supabase, user.id),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10 sm:py-16">
      <Reveal as="header" delay={0}>
        <div className="flex items-center gap-5 border-b border-border/60 pb-5 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
          <span className="flex items-center gap-2.5 text-foreground/85">
            <span className="status-dot text-primary" />
            <span className="text-foreground">Lead Qualifier</span>
          </span>
          <Link
            href="/history"
            className="text-foreground/85 transition-colors hover:text-primary"
          >
            History
          </Link>
        </div>
      </Reveal>

      <section className="relative mt-16 mb-14 sm:mt-24 sm:mb-20">
        <Reveal delay={200}>
          <h1 className="font-display text-6xl leading-[0.93] tracking-tight text-foreground sm:text-[104px]">
            A second
          </h1>
        </Reveal>

        <Reveal delay={280}>
          <h1 className="ml-[0.18em] font-display text-6xl italic leading-[0.93] tracking-tight text-primary sm:ml-[0.22em] sm:text-[104px]">
            opinion,
          </h1>
        </Reveal>

        <Reveal delay={360}>
          <h1 className="font-display text-6xl leading-[0.93] tracking-tight text-foreground sm:text-[104px]">
            on every lead.
          </h1>
        </Reveal>

        <Reveal delay={520}>
          <p className="mt-9 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Drop the details below. The analyst returns a score, the signals
            worth chasing, and the concerns worth knowing — before you spend
            the hour on the call.
          </p>
        </Reveal>
      </section>

      <QualifyForm plan={planState.plan} used={used} limit={FREE_TIER_LIMIT} />
    </main>
  );
}

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
