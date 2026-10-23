/*
 * When the publisher issued a corpus document, as "YYYY-MM-DD" or
 * "YYYY-MM". The Ask answerer sees it in each passage header and prefers
 * the newer document when passages disagree (a 1040-ES printed before a
 * mid-year law change still shows the old amounts).
 *
 * A sidecar's "published" wins. Otherwise a PDF gives its CreationDate
 * (extract.ts pdfPublished). An FTB page's date is the "Revised: MM/YYYY"
 * in its h1, which add-html copies into the sidecar (the cleaned page
 * drops it). FTB's tax-year instruction pages show none, so they have no
 * date: a fetch date would make them win every comparison.
 */

const DATE = /^\d{4}-\d{2}(-\d{2})?$/;

export const isPublishedDate = (v: unknown): v is string => typeof v === "string" && DATE.test(v);

/* "Revised: 01/2015" on a cleaned FTB page → "2015-01". */
export function htmlPublished(html: string): string | null {
  const m = /Revised:\s*(\d{2})\/(\d{4})/.exec(html);
  return m ? `${m[2]}-${m[1]}` : null;
}

/* "2025-02-05" → "Feb 2025", for passage headers and the library. */
export function formatPublished(published: string): string {
  const [year, month] = published.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1)).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
