import { formatPublished } from "../../../refdocs/published";
import type { AskTurn } from "../../db/askThreads";
import type { Passage } from "./validate";

/*
 * Prompt rendering for the ask-turn judges. The thread's earlier turns
 * are the only conversation context (no agent memory): the last few
 * completed Q&A pairs, markers stripped and answers trimmed.
 */

const HISTORY_TURNS = 4;
const HISTORY_ANSWER_CHARS = 600;

export function renderHistory(earlier: AskTurn[]): string {
  const done = earlier.filter((t) => t.status === "completed" && t.answer).slice(-HISTORY_TURNS);
  if (done.length === 0) return "";
  const pairs = done.map((t) => {
    const answer = (t.answer ?? "").replace(/\s?\[\d+\]/g, "").slice(0, HISTORY_ANSWER_CHARS);
    return `Q: ${t.question}\nA: ${answer}`;
  });
  return `Earlier in this conversation:\n\n${pairs.join("\n\n")}\n\n`;
}

export function renderFormulatePrompt(history: string, question: string): string {
  return `${history}Question: ${question}\n\nWrite the search queries.`;
}

/*
 * An HTML document has no pages, so its passages carry the section only.
 * The publication date lets the answerer prefer the newer of two passages
 * that disagree.
 */
function renderPassage(p: Passage, n: number): string {
  const section =
    p.sectionHeading && p.sectionHeading !== "(Preamble)" ? `, § ${p.sectionHeading}` : "";
  const page = p.format === "html" ? "" : `, p. ${p.pageNum}`;
  const published = p.published ? ` (published ${formatPublished(p.published)})` : "";
  return `[${n}] ${p.documentTitle}${section}${page}${published}\n${p.text.trim()}`;
}

export function renderAnswerPrompt(history: string, question: string, passages: Passage[]): string {
  return [
    history,
    `Passages:\n\n${passages.map((p, i) => renderPassage(p, i + 1)).join("\n\n")}`,
    `\n\nQuestion: ${question}\n\nAnswer from the passages above.`,
  ].join("");
}
