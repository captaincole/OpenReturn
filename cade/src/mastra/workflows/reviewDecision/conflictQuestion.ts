import type { Conflict } from "../../canon/schemas";
import { noteQuestion } from "../../db/taxFacts";
import type { ReviewCarrier } from "./schemas";

/*
 * When the review found two official texts that disagree, a person decides
 * which one to follow, case by case. Until then the verdict follows the IRS
 * instructions; this open question puts the choice in front of a person.
 */

type Scope = { userId: string; filingId: string };

const DISAGREE: Record<Conflict["kind"], string> = {
  instruction_vs_instruction: "two IRS instructions disagree",
  instruction_vs_statute: "the IRS instructions and the statute disagree",
  statute_vs_statute: "two parts of the statute disagree",
};

function whoDisagrees(conflicts: Conflict[]): string {
  const kinds = [...new Set(conflicts.map((conflict) => conflict.kind))];
  return kinds.length === 1 ? DISAGREE[kinds[0]] : "official texts disagree";
}

const sideText = (side: Conflict["a"]): string =>
  `${side.citation ? `${side.citation} (${side.blockId})` : side.blockId}: “${side.quote}”`;

function conflictLines(conflicts: Conflict[]): string {
  const lines = conflicts.map(
    (conflict, i) =>
      `${i + 1}. ${conflict.note}\n   ${sideText(conflict.a)}\n   ${sideText(conflict.b)}`,
  );
  return `The review followed the IRS instructions until a person decides.\n${lines.join("\n")}`;
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
