import type { SourceFormat } from "../../../db/corpusStore";
import type { AskAnswerOutput } from "./judges/askAnswerer";
import type { AskCitation, AskCoverage } from "./types";

/*
 * Nothing the model says reaches the page untraced: a marker must name a
 * retrieved passage, a quote must appear word for word in it (else the
 * passage text replaces it), and an answer with no valid marker becomes the
 * not-covered message.
 */

type AnswerOutput = Omit<AskAnswerOutput, "gaps">;

export interface Passage {
  blockId: string;
  docId: string;
  documentTitle: string;
  format: SourceFormat;
  published?: string | null;
  sectionHeading: string | null;
  pageNum: number;
  text: string;
}

export interface ValidatedAnswer {
  answer: string;
  coverage: AskCoverage;
  citations: AskCitation[];
  missingDocuments: string[];
  dropped: { markers: number[]; quotes: number[]; ungrounded: boolean };
}

export const NOT_COVERED_ANSWER =
  "Our reference library does not have a passage that answers this question yet.";

const MARKER = /\s?\[(\d+)\]/g;

function splitMarkerLists(text: string): string {
  return text.replace(/\[(\d+(?:\s*,\s*\d+)+)\]/g, (_, list: string) =>
    list
      .split(",")
      .map((n) => `[${n.trim()}]`)
      .join(""),
  );
}

function normalize(s: string): string {
  return s
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
    const p = Number(raw);
    if (p < 1 || p > passageCount) {
      invalid.push(p);
      return "";
    }
    if (!order.includes(p)) order.push(p);
    return `${match.startsWith(" ") ? " " : ""}[${order.indexOf(p) + 1}]`;
  });
  return { answer: answer.trim(), order, invalid };
}

function quoteFor(output: AnswerOutput, passageNum: number, passage: Passage) {
  const quote = output.citations.find((c) => c.passage === passageNum)?.quote?.trim() ?? "";
  const ok = quote.length > 0 && normalize(passage.text).includes(normalize(quote));
  return { quote: ok ? quote : passage.text.trim(), ok };
}

export function validateAnswer(output: AnswerOutput, passages: Passage[]): ValidatedAnswer {
  const missingDocuments = output.missingDocuments.map((d) => d.trim()).filter(Boolean);
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
      dropped: { markers: invalid, quotes: [], ungrounded },
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
    };
  });

  return {
    answer,
    coverage: output.coverage,
    citations,
    missingDocuments,
    dropped: { markers: invalid, quotes: badQuotes, ungrounded: false },
  };
}
