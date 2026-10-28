export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function formatPublished(published: string): string {
  const [year, month] = published.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1)).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function humanizeKey(key: string): string {
  const parts = key.split(/[._]/);
  return parts
    .map((part, i) =>
      i === 0
        ? part.charAt(0).toUpperCase() + part.replace(/-/g, " ").slice(1)
        : part.replace(/-/g, " "),
    )
    .join(" · ");
}

export function briefValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.length === 0 ? "—" : `${v.length} items`;
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return "—";
    const [k, val] = entries[0];
    return `${k}: ${briefValue(val)}`;
  }
  return String(v);
}
