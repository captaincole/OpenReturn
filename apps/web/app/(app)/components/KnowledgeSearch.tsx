"use client";

/*
 * Tax-code search box on the home page. Submitting a question starts a
 * new Q&A thread and navigates to /ask/<threadId>, where the answer
 * renders with numbered references. The answer pipeline searches the
 * documents listed on /library.
 */

import Link from "next/link";
import { useState } from "react";
import { useAskSubmit } from "../ask/useAskSubmit";

export function KnowledgeSearch() {
  const [question, setQuestion] = useState("");
  const { busy, error, submit } = useAskSubmit();

  return (
    <section aria-label="Tax code search">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(question);
        }}
        className="card flex items-center gap-3 px-5 py-4 transition-colors focus-within:border-accent/60"
      >
        <SearchIcon className="h-4 w-4 shrink-0 text-ink-muted" />
        <input
          type="search"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={busy}
          placeholder="Ask the tax code — e.g. can I deduct my home office?"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-primary placeholder:text-ink-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-ink-muted"
        >
          {busy ? "Asking…" : "Ask"}
        </button>
      </form>
      {error && <p className="mt-2 px-1 text-[12px] text-red-400">{error}</p>}
      <p className="mt-2 flex flex-wrap items-baseline justify-between gap-2 px-1 text-[12px] text-ink-muted">
        <span>Answers come from IRS and FTB publications, with a citation for each one.</span>
        <Link href="/library" className="text-ink-secondary hover:text-ink-primary">
          Reference Library →
        </Link>
      </p>
    </section>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
