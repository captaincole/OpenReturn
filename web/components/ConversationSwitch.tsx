"use client";

import { useAppShell } from "@/components/AppShell";
import { DEDUCTIONS_SEGMENT, type Conversation } from "@/lib/chatSession";
import { cn } from "@/lib/cn";
import Link from "next/link";

/* Return | Deductions: the filing's two conversations with Cade, each on its own route. */
export function ConversationSwitch({ className }: { className?: string }) {
  const { activeReturn, conversation, setMobilePane } = useAppShell();
  const tabs: { id: Conversation["id"]; label: string; href: string }[] = [
    { id: "return", label: "Return", href: `/r/${activeReturn.id}` },
    {
      id: "deductions",
      label: "Deductions",
      href: `/r/${activeReturn.id}/${DEDUCTIONS_SEGMENT}`,
    },
  ];
  return (
    <nav
      aria-label="Conversation"
      className={cn(
        "items-center gap-0.5 rounded-lg border border-border-subtle bg-bg-panel p-0.5",
        className,
      )}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={conversation === tab.id ? "page" : undefined}
          /* On a phone, the deductions route opens on the conversation, not the summary. */
          onClick={() => tab.id === "deductions" && setMobilePane("chat")}
          className={cn(
            "flex-1 rounded-md px-3 py-1 text-center text-xs font-medium transition-colors",
            conversation === tab.id
              ? "bg-bg-elevated text-ink-primary"
              : "text-ink-secondary hover:text-ink-primary",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
