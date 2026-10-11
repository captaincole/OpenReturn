export function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-[11px] tracking-[0.22em] text-ink-muted uppercase">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
