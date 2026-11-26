import { cn } from "@/lib/cn";
import Link from "next/link";

const TABS = [
  { id: "documents", label: "Documents", href: "/library" },
  { id: "graph", label: "Form graph", href: "/library/graph" },
  { id: "law", label: "Law", href: "/library/law" },
] as const;

export function LibraryTabs({ active }: { active: (typeof TABS)[number]["id"] }) {
  return (
    <nav aria-label="Reference Library" className="flex gap-6 border-b border-border-subtle">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 pb-2.5 text-[14px] transition-colors",
            tab.id === active
              ? "border-accent text-ink-primary"
              : "border-transparent text-ink-secondary hover:text-ink-primary",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
