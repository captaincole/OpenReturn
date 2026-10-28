"use client";

import { UnauthorizedError } from "@/lib/api";
import { fetchAskThread, type AskThread } from "@/lib/ask";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AskComposer } from "./AskComposer";
import { TurnView } from "./TurnView";

const POLL_MS = 1500;

function useThread(threadId: string, pollTick: number) {
  const router = useRouter();
  const [thread, setThread] = useState<AskThread | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const next = await fetchAskThread(threadId);
        if (cancelled) return;
        setThread(next);
        if (next.turns.some((t) => t.status === "running")) {
          timer = setTimeout(() => void load(), POLL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof UnauthorizedError) {
          await signOut();
          router.push("/login");
          return;
        }
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    }
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [threadId, pollTick, router]);

  return { thread, loadError };
}

export function AskThreadView({ threadId }: { threadId: string }) {
  const [pollTick, setPollTick] = useState(0);
  const { thread, loadError } = useThread(threadId, pollTick);
  const lastTurnRef = useRef<HTMLDivElement>(null);
  const turnCount = thread?.turns.length ?? 0;

  useEffect(() => {
    if (turnCount > 1) lastTurnRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turnCount]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl text-[14px] text-ink-secondary">
        <p className="text-danger">{loadError}</p>
        <Link href="/" className="mt-3 inline-block text-accent hover:text-accent-hover">
          ← Back to home
        </Link>
      </div>
    );
  }
  if (!thread) {
    return <div className="mx-auto max-w-3xl text-[14px] text-ink-muted">Loading…</div>;
  }

  const running = thread.turns.some((t) => t.status === "running");
  return (
    // flex-1 + the composer's mt-auto: on a short thread the composer still sits at the bottom.
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12">
      {thread.turns.map((turn, i) => (
        <div key={turn.id} ref={i === turnCount - 1 ? lastTurnRef : undefined}>
          <TurnView turn={turn} />
        </div>
      ))}
      <AskComposer
        threadId={thread.id}
        disabled={running}
        onFollowUp={() => setPollTick((t) => t + 1)}
      />
    </div>
  );
}
