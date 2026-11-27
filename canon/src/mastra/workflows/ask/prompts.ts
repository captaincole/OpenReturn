import { searchedLine, type Jurisdiction } from "../../../jurisdiction";
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

/* What the judges know of a turn before the passages: earlier turns, and the jurisdictions searched. */
export interface PromptContext {
  history: string;
  jurisdictions: readonly Jurisdiction[];
}

// One line, and only when not every jurisdiction is on: the prompts stay the same for a search of all.
function searched(context: PromptContext): string {
  const line = searchedLine(context.jurisdictions);
  return line ? `${line}\n\n` : "";
}

export function renderFormulatePrompt(context: PromptContext, question: string): string {
  return `${context.history}${searched(context)}Question: ${question}\n\nWrite the search queries.`;
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
export function renderAnswerPrompt(
  context: PromptContext,
  question: string,
  passages: Passage[],
): string {
  const numbered = passages.map((passage, i) => ({ passage, passageNum: i + 1 }));
  const statute = numbered.filter(({ passage }) => passage.citation);
  return [
    context.history,
    searched(context),
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
