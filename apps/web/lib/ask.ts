import { agentUrl } from "@/lib/agentBase";
import { UnauthorizedError } from "@/lib/api";

/*
 * Browser-side client for tax-code Q&A and the reference library. The
 * types mirror apps/agent/src/mastra/db/askThreads.ts and
 * db/refLibrary.ts; keep them in sync by hand until the apps share a
 * types package.
 */

export type AskTurnStatus = "running" | "completed" | "failed";
export type AskCoverage = "covered" | "partial" | "not_covered";
export type AskStage = "formulating" | "retrieving" | "answering";
/** A document's source: a PDF, or a cleaned HTML page the library renders. */
export type SourceFormat = "pdf" | "html";

export interface AskCitation {
  n: number;
  blockId: string;
  docId: string;
  documentTitle: string;
  /** Missing on citations saved before HTML documents existed: read it as "pdf". */
  format?: SourceFormat;
  sectionHeading: string | null;
  pageNum: number;
  quote: string;
}

export interface AskTurn {
  id: string;
  index: number;
  question: string;
  status: AskTurnStatus;
  stage: AskStage | null;
  answer: string | null;
  coverage: AskCoverage | null;
  citations: AskCitation[];
  missingDocuments: string[];
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface AskThread {
  id: string;
  title: string;
  createdAt: string;
  turns: AskTurn[];
}

export interface LibraryDocument {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  format: SourceFormat;
  totalPages: number;
  blockCount: number;
}

/** A heading in an HTML document; anchor is its id in the HTML. */
export interface LibrarySection {
  anchor: string;
  heading: string;
  parent: string | null;
}

export interface LibraryHtmlDocument {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  html: string;
  sections: LibrarySection[];
}

interface StartedTurn {
  threadId: string;
  turnId: string;
}

async function readJson<T>(res: Response, what: string): Promise<T> {
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `${what} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function postQuestion(path: string, question: string): Promise<StartedTurn> {
  return fetch(agentUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  }).then((res) => readJson<StartedTurn>(res, "Ask"));
}

/** Starts a new thread with its first question. */
export function askNewQuestion(question: string): Promise<StartedTurn> {
  return postQuestion("/app/ask", question);
}

/** Adds a follow-up question to an existing thread. */
export function askFollowUp(threadId: string, question: string): Promise<StartedTurn> {
  return postQuestion(`/app/ask/${threadId}/turns`, question);
}

export async function fetchAskThread(threadId: string): Promise<AskThread> {
  const res = await fetch(agentUrl(`/app/ask/${threadId}`), { cache: "no-store" });
  return readJson<AskThread>(res, "Load thread");
}

export async function fetchLibrary(): Promise<LibraryDocument[]> {
  const res = await fetch(agentUrl("/app/refdocs"));
  return (await readJson<{ documents: LibraryDocument[] }>(res, "Load library")).documents;
}

export async function fetchLibraryDocument(docId: string): Promise<LibraryHtmlDocument> {
  const res = await fetch(agentUrl(`/app/refdocs/${encodeURIComponent(docId)}/html`));
  return readJson<LibraryHtmlDocument>(res, "Load document");
}

/** The library's page for an HTML document, optionally at a section anchor. */
export function refDocPageUrl(docId: string, anchor?: string): string {
  const url = `/library/${encodeURIComponent(docId)}`;
  return anchor ? `${url}#${anchor}` : url;
}

/*
 * Where a citation opens: an HTML document's page at the cited section
 * (block ids are `<docId>::sec::<anchor>::bNN`), or the PDF on its page.
 */
export function citationUrl(c: AskCitation): string {
  if (c.format !== "html") return refDocPdfUrl(c.docId, c.pageNum);
  const anchor = c.blockId.split("::")[2];
  return refDocPageUrl(c.docId, anchor === "preamble" ? undefined : anchor);
}

/** Opens the source PDF on the cited page (the browser viewer honors #page). */
export function refDocPdfUrl(docId: string, pageNum?: number): string {
  const url = agentUrl(`/app/refdocs/${encodeURIComponent(docId)}/pdf`);
  return pageNum ? `${url}#page=${pageNum}` : url;
}
