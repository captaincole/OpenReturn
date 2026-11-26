import { formatPublished } from "../../../refdocs/published";
import type { AskHistoryTurn } from "./types";
import type { Passage } from "./validate";

const HISTORY_TURNS = 4;
const HISTORY_ANSWER_CHARS = 600;

export function renderHistory(earlier: AskHistoryTurn[]): string {
  const done = earlier.filter((turn) => turn.answer).slice(-HISTORY_TURNS);
  if (done.length === 0) return "";
  const pairs = done.map((turn) => {
    const answer = turn.answer.replace(/\s?\[\d+\]/g, "").slice(0, HISTORY_ANSWER_CHARS);
    return `Q: ${turn.question}\nA: ${answer}`;
  });
  return `Earlier in this conversation:\n\n${pairs.join("\n\n")}\n\n`;
}

export function renderFormulatePrompt(history: string, question: string): string {
  return `${history}Question: ${question}\n\nWrite the search queries.`;
}

// The date lets the answerer prefer the newer of two passages that disagree.
function renderPassage(passage: Passage, passageNum: number): string {
  const section =
    passage.sectionHeading && passage.sectionHeading !== "(Preamble)"
      ? `, § ${passage.sectionHeading}`
      : "";
  const page = passage.format === "html" ? "" : `, p. ${passage.pageNum}`;
  const published = passage.published ? ` (published ${formatPublished(passage.published)})` : "";
  return `[${passageNum}] ${passage.documentTitle}${section}${page}${published}\n${passage.text.trim()}`;
}

/* Statute passages come last, in their own block; their numbers follow the others. */
export function renderAnswerPrompt(history: string, question: string, passages: Passage[]): string {
  const numbered = passages.map((passage, i) => ({ passage, passageNum: i + 1 }));
  const statute = numbered.filter(({ passage }) => passage.citation);
  return [
    history,
    `Passages:\n\n${numbered
      .filter(({ passage }) => !passage.citation)
      .map(({ passage, passageNum }) => renderPassage(passage, passageNum))
      .join("\n\n")}`,
    statute.length
      ? `\n\nStatute passages (the Internal Revenue Code, the law the passages above explain):\n\n${statute
          .map(
            ({ passage, passageNum }) =>
              `[${passageNum}] ${passage.citation}\n${passage.text.trim()}`,
          )
          .join("\n\n")}`
      : "",
    `\n\nQuestion: ${question}\n\nAnswer from the passages above.`,
  ].join("");
}
