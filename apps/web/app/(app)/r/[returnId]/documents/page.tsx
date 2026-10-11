"use client";

/*
 * Documents tab — uploads only. Generated drafts (1040, 540, sidecar)
 * live on the Forms tab, per Andrew's labeling rule: inputs and outputs
 * are different concerns.
 *
 * The drop zone wraps the existing uploadDocument flow. The card list
 * reads /api/uploads (libsql app DB, session-cookie auth).
 */

import { useAppShell } from "@/components/AppShell";
import { cn } from "@/lib/cn";
import { uploadDocument } from "@/lib/uploads";
import { useCallback, useEffect, useRef, useState } from "react";

interface UploadRow {
  id: string;
  filename: string;
  created_at: string;
  mime_type: string | null;
  size_bytes: number | null;
}

export default function DocumentsTab() {
  const { activeReturn, resetTick, lucaBusy, sendChat, setMobilePane } = useAppShell();
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUploads = useCallback(() => {
    let cancelled = false;
    fetch("/api/uploads", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as UploadRow[];
      })
      .then((rows) => {
        if (!cancelled) setUploads(rows);
      })
      .catch((err) => {
        console.warn("[documents] failed to load uploads:", err);
        if (!cancelled) setUploads([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeReturn.realDataAvailable) return;
    return loadUploads();
  }, [resetTick, activeReturn.realDataAvailable, loadUploads]);

  /*
   * Mirrors the Requested Actions upload flow. Write to user_documents
   * first, so the document appears in the grid with a real ID. Then hand
   * the file to Luca via sendChat with skipUpload=true; he reacts to it
   * exactly like a chat-attached upload. setMobilePane("chat") lets
   * mobile users see Luca respond instead of the same grid.
   */
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadDocument(file);
        loadUploads();
        setMobilePane("chat");
        await sendChat({
          text: `Uploaded ${file.name}`,
          file,
          skipUpload: true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!activeReturn.realDataAvailable) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center lg:px-10">
        <div className="text-[11px] tracking-[0.22em] text-ink-muted uppercase">
          {activeReturn.label}
        </div>
        <h1 className="mt-3 font-serif text-3xl text-ink-primary">No documents yet</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-secondary">
          Documents you upload appear here. Switch to your 2025 Return to add files.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink-primary">Documents</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            W-2s, 1099s, K-1s — anything you've uploaded.
          </p>
        </div>
        <span className="text-[11px] tracking-wider text-ink-muted uppercase">
          {uploads.length} {uploads.length === 1 ? "file" : "files"}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!lucaBusy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!lucaBusy) handleFiles(e.dataTransfer.files);
        }}
        disabled={uploading || lucaBusy}
        className={cn(
          "w-full cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-accent/60 bg-accent/5"
            : "border-border-subtle bg-bg-subtle/40 hover:border-accent/40",
          (uploading || lucaBusy) && "cursor-not-allowed opacity-60",
        )}
      >
        <div className="text-3xl text-ink-muted">⬆</div>
        <div className="mt-2 text-sm text-ink-primary">
          {lucaBusy
            ? "Wait for Luca to finish before uploading"
            : uploading
              ? "Uploading…"
              : "Drop W-2s, 1099s, or other tax documents here"}
        </div>
        <div className="mt-1 text-xs text-ink-muted">PDF, PNG, JPG · up to 10 MB each</div>
        {!lucaBusy && (
          <div className="mt-4 text-xs text-accent hover:text-accent-hover">or browse files</div>
        )}
      </button>

      {error && (
        <div className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {uploads.length === 0 && !uploading && (
          <div className="card col-span-full px-6 py-8 text-center">
            <div className="text-sm text-ink-muted">No uploads yet.</div>
            <div className="mt-1 text-xs text-ink-faint">
              Drop a W-2, 1099, or receipt above — or attach one in chat.
            </div>
          </div>
        )}
        {uploads.map((doc) => (
          <DocCard key={doc.id} doc={doc} />
        ))}
      </div>
    </div>
  );
}

function DocCard({ doc }: { doc: UploadRow }) {
  const href = `/documents/${doc.id}`;
  const downloadHref = `${href}?download=1`;
  return (
    <div className="card group flex flex-col gap-3 p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between">
        <span className="rounded bg-bg-elevated px-2 py-0.5 text-[10px] tracking-wide text-ink-secondary uppercase">
          {inferType(doc)}
        </span>
        <span className="text-[10px] text-ink-faint tabular-nums">
          {formatBytes(doc.size_bytes)}
        </span>
      </div>
      <div className="flex aspect-[3/4] items-center justify-center rounded-lg border border-border-subtle bg-bg-elevated/50">
        <span className="font-mono text-xs text-ink-faint">PDF</span>
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm text-ink-primary">{doc.filename}</div>
        <div className="mt-0.5 text-[11px] text-ink-muted">{formatUploadedAt(doc.created_at)}</div>
      </div>
      <div className="flex gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded border border-border-subtle py-1.5 text-center text-xs text-ink-secondary transition-colors hover:border-border-strong hover:text-ink-primary"
        >
          Preview
        </a>
        <a
          href={downloadHref}
          className="flex-1 rounded border border-border-subtle py-1.5 text-center text-xs text-ink-secondary transition-colors hover:border-border-strong hover:text-ink-primary"
        >
          Download
        </a>
      </div>
    </div>
  );
}

function inferType(doc: UploadRow): string {
  const name = doc.filename.toLowerCase();
  if (name.includes("w-2") || name.includes("w2")) return "W-2";
  if (name.includes("1099-int")) return "1099-INT";
  if (name.includes("1099-div")) return "1099-DIV";
  if (name.includes("1099-misc")) return "1099-MISC";
  if (name.includes("1099-nec")) return "1099-NEC";
  if (name.includes("1099")) return "1099";
  if (name.includes("k-1") || name.includes("k1")) return "K-1";
  if (name.includes("1098")) return "1098";
  return "Doc";
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadedAt(iso: string): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString(undefined, opts);
}
