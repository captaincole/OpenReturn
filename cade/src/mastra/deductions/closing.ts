/*
 * What closing the deductions conversation records and says. Every number is
 * the engine's: the comparison (Schedule A line 17, Schedule CA line 29) and
 * the item states. Pure: the close-deductions tool does the writes.
 */

import {
  DEDUCTION_ITEMS,
  type EvaluatedScenario,
  type ItemId,
  type ItemState,
  type JurisdictionComparison,
} from "@openreturn/engine";

export const ITEMIZE_KEY = "decisions.itemize_vs_standard";
export const SCHEDULE_A_KEY = "decisions.scope.must_file_schedule_a";

export interface PlannedDecision {
  decisionKey: string;
  decision: string | boolean;
  rationale: string;
  supportingFactKeys: string[];
  confidence: "medium" | "high";
  dissentingConsiderations?: string;
}

/** An amount on an itemized return that the CPA checks against the taxpayer's records. */
export interface DeductionRecord {
  item: ItemId;
  title: string;
  amount: number;
  /** Where each amount came from: the document, or the taxpayer's words. */
  sourceNotes: string[];
}

export interface ClosingPlan {
  /** The one paragraph that goes back to the return's conversation. */
  summary: string;
  records: DeductionRecord[];
  /** The decisions to record. Empty when the recorded ones already say this. */
  decisions: PlannedDecision[];
}

const wholeDollars = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const dollars = (amount: number): string => `$${wholeDollars.format(amount)}`;

const itemizes = (side: JurisdictionComparison | undefined): boolean =>
  side?.recommendation === "itemize";

const amountKeysOf = (id: ItemId): string[] =>
  DEDUCTION_ITEMS.find((item) => item.id === id)!.amountKeys;

/* The sentence that states the result, by which return itemizes. */
function resultSentence(
  federal: JurisdictionComparison,
  ca: JurisdictionComparison | undefined,
): string {
  const fed = { itemized: dollars(federal.itemized), standard: dollars(federal.standard) };
  if (!ca) {
    return itemizes(federal)
      ? `You itemize on the federal return: ${fed.itemized} against the ${fed.standard} standard deduction.`
      : `You take the standard deduction on the federal return: ${fed.standard} against ${fed.itemized} itemized.`;
  }
  const cal = { itemized: dollars(ca.itemized), standard: dollars(ca.standard) };
  if (itemizes(federal) && itemizes(ca)) {
    return `You itemize on both returns: federal ${fed.itemized} against the ${fed.standard} standard deduction, California ${cal.itemized} against ${cal.standard}.`;
  }
  if (itemizes(federal)) {
    return `You itemize on the federal return (${fed.itemized} against the ${fed.standard} standard deduction) and take the standard deduction on the California return (${cal.standard} against ${cal.itemized} itemized).`;
  }
  if (itemizes(ca)) {
    return `You take the standard deduction on the federal return (${fed.standard} against ${fed.itemized} itemized) and itemize on the California return (${cal.itemized} against the ${cal.standard} standard deduction). Schedule A is still filled in: the California return starts from it.`;
  }
  return `You take the standard deduction on both returns: federal ${fed.standard} against ${fed.itemized} itemized, California ${cal.standard} against ${cal.itemized} itemized.`;
}

function recordsSentence(count: number): string {
  if (count === 0) return "";
  const records = count === 1 ? "1 record is" : `${count} records are`;
  return `${records} on the list for the CPA; nothing is attached to the return.`;
}

/* What the taxpayer must still know: the CPA's lines, and rough amounts that stay in use. */
function caveats(items: readonly ItemState[]): string[] {
  const forCpa = items
    .filter((item) => item.status === "for_cpa")
    .map((item) =>
      item.amount === undefined
        ? `The CPA figures this line: ${item.title}.`
        : `The CPA figures this line: ${item.title}. The comparison uses ${dollars(item.amount)}, the most it can be.`,
    );
  const assumed = items.filter((item) => item.status === "assumed").length;
  if (assumed === 0) return forCpa;
  const rough = assumed === 1 ? "1 rough amount is" : `${assumed} rough amounts are`;
  return [
    ...forCpa,
    `${rough} still in use. They do not change this result, but each needs its exact amount before the return is ready to file.`,
  ];
}

