export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const secs = Math.max(1, Math.round(ms / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
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

export function briefValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.length === 0 ? "—" : `${value.length} items`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "—";
    const [key, val] = entries[0];
    return `${key}: ${briefValue(val)}`;
  }
  return String(value);
}
