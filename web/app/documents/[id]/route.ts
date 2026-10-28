import { readBlob } from "@/lib/blobStore";
import { getOwnerSession } from "@/lib/localAuth";
import { getDocumentById, hasMembership } from "@/lib/serverDb";
import { type NextRequest, NextResponse } from "next/server";

/*
 * Any type not in INLINE_TYPES (HTML, SVG, anything unknown) always
 * downloads, so an upload cannot render as a page on this origin. The
 * stored type is the browser's claim; nosniff stops it reading past that.
 */
const INLINE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/json",
]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const doc = await getDocumentById(id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  /* 404, not 403, so non-members cannot probe which document ids exist. */
  if (!(await hasMembership(doc.filingId, session.userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const wantsDownload =
    request.nextUrl.searchParams.get("download") === "1" || !INLINE_TYPES.has(doc.mimeType ?? "");
  let bytes: Buffer;
  try {
    bytes = await readBlob(doc.storagePath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": doc.mimeType ?? "application/octet-stream",
    "Content-Length": String(bytes.byteLength),
    "Cache-Control": "private, no-store",
  });
  // RFC 5987 filename* handles non-ASCII (em-dashes in draft names).
  const encoded = encodeURIComponent(doc.filename);
  headers.set(
    "Content-Disposition",
    `${wantsDownload ? "attachment" : "inline"}; filename*=UTF-8''${encoded}`,
  );
  return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
}
