"use client";

import { UnauthorizedError } from "@/lib/api";
import { askFollowUp, askNewQuestion } from "@/lib/ask";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

/*
 * Sends a question. With no threadId it starts a new thread and
 * navigates to /ask/<threadId>. With a threadId it adds a follow-up and
 * calls onFollowUp so the thread view starts polling. Shared by the home
 * search box and the composer under a thread.
 */
export function useAskSubmit(onFollowUp?: () => void) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(question: string, threadId?: string): Promise<boolean> {
    const q = question.trim();
    if (!q || busy) return false;
    setBusy(true);
    setError(null);
    try {
      if (threadId) {
        await askFollowUp(threadId, q);
        setBusy(false);
        onFollowUp?.();
      } else {
        // Stay busy through the navigation so a second click cannot fire.
        const started = await askNewQuestion(q);
        router.push(`/ask/${started.threadId}`);
      }
      return true;
    } catch (err) {
      setBusy(false);
      if (err instanceof UnauthorizedError) {
        await signOut();
        router.push("/login");
        return false;
      }
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  return { busy, error, submit };
}