function recordsOf(scenario: EvaluatedScenario): DeductionRecord[] {
  return scenario.deductions.items
    .filter((item) => item.status === "exact" || item.status === "for_cpa")
    .filter((item) => (item.amount ?? 0) > 0 && amountKeysOf(item.id).length > 0)
    .map((item) => ({
      item: item.id,
      title: item.title,
      amount: item.amount!,
      sourceNotes: sourceNotesOf(scenario, amountKeysOf(item.id)),
    }));
}

/* Each note once: two amounts from one document (a Form 1098) carry the same note. */
function sourceNotesOf(scenario: EvaluatedScenario, factKeys: string[]): string[] {
  const notes = scenario.facts
    .filter((fact) => factKeys.includes(fact.key))
    .flatMap((fact) => (fact.sourceNote ? [fact.sourceNote] : []));
  return [...new Set(notes)];
}

function recorded(scenario: EvaluatedScenario, decisionKey: string): unknown {
  return scenario.decisions.find((decision) => decision.decisionKey === decisionKey)?.decision;
}

/* Schedule A files when either return itemizes: the California return starts from it. */
function scheduleADecision(
  scenario: EvaluatedScenario,
  itemizeValue: "itemized" | "standard",
  required: boolean,
): { decision: boolean; rationale: string } | undefined {
  const explicit = recorded(scenario, SCHEDULE_A_KEY);
  // With no recorded scope decision, the engine files Schedule A for an itemized federal return.
  const effective = typeof explicit === "boolean" ? explicit : itemizeValue === "itemized";
  if (effective === required) return undefined;
  if (!required) {
    return { decision: false, rationale: "Neither return itemizes, so Schedule A does not file." };
  }
  return {
    decision: true,
    rationale:
      itemizeValue === "itemized"
        ? "The federal return itemizes, so Schedule A files."
        : "The California return itemizes and starts from federal Schedule A, so Schedule A is filled in although the federal return takes the standard deduction.",
  };
}

/* A CPA line that can still flip the result lowers the confidence; rough amounts never get here. */
function confidenceOf(scenario: EvaluatedScenario) {
  const { comparison, items } = scenario.deductions;
  const deciding = new Set([
    ...(comparison?.federal?.decidingItems ?? []),
    ...(comparison?.ca?.decidingItems ?? []),
  ]);
  const titles = items.filter((item) => deciding.has(item.id)).map((item) => item.title);
  if (titles.length === 0) return { confidence: "high" as const };
  return {
    confidence: "medium" as const,
    dissentingConsiderations: `The result can change when the CPA settles: ${titles.join("; ")}.`,
  };
}

/* Undefined until the engine can compare the federal return. */
export function planClosing(scenario: EvaluatedScenario): ClosingPlan | undefined {
  const { comparison, items } = scenario.deductions;
  const federal = comparison?.federal;
  if (!federal) return undefined;
  const either = itemizes(federal) || itemizes(comparison?.ca);
  const records = either ? recordsOf(scenario) : [];
  const summary = [
    "Deductions are done.",
    resultSentence(federal, comparison?.ca),
    recordsSentence(records.length),
    ...caveats(items),
  ]
    .filter((sentence) => sentence !== "")
    .join(" ");

  const itemizeValue = itemizes(federal) ? "itemized" : "standard";
  const stated = new Set(scenario.facts.map((fact) => fact.key));
  const shared = {
    supportingFactKeys: items.flatMap((item) =>
      amountKeysOf(item.id).filter((key) => stated.has(key)),
    ),
    ...confidenceOf(scenario),
  };
  const scheduleA = scheduleADecision(scenario, itemizeValue, either);
  const decisions: PlannedDecision[] = [
    ...(recorded(scenario, ITEMIZE_KEY) === itemizeValue
      ? []
      : [{ decisionKey: ITEMIZE_KEY, decision: itemizeValue, rationale: summary, ...shared }]),
    ...(scheduleA ? [{ decisionKey: SCHEDULE_A_KEY, ...scheduleA, ...shared }] : []),
  ];
  return { summary, records, decisions };
}
