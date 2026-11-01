import { agentUrl } from "@/lib/agentBase";
import { UnauthorizedError } from "@/lib/api";
import { canonUrl } from "@/lib/canonBase";

/* Types mirror cade/src/mastra/db/askThreads.ts and db/refLibrary.ts. Keep in sync by hand. */

export type AskTurnStatus = "running" | "completed" | "failed";
export type AskCoverage = "covered" | "partial" | "not_covered";
export type AskStage = "formulating" | "retrieving" | "answering";
export type SourceFormat = "pdf" | "html";

export interface AskCitation {
  n: number;
  blockId: string;
  docId: string;
  documentTitle: string;
  /** Missing on older citations: read it as "pdf". */
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
  /** "YYYY-MM[-DD]" */
  published: string | null;
  totalPages: number;
  blockCount: number;
}

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
  published: string | null;
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

export function askNewQuestion(question: string): Promise<StartedTurn> {
  return postQuestion("/app/ask", question);
}

export function askFollowUp(threadId: string, question: string): Promise<StartedTurn> {
  return postQuestion(`/app/ask/${threadId}/turns`, question);
}

export async function fetchAskThread(threadId: string): Promise<AskThread> {
  const res = await fetch(agentUrl(`/app/ask/${threadId}`), { cache: "no-store" });
  return readJson<AskThread>(res, "Load thread");
}

export async function fetchLibrary(): Promise<LibraryDocument[]> {
  const res = await fetch(canonUrl("/app/refdocs"));
  return (await readJson<{ documents: LibraryDocument[] }>(res, "Load library")).documents;
}

export async function fetchLibraryDocument(docId: string): Promise<LibraryHtmlDocument> {
  const res = await fetch(canonUrl(`/app/refdocs/${encodeURIComponent(docId)}/html`));
  return readJson<LibraryHtmlDocument>(res, "Load document");
}

export function refDocPageUrl(docId: string, anchor?: string): string {
  const url = `/library/${encodeURIComponent(docId)}`;
  return anchor ? `${url}#${anchor}` : url;
}

/* Block ids are `<docId>::sec::<anchor>::bNN`. */
export function citationUrl(citation: AskCitation): string {
  if (citation.format !== "html") return refDocPdfUrl(citation.docId, citation.pageNum);
  const anchor = citation.blockId.split("::")[2];
  return refDocPageUrl(citation.docId, anchor === "preamble" ? undefined : anchor);
}

export function refDocPdfUrl(docId: string, pageNum?: number): string {
  const url = canonUrl(`/app/refdocs/${encodeURIComponent(docId)}/pdf`);
  return pageNum ? `${url}#page=${pageNum}` : url;
}
