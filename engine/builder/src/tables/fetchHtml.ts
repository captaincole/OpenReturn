/* The cached HTML is checked in as provenance: a frozen copy of what the source served. */

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface SourceProvenance {
  url: string;
  fetchedAt: string;
  sha256: string;
  cacheFile: string;
}

export interface FetchHtmlResult {
  html: string;
  source: SourceProvenance;
  cached: boolean;
}

export async function fetchHtml(opts: {
  url: string;
  cachePath: string;
  refresh?: boolean;
}): Promise<FetchHtmlResult> {
  const { url, cachePath, refresh = false } = opts;
  const abs = path.resolve(cachePath);

  if (!refresh) {
    const cached = await readCache(url, abs);
    if (cached) return cached;
  }

  const res = await fetch(url, {
    headers: {
      // Send a real-browser UA; irs.gov sometimes returns 403 for default UAs.
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10157) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`fetchHtml: ${url} → HTTP ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const sha = sha256(html);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, html, "utf8");
  return {
    html,
    cached: false,
    source: {
      url,
      fetchedAt: new Date().toISOString(),
      sha256: sha,
      cacheFile: path.basename(abs),
    },
  };
}

async function readCache(url: string, abs: string): Promise<FetchHtmlResult | null> {
  try {
    const html = await fs.readFile(abs, "utf8");
    const stat = await fs.stat(abs);
    return {
      html,
      cached: true,
      source: {
        url,
        fetchedAt: stat.mtime.toISOString(),
        sha256: sha256(html),
        cacheFile: path.basename(abs),
      },
    };
  } catch (err: unknown) {
    const errno = err as NodeJS.ErrnoException;
    if (errno.code !== "ENOENT") throw err;
    return null;
  }
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
