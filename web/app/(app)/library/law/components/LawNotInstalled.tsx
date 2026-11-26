/* law.db is an optional download: its absence is a state, not an error. */
export function LawNotInstalled() {
  return (
    <div className="card space-y-2 p-5 text-[14px] text-ink-secondary">
      <p className="text-ink-primary">The law library is not installed on this instance.</p>
      <p>
        Run <code>npm run corpus -- law fetch</code> to download it, or{" "}
        <code>npm run corpus -- law sync</code> to build it. Then reload this page.
      </p>
    </div>
  );
}
