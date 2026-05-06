"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  BUDGET_RANGES,
  COMPANY_SIZES,
  INDUSTRIES,
  TIMELINES,
  type BudgetRange,
  type CompanySize,
  type Industry,
  type Timeline,
} from "../../workflows/qualify-lead.schema";

type FormState = {
  name: string;
  email: string;
  company: string;
  title: string;
  industry: Industry | "";
  companySize: CompanySize | "";
  budgetRange: BudgetRange | "";
  timeline: Timeline | "";
  painPoint: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  company: "",
  title: "",
  industry: "",
  companySize: "",
  budgetRange: "",
  timeline: "",
  painPoint: "",
};

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        industry: form.industry || undefined,
        companySize: form.companySize || undefined,
      };
      const res = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to qualify");

      router.push(
        `/results/${data.runId}?token=${encodeURIComponent(data.publicAccessToken)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10 sm:py-16">
      {/* ── Top rail ─────────────────────────────── */}
      <Reveal as="header" delay={0}>
        <div className="flex items-center border-b border-border/60 pb-5 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
          <span className="flex items-center gap-2.5 text-foreground/85">
            <span className="status-dot text-primary" />
            <span className="text-foreground">Lead read</span>
          </span>
        </div>
      </Reveal>

      {/* ── Hero ─────────────────────────────────── */}
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

      {/* ── Form card ────────────────────────────── */}
      <Reveal delay={640}>
        <Card className="overflow-hidden border-border/70">
          <CardContent className="space-y-10 px-6 py-10 sm:px-10 sm:py-12">
            <form
              id="qualify-form"
              onSubmit={onSubmit}
              className="space-y-12"
            >
              {/* ── Section 1: Company Profile ── */}
              <section className="space-y-7">
                <SectionHeader>Company Profile</SectionHeader>

                <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2">
                  <FieldGroup index={1}>
                    <FieldLabel htmlFor="name" required>
                      Name
                    </FieldLabel>
                    <Input
                      id="name"
                      required
                      placeholder="Sarah Chen"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className="h-11 text-base"
                    />
                  </FieldGroup>

                  <FieldGroup index={2}>
                    <FieldLabel htmlFor="email" required>
                      Email
                    </FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="schen@acmebank.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="h-11 text-base"
                    />
                  </FieldGroup>

                  <FieldGroup index={3}>
                    <FieldLabel htmlFor="company" required>
                      Company
                    </FieldLabel>
                    <Input
                      id="company"
                      required
                      placeholder="Acme Bank"
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                      className="h-11 text-base"
                    />
                  </FieldGroup>

                  <FieldGroup index={4}>
                    <FieldLabel htmlFor="title">Title</FieldLabel>
                    <Input
                      id="title"
                      placeholder="VP of Engineering"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      className="h-11 text-base"
                    />
                  </FieldGroup>

                  <FieldGroup index={5}>
                    <FieldLabel htmlFor="industry">Industry</FieldLabel>
                    <Select
                      value={form.industry}
                      onValueChange={(v) => update("industry", v as Industry)}
                    >
                      <SelectTrigger
                        id="industry"
                        className="h-11 w-full text-base"
                      >
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((i) => (
                          <SelectItem key={i} value={i} className="text-base">
                            {i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldGroup>

                  <FieldGroup index={6}>
                    <FieldLabel htmlFor="companySize">
                      Company size
                    </FieldLabel>
                    <Select
                      value={form.companySize}
                      onValueChange={(v) =>
                        update("companySize", v as CompanySize)
                      }
                    >
                      <SelectTrigger
                        id="companySize"
                        className="h-11 w-full text-base"
                      >
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map((s) => (
                          <SelectItem key={s} value={s} className="text-base">
                            {s} employees
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                </div>
              </section>

              {/* ── Section 2: Qualification Criteria ── */}
              <section className="space-y-7">
                <SectionHeader>Qualification Criteria</SectionHeader>

                <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2">
                  <FieldGroup index={7}>
                    <FieldLabel htmlFor="budgetRange" required>
                      Annual budget range
                    </FieldLabel>
                    <Select
                      value={form.budgetRange}
                      onValueChange={(v) =>
                        update("budgetRange", v as BudgetRange)
                      }
                    >
                      <SelectTrigger
                        id="budgetRange"
                        className="h-11 w-full text-base"
                      >
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((b) => (
                          <SelectItem key={b} value={b} className="text-base">
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldGroup>

                  <FieldGroup index={8}>
                    <FieldLabel htmlFor="timeline" required>
                      Timeline / urgency
                    </FieldLabel>
                    <Select
                      value={form.timeline}
                      onValueChange={(v) => update("timeline", v as Timeline)}
                    >
                      <SelectTrigger
                        id="timeline"
                        className="h-11 w-full text-base"
                      >
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMELINES.map((t) => (
                          <SelectItem key={t} value={t} className="text-base">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldGroup>

                  <FieldGroup index={9} fullWidth>
                    <FieldLabel htmlFor="painPoint" required>
                      Primary pain point
                    </FieldLabel>
                    <Textarea
                      id="painPoint"
                      required
                      rows={4}
                      placeholder="Describe the specific problem this lead is trying to solve. Be concrete — vague pain points are weak signals."
                      value={form.painPoint}
                      onChange={(e) => update("painPoint", e.target.value)}
                      className="text-base leading-relaxed"
                    />
                  </FieldGroup>
                </div>
              </section>

              {error && (
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-destructive">
                  ✗ {error}
                </p>
              )}
            </form>
          </CardContent>

          <CardFooter className="border-t border-border/70 bg-card/50 px-6 py-6 sm:px-10">
            <Button
              type="submit"
              form="qualify-form"
              disabled={submitting}
              size="lg"
              className="h-12 w-full text-sm font-medium tracking-wide"
            >
              {submitting ? "Sending…" : "Analyze Lead"}
            </Button>
          </CardFooter>
        </Card>
      </Reveal>
    </main>
  );
}

/* ────────────────────────────────────────────── */

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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-sm font-medium uppercase tracking-[0.28em] text-foreground">
        {children}
      </span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function FieldGroup({
  children,
  index,
  fullWidth,
}: {
  children: React.ReactNode;
  index: number;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-2 duration-500 grid gap-2 ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
      style={{
        animationDelay: `${740 + index * 50}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground"
    >
      {children}
      {required && <span className="text-primary">*</span>}
    </Label>
  );
}
