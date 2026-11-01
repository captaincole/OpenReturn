"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";
import { useAskSubmit } from "../../useAskSubmit";

type Mode = "follow_up" | "new";

const MODES: { mode: Mode; label: string; placeholder: string }[] = [
  { mode: "follow_up", label: "Follow up", placeholder: "Ask a follow-up question…" },
  { mode: "new", label: "Ask a different question", placeholder: "Ask a new question…" },
];

export function AskComposer({
  threadId,
  disabled,
  onFollowUp,
}: {
  threadId: string;
  disabled: boolean;
  onFollowUp: () => void;
}) {
  const [mode, setMode] = useState<Mode>("follow_up");
  const [question, setQuestion] = useState("");
  const { busy, error, submit } = useAskSubmit(onFollowUp);
  const locked = disabled || busy;

  async function send() {
    const sent = await submit(question, mode === "follow_up" ? threadId : undefined);
    if (sent && mode === "follow_up") setQuestion("");
  }

  return (
    <section
      aria-label="Ask another question"
      className="sticky bottom-0 -mx-2 mt-auto bg-gradient-to-t from-bg-base from-75% to-transparent px-2 pt-8 pb-4"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="card space-y-2.5 px-4 py-3 shadow-lg shadow-black/40 focus-within:border-accent/60 light:shadow-black/10"
      >
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => setMode(option.mode)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors",
                mode === option.mode
                  ? "border-accent/50 bg-accent/15 text-ink-primary"
                  : "border-border-subtle text-ink-secondary hover:border-border-strong hover:text-ink-primary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-3">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            disabled={locked}
            placeholder={
              disabled
                ? "Wait for the answer to finish…"
                : MODES.find((option) => option.mode === mode)?.placeholder
            }
            className="[field-sizing:content] max-h-32 min-w-0 flex-1 resize-none bg-transparent py-1 text-[15px] text-ink-primary placeholder:text-ink-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={locked || !question.trim()}
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-ink-muted"
          >
            {busy ? "Asking…" : "Ask"}
          </button>
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </form>
    </section>
  );
}
