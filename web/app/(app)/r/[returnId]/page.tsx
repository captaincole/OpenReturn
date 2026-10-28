"use client";

/* Mobile hides sections instead of unmounting them, so a tab switch does not refetch. */

import { useAppShell, type MobilePane } from "@/components/AppShell";
import { cn } from "@/lib/cn";
import { ActivityTicker } from "./components/ActivityRail";
import { DocumentsSection } from "./components/DocumentsSection";
import { FormsSection } from "./components/FormsSection";
import { RequestedActionsCard } from "./components/RequestedActions";

export default function ReturnWorkspace() {
  const { activeReturn, resetTick, turnTick } = useAppShell();

  if (!activeReturn.realDataAvailable) {
    return <PlaceholderWorkspace />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 pt-4 pb-10 lg:px-10 lg:pt-6">
      <Pane id="activity" className="space-y-6">
        <ActivityTicker refreshKey={turnTick + resetTick * 10000} />
        <RequestedActionsCard />
      </Pane>
      <Pane id="forms">
        <FormsSection />
      </Pane>
      <Pane id="documents">
        <DocumentsSection />
      </Pane>
    </div>
  );
}

function Pane({
  id,
  className,
  children,
}: {
  id: Exclude<MobilePane, "chat">;
  className?: string;
  children: React.ReactNode;
}) {
  const { mobilePane } = useAppShell();
  return <div className={cn(className, mobilePane !== id && "hidden lg:block")}>{children}</div>;
}

function PlaceholderWorkspace() {
  /* Unreachable today: every queried TaxReturn has realDataAvailable=true. */
  const { activeReturn } = useAppShell();
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center lg:px-10">
      <div className="text-[11px] tracking-[0.22em] text-ink-muted uppercase">
        {activeReturn.label}
      </div>
      <h1 className="mt-3 font-serif text-3xl text-ink-primary">
        {activeReturn.state === "filed" ? "Filed and read-only" : "Not started yet"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-secondary">
        {activeReturn.state === "filed"
          ? "This return is in the archive."
          : "Real work happens on your active return."}
      </p>
    </div>
  );
}
