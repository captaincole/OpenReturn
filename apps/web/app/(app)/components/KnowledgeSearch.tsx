/*
 * Tax-code knowledge search — placeholder. The box is disabled until the
 * feature ships. When it does, a question runs the same hybrid retrieval
 * over the reference corpus that the review workflow uses, and the answer
 * cites the blocks it read.
 */

export function KnowledgeSearch() {
  return (
    <section aria-label="Tax code search">
      <div className="card flex cursor-not-allowed items-center gap-3 px-5 py-4 opacity-80">
        <SearchIcon className="h-4 w-4 shrink-0 text-ink-muted" />
        <input
          type="search"
          disabled
          placeholder="Ask the tax code — e.g. can I deduct my home office?"
          className="min-w-0 flex-1 cursor-not-allowed bg-transparent text-[15px] text-ink-primary placeholder:text-ink-muted focus:outline-none"
        />
        <span className="shrink-0 rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 text-[10px] tracking-wider text-ink-muted uppercase">
          Coming soon
        </span>
      </div>
      <p className="mt-2 px-1 text-[12px] text-ink-muted">
        Answers come from IRS and FTB publications, with a citation for each one.
      </p>
    </section>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
