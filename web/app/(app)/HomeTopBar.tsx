import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export function HomeTopBar({ initials, title = "Home" }: { initials: string; title?: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-bg-base/95 px-4 backdrop-blur-sm lg:px-6">
      <Link
        href="/"
        title="Home"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 transition-colors hover:bg-accent/25"
      >
        <span className="font-serif text-sm leading-none text-accent">W</span>
      </Link>
      <div className="h-6 w-px shrink-0 bg-border-subtle" />
      <span className="text-[15px] font-semibold tracking-tight text-ink-primary">{title}</span>
      <div className="flex-1" />
      <Link
        href="/library"
        className="text-[13px] text-ink-secondary transition-colors hover:text-ink-primary"
      >
        Reference Library
      </Link>
      <ThemeToggle />
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-xs font-medium text-accent">
        {initials}
      </div>
    </header>
  );
}
