import type { AskCitation, ConflictSide } from "./ask";
import { isLawBlockId, lawHref } from "./law";

/*
 * Citations of the statute (law.db) next to the IRS and FTB ones. Relative
 * imports only, so the unit tests can load this file.
 */

/** The statute page of a law block; null for an IRS or FTB block. */
export function statuteHref(blockId: string): string | null {
  return isLawBlockId(blockId) ? lawHref(blockId) : null;
}

/** The answer's citation of the same block, when it cites it. */
export const citedPassage = (side: ConflictSide, citations: AskCitation[]) =>
  citations.find((citation) => citation.blockId === side.blockId);

/** "26 U.S.C. § 461(l)(3)(B)" for the statute, else the cited document's title, else the block id. */
export function sideLabel(side: ConflictSide, citations: AskCitation[]): string {
  return side.citation ?? citedPassage(side, citations)?.documentTitle ?? side.blockId;
}
