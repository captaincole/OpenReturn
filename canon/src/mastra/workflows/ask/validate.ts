import type { CorpusFormat } from "../../../db/corpusStore";
import { validateConflicts } from "../ground/validateCitations";
import type { Conflict, ConflictOutput } from "../statute";
import type { AskAnswerOutput, AskConflictOutput } from "./judges/askAnswerer";
import type { AskCitation, AskCoverage } from "./types";

/*
 * Nothing the model says reaches the page untraced: a marker must name a
 * retrieved passage, a quote must appear word for word in it (else the
 * passage text replaces it), and an answer with no valid marker becomes the
 * not-covered message.
 */

type AnswerOutput = Omit<AskAnswerOutput, "gaps" | "statuteQueries" | "conflicts"> & {
  conflicts?: AskConflictOutput[];
};

export interface Passage {
  blockId: string;
  docId: string;
  documentTitle: string;
  format: CorpusFormat;
  published?: string | null;
  sectionHeading: string | null;
  pageNum: number;
  text: string;
  /** A statute passage only: "26 U.S.C. § 469(g)(1)". */
  citation?: string;
}

export interface ValidatedAnswer {
  answer: string;
  coverage: AskCoverage;
  citations: AskCitation[];
  missingDocuments: string[];
  conflicts: Conflict[];
  dropped: { markers: number[]; quotes: number[]; ungrounded: boolean; conflicts: number };
}

export const NOT_COVERED_ANSWER =
  "Our reference library does not have a passage that answers this question yet.";

const MARKER = /\s?\[(\d+)\]/g;

function splitMarkerLists(text: string): string {
  return text.replace(/\[(\d+(?:\s*,\s*\d+)+)\]/g, (_, list: string) =>
    list
      .split(",")
      .map((num) => `[${num.trim()}]`)
      .join(""),
  );
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function renumberMarkers(text: string, passageCount: number) {
  const order: number[] = [];
  const invalid: number[] = [];
  const answer = text.replace(MARKER, (match, raw: string) => {
    const passage = Number(raw);
    if (passage < 1 || passage > passageCount) {
      invalid.push(passage);
      return "";
    }
    if (!order.includes(passage)) order.push(passage);
    return `${match.startsWith(" ") ? " " : ""}[${order.indexOf(passage) + 1}]`;
  });
  return { answer: answer.trim(), order, invalid };
}

function quoteFor(output: AnswerOutput, passageNum: number, passage: Passage) {
  const quote =
    output.citations.find((citation) => citation.passage === passageNum)?.quote?.trim() ?? "";
  const ok = quote.length > 0 && normalize(passage.text).includes(normalize(quote));
  return { quote: ok ? quote : passage.text.trim(), ok };
}

/* A side names a passage by number; a number that was not given drops the conflict. */
function checkConflicts(raw: AskConflictOutput[], passages: Passage[]) {
  const blockOf = (passageNum: number) => passages[passageNum - 1]?.blockId ?? "";
  const named: ConflictOutput[] = raw.map((conflict) => ({
    kind: conflict.kind,
    a: { blockId: blockOf(conflict.a.passage), quote: conflict.a.quote },
    b: { blockId: blockOf(conflict.b.passage), quote: conflict.b.quote },
    note: conflict.note,
  }));
  return validateConflicts(named, passages);
}

export function validateAnswer(output: AnswerOutput, passages: Passage[]): ValidatedAnswer {
  const missingDocuments = output.missingDocuments.map((doc) => doc.trim()).filter(Boolean);
  const { answer, order, invalid } = renumberMarkers(
    splitMarkerLists(output.answer),
    passages.length,
  );

  if (output.coverage === "not_covered" || order.length === 0) {
    const ungrounded = output.coverage !== "not_covered";
    return {
      answer: ungrounded ? NOT_COVERED_ANSWER : answer.replace(MARKER, "") || NOT_COVERED_ANSWER,
      coverage: "not_covered",
      citations: [],
      missingDocuments,
      conflicts: [],
      dropped: { markers: invalid, quotes: [], ungrounded, conflicts: 0 },
    };
  }

  const badQuotes: number[] = [];
  const citations = order.map((passageNum, i): AskCitation => {
    const passage = passages[passageNum - 1];
    const { quote, ok } = quoteFor(output, passageNum, passage);
    if (!ok) badQuotes.push(passageNum);
    return {
      n: i + 1,
      blockId: passage.blockId,
      docId: passage.docId,
      documentTitle: passage.documentTitle,
      format: passage.format,
      sectionHeading: passage.sectionHeading,
      pageNum: passage.pageNum,
      quote,
      ...(passage.citation ? { citation: passage.citation } : {}),
    };
  });
  const checked = checkConflicts(output.conflicts ?? [], passages);

  return {
    answer,
    coverage: output.coverage,
    citations,
    missingDocuments,
    conflicts: checked.conflicts,
    dropped: { markers: invalid, quotes: badQuotes, ungrounded: false, conflicts: checked.dropped },
  };
}
