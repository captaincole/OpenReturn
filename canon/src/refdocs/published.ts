/*
 * FTB's tax-year pages show no date, so they have none: a fetch date would
 * make them win every newer-document comparison.
 */

const DATE = /^\d{4}-\d{2}(-\d{2})?$/;

export const isPublishedDate = (value: unknown): value is string =>
  typeof value === "string" && DATE.test(value);

export function htmlPublished(html: string): string | null {
  const match = /Revised:\s*(\d{2})\/(\d{4})/.exec(html);
  return match ? `${match[2]}-${match[1]}` : null;
}

export function formatPublished(published: string): string {
  const [year, month] = published.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1)).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
