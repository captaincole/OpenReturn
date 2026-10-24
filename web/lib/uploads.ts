/*
 * Uploads a user-attached file via the /api/uploads Route Handler. The
 * handler authenticates from the session cookie, writes the bytes to the
 * local documents dir (blobStore), and inserts the metadata row in the
 * libsql app DB.
 *
 * The browser used to write both stores directly. The whole persist path
 * now sits behind the API route because the metadata lives in a
 * server-side file. The same bytes also flow through the chat message as
 * base64, in parallel with this call, for the agent's vision-based
 * extraction.
 */

export interface UploadResult {
  id: string;
  filename: string;
  storagePath: string;
}

export async function uploadDocument(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file, file.name);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  if (!res.ok) {
    let message = `upload failed (HTTP ${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return (await res.json()) as UploadResult;
}
