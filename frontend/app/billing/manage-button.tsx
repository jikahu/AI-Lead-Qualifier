"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to open portal");
      window.location.href = data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        type="button"
        size="lg"
        onClick={onClick}
        disabled={loading}
        className="h-12 w-full text-sm font-medium tracking-wide"
      >
        {loading ? "Opening…" : "Manage subscription"}
      </Button>
      {error && (
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-destructive">
          ✗ {error}
        </p>
      )}
    </div>
  );
}
