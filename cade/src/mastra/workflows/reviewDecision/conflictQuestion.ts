import {
  isLawBlock,
  jurisdictionOfBlock,
  textName,
  type Jurisdiction,
} from "../../canon/jurisdictions";
import type { Conflict } from "../../canon/schemas";
import { noteQuestion } from "../../db/taxFacts";
import type { ReviewCarrier } from "./schemas";

/*
 * When the review found two official texts that disagree, a person decides
 * which one to follow, case by case. Until then the verdict follows the
 * instructions; this open question puts the choice in front of a person.
 * Each text is named from its own block id: its prefix says whether it is the
 * law and which jurisdiction it belongs to (the IRS or the FTB instructions,
 * the federal statute or California's code).
 */

type Scope = { userId: string; filingId: string };

type Side = Conflict["a"];
type TextKind = "instructions" | "law";

const kindOf = (side: Side): TextKind =>
  side.citation || isLawBlock(side.blockId) ? "law" : "instructions";

const sideName = (side: Side): string => textName(jurisdictionOfBlock(side.blockId), kindOf(side));

/* "two FTB instructions", "two parts of California's code". */
function twoOf(side: Side): string {
  const name = sideName(side);
  return kindOf(side) === "law" ? `two parts of ${name}` : `two ${name.replace("the ", "")}`;
}

/* "the FTB instructions and California's code disagree": the instructions first. */
function disagreement(conflict: Conflict): string {
  const [first, second] =
    kindOf(conflict.a) === "law" ? [conflict.b, conflict.a] : [conflict.a, conflict.b];
  if (sideName(first) === sideName(second)) return `${twoOf(first)} disagree`;
  return `${sideName(first)} and ${sideName(second)} disagree`;
}

function whoDisagrees(conflicts: Conflict[]): string {
  const phrases = [...new Set(conflicts.map(disagreement))];
  return phrases.length === 1 ? phrases[0] : "official texts disagree";
}

/* The instructions the verdict follows: one jurisdiction's, or "the instructions" for a mix. */
function followedInstructions(conflicts: Conflict[]): string {
  const jurisdictions = new Set<Jurisdiction | undefined>(
    conflicts
      .flatMap((conflict) => [conflict.a, conflict.b])
      .map((side) => jurisdictionOfBlock(side.blockId)),
  );
  const [only] = jurisdictions;
  return textName(jurisdictions.size === 1 ? only : undefined, "instructions");
}

const sideText = (side: Conflict["a"]): string =>
  `${side.citation ? `${side.citation} (${side.blockId})` : side.blockId}: “${side.quote}”`;

function conflictLines(conflicts: Conflict[]): string {
  const lines = conflicts.map(
    (conflict, i) =>
      `${i + 1}. ${conflict.note}\n   ${sideText(conflict.a)}\n   ${sideText(conflict.b)}`,
  );
  return `The review followed ${followedInstructions(conflicts)} until a person decides.\n${lines.join("\n")}`;
}

/* One open question for all the conflicts of one review. */
export async function noteConflictQuestion(
  scope: Scope,
  carrier: ReviewCarrier,
  conflicts: Conflict[],
): Promise<string | undefined> {
  if (conflicts.length === 0) return undefined;
  const openQuestionId = crypto.randomUUID();
  await noteQuestion(scope, {
    id: openQuestionId,
    userId: carrier.userId,
    filingId: carrier.filingId,
    question: `Decide which text to follow for decision \`${carrier.decisionKey}\`: ${whoDisagrees(conflicts)}.`,
    context: conflictLines(conflicts),
    decisionId: carrier.decisionId,
  });
  return openQuestionId;
}
