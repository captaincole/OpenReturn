/*
 * The file types a user may upload: what the attach buttons accept
 * (application/pdf, image/png, image/jpeg, image/webp), checked on the
 * server by the file's first bytes, not by the type the browser claims.
 * An HTML or SVG file renamed .pdf is refused, so the documents route
 * never serves script-bearing markup from this origin.
 */

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const SIGNATURES: { mimeType: string; ext: string; matches: (b: Uint8Array) => boolean }[] = [
  { mimeType: "application/pdf", ext: "pdf", matches: (b) => ascii(b, 0, 5) === "%PDF-" },
  {
    mimeType: "image/png",
    ext: "png",
    matches: (b) => b[0] === 0x89 && ascii(b, 1, 4) === "PNG",
  },
  {
    mimeType: "image/jpeg",
    ext: "jpg",
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mimeType: "image/webp",
    ext: "webp",
    matches: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP",
  },
];

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}

/** The upload's real type, from its first bytes; null when it is not an allowed type. */
export function sniffUploadType(bytes: Uint8Array): { mimeType: string; ext: string } | null {
  const hit = SIGNATURES.find((s) => s.matches(bytes));
  return hit ? { mimeType: hit.mimeType, ext: hit.ext } : null;
}

/* Types the documents route may show inline; anything else downloads. */
const INLINE_TYPES = new Set([...SIGNATURES.map((s) => s.mimeType), "application/json"]);

export function servesInline(mimeType: string | null): boolean {
  return mimeType !== null && INLINE_TYPES.has(mimeType);
}
