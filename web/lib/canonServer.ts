import type { LawNotInstalled, LawSection, LawSource, LawStatus } from "./law";
import type { LawToc } from "./lawToc";

/*
 * SERVER-ONLY. Calls Canon from a Server Component or a Route Handler, the
 * way the /api/canon proxy does. Callers check the session first.
 */

export const canonInternalUrl = (): string =>
  process.env.CANON_INTERNAL_URL ?? "http://127.0.0.1:4112";

export function canonAuthHeaders(): Record<string, string> {
  const token = process.env.CANON_API_TOKEN;
  return token ? { authorization: `Bearer ${token}` } : {};
}

/* What a page shows when Canon does not answer. */
export const CANON_UNREACHABLE = "Canon is not reachable. Start it with `npm run dev:canon`.";

export type CanonResult<T> =
  { kind: "ok"; data: T } | { kind: "not_found" } | { kind: "error"; message: string };

async function canonGet<T>(path: string): Promise<CanonResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${canonInternalUrl()}${path}`, {
      headers: canonAuthHeaders(),
      cache: "no-store",
    });
  } catch {
    return { kind: "error", message: CANON_UNREACHABLE };
  }
  if (res.status === 404) return { kind: "not_found" };
  if (!res.ok) return { kind: "error", message: `Canon answered ${res.status}.` };
  return { kind: "ok", data: (await res.json()) as T };
}

export const fetchLawStatus = (): Promise<CanonResult<LawStatus>> =>
  canonGet<LawStatus>("/app/law/status");

export const fetchLawSection = (
  section: string,
): Promise<CanonResult<LawSection | LawNotInstalled>> =>
  canonGet(`/app/law/sections/${encodeURIComponent(section)}`);

/* One level of the table of contents; with no node, the library's top level. */
export const fetchLawToc = (
  source: LawSource,
  node?: string,
): Promise<CanonResult<LawToc | LawNotInstalled>> =>
  canonGet(`/app/law/toc/${source}${node ? `/${encodeURIComponent(node)}` : ""}`);
