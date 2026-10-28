/* The same bytes also go to the agent as base64 in the chat message, in parallel. */

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
