import { deleteBlob, writeBlob } from "@/lib/blobStore";
import { getOwnerSession } from "@/lib/localAuth";
import { getOwnerFilingForYear, insertUploadedDocument, listUploads } from "@/lib/serverDb";
import { MAX_UPLOAD_BYTES, sniffUploadType } from "@/lib/uploadTypes";
import { NextResponse } from "next/server";

/*
 * Persists a user-attached file: bytes → local documents dir (blobStore),
 * metadata row → libsql app DB. The browser posts FormData here because
 * both stores are server-side files it cannot reach.
 */

const DEMO_TAX_YEAR = 2025;

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function ulid(): string {
  const time = Date.now();
  let timeStr = "";
  let t = time;
  for (let i = 9; i >= 0; i--) {
    timeStr = ULID_ALPHABET[t % 32] + timeStr;
    t = Math.floor(t / 32);
  }
  const rand = new Uint8Array(16);
  crypto.getRandomValues(rand);
  let randStr = "";
  for (let i = 0; i < 16; i++) randStr += ULID_ALPHABET[rand[i] % 32];
  return timeStr + randStr;
}

function slugify(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "file";
}

/* The file's bytes and real type (lib/uploadTypes.ts), or the error response. */
async function readAllowedFile(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file is larger than 25 MB" }, { status: 413 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniffUploadType(bytes);
  if (!type) {
    return NextResponse.json({ error: "upload a PDF, PNG, JPEG or WebP file" }, { status: 415 });
  }
  return { bytes, type };
}

// List the caller's uploads (Documents tab grid, home-tab quick links).
export async function GET() {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const filing = await getOwnerFilingForYear(session.userId, DEMO_TAX_YEAR);
  return NextResponse.json(await listUploads(filing.id));
}

export async function POST(request: Request) {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "expected FormData" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const checked = await readAllowedFile(file);
  if (checked instanceof NextResponse) return checked;
  const { bytes, type } = checked;

  const filing = await getOwnerFilingForYear(session.userId, DEMO_TAX_YEAR);

  const slug = slugify(file.name);
  const storagePath = `${filing.id}/uploads/${slug}-${ulid()}.${type.ext}`;

  try {
    await writeBlob(storagePath, bytes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `upload failed: ${message}` }, { status: 500 });
  }

  try {
    const id = await insertUploadedDocument({
      userId: session.userId,
      filingId: filing.id,
      filename: file.name,
      storagePath,
      sizeBytes: file.size,
      mimeType: type.mimeType,
    });
    return NextResponse.json({ id, filename: file.name, storagePath });
  } catch (err) {
    /*
     * Roll back the orphan file, so a metadata failure does not leave
     * unreachable bytes on disk.
     */
    await deleteBlob(storagePath);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `upload metadata insert failed: ${message}` },
      { status: 500 },
    );
  }
}
