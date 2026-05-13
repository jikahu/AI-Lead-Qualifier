import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-full border border-border/60 bg-background/85 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md sm:right-6 sm:top-6 sm:text-[11px]">
      <Link
        href="/billing"
        className="text-foreground/85 transition-colors hover:text-primary"
      >
        Billing
      </Link>
      <span aria-hidden className="h-3 w-px bg-border/60" />
      <form action={signOut}>
        <button
          type="submit"
          className="text-foreground/85 transition-colors hover:text-destructive"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
