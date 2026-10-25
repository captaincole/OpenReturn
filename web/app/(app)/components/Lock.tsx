export function LockOverlay({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-bg-base/40 backdrop-blur-[2px]">
      <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated/90 px-4 py-2.5 text-[12px] text-ink-secondary">
        <LockIcon className="h-3.5 w-3.5" />
        <span>{text}</span>
      </div>
    </div>
  );
}

export function LockIcon({ className }: { className?: string }) {
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
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
