/*
 * The Forms 4972 a return files: one per lump-sum fact whose Part I answers
 * allow the form and that makes an election (irs-4972-form-2025::sec::face-part-i::b01, b02).
 */

import {
  getLumpSumDistributionFacts,
  hasDistributionCode,
  ROTH_IRA_CODES,
  type LumpSumDistributionFact,
  type LumpSumDistributionFactValue,
  type RetirementDistributionFactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { Form4972Copy, Form4972Result } from "./filingInfo.js";
import { form4972Lines } from "./form.js";
import type { LumpSumAmounts, LumpSumChoices } from "./lines.js";

const PERCENT = 100;

const GAP_TAXABLE =
  "A Form 1099-R of the distribution has no box 2a: the taxable amount must be figured first (irs-4972-form-2025::sec::line-8::b01, Pub. 575), and the engine does not figure it.";
const GAP_OWNERS =
  "The distribution's Forms 1099-R name both spouses: each spouse files a separate Form 4972 (irs-4972-form-2025::sec::specific-instructions::b01).";
const GAP_SHARES =
  "The distribution's Forms 1099-R show different box 9a percentages; the multiple-recipient steps (specific-instructions::b02) take one percentage.";
const GAP_SHARED_ESTATE_TAX =
  "A shared distribution (box 9a under 100%) with federal estate tax: the instructions do not say whether line 18 is the recipient's part or the whole (specific-instructions::b02, line-18::b01).";
const GAP_BOX8_PERCENT =
  "A shared distribution with an annuity in box 8 and no box 8 percentage on record: line 11 divides box 8 by it (specific-instructions::b02).";
const GAP_NOT_BENEFICIARY =
  "A death benefit exclusion or federal estate tax is on record for a recipient who is not a beneficiary: lines 9 and 18 are for a beneficiary (line-9::b01, line-18::b01).";

/* The Forms 1099-R the fact names; undefined for a key with no fact. */
function rowsOf(inputs: ResolverInputs, answers: LumpSumDistributionFactValue) {
  return answers.distributionKeys.map(
    (key) => inputs.factByKey.get(key) as RetirementDistributionFactValue | undefined,
  );
}

/* Part I says the form can be used (lines 1 to 5b); undefined while an answer it needs is missing. */
export function partIAllows(answers: LumpSumDistributionFactValue): boolean | undefined {
  if (!answers.entireBalance || answers.rolledOverAnyPart || !answers.participantBornBefore1936)
    return false;
  if (answers.receivedAs === "participant") {
    if (answers.participantFiveYears === undefined) return undefined;
    return answers.participantFiveYears && !answers.priorElectionOwnPlan;
  }
  if (answers.receivedAs === "beneficiary") {
    if (answers.priorElectionAsBeneficiary === undefined) return undefined;
    return !answers.priorElectionAsBeneficiary;
  }
  return !answers.priorElectionOwnPlan;
}

/* "A distribution from an IRA" does not qualify (irs-4972-form-2025::sec::distributions-that-don-t-qualify-for::b01). */
const fromIra = (row: RetirementDistributionFactValue) =>
  row.box7IraSepSimple || hasDistributionCode(row, ROTH_IRA_CODES);

/* An election: Part II with an amount in box 3, or Part III. */
function elects(answers: LumpSumDistributionFactValue, rows: RetirementDistributionFactValue[]) {
  const capitalGain = sum(...rows.map((row) => row.box3));
  return answers.tenYearOption || (answers.capitalGainElection && capitalGain > 0);
}

/* One percentage of the rows (a box as printed, 40 for 40%), as a fraction; 1 when none is under 100. */
function shareOf(percents: Array<number | undefined>): number | "differs" {
  const shares = new Set(percents.map((percent) => percent ?? PERCENT));
  if (shares.size > 1) return "differs";
  const [percent] = [...shares];
  return percent > 0 && percent < PERCENT ? percent / PERCENT : 1;
}

function amountsOf(rows: RetirementDistributionFactValue[]): LumpSumAmounts | string {
  if (rows.some((row) => row.box2a === undefined)) return GAP_TAXABLE;
  const recipientShare = shareOf(rows.map((row) => row.box9a));
  if (recipientShare === "differs") return GAP_SHARES;
  const annuityValue = sum(...rows.map((row) => row.box8));
  const annuityPercents = rows.filter((row) => sum(row.box8) > 0).map((row) => row.box8Percent);
  if (recipientShare < 1 && annuityPercents.includes(undefined)) return GAP_BOX8_PERCENT;
  const annuityShare = shareOf(annuityPercents);
  if (annuityShare === "differs") return GAP_BOX8_PERCENT;
  return {
    taxableAmount: sum(...rows.map((row) => row.box2a)),
    capitalGain: sum(...rows.map((row) => row.box3)),
    netUnrealizedAppreciation: sum(...rows.map((row) => row.box6)),
    annuityValue,
    recipientShare,
    annuityShare,
  };
}

export function choicesOf(answers: LumpSumDistributionFactValue): LumpSumChoices {
  return {
    capitalGainElection: answers.capitalGainElection,
    tenYearOption: answers.tenYearOption,
    includeNua: answers.includeNua === true,
    deathBenefitExclusion: sum(answers.deathBenefitExclusion),
    federalEstateTax: sum(answers.federalEstateTax),
  };
}

function resultOf(
  answers: LumpSumDistributionFactValue,
  rows: RetirementDistributionFactValue[],
): Form4972Result {
  const amounts = amountsOf(rows);
  if (typeof amounts === "string") return { kind: "gap", reason: amounts };
  const choices = choicesOf(answers);
  const fromEstate = choices.deathBenefitExclusion > 0 || choices.federalEstateTax > 0;
  if (fromEstate && answers.receivedAs !== "beneficiary")
    return { kind: "gap", reason: GAP_NOT_BENEFICIARY };
  if (amounts.recipientShare < 1 && choices.federalEstateTax > 0)
    return { kind: "gap", reason: GAP_SHARED_ESTATE_TAX };
  return { kind: "figured", lines: form4972Lines(amounts, choices) };
}

/* The copy of one fact, or undefined when it files no form (Part I says no, no election, an IRA). */
function copyOf(inputs: ResolverInputs, fact: LumpSumDistributionFact): Form4972Copy | undefined {
  const answers = fact.value;
  const found = rowsOf(inputs, answers);
  const rows = found.filter((row): row is RetirementDistributionFactValue => row !== undefined);
  const allows = partIAllows(answers);
  if (allows === false || rows.some(fromIra)) return undefined;
  if (rows.length > 0 && !elects(answers, rows)) return undefined;
  const owners = new Set(rows.map((row) => row.owner ?? "taxpayer"));
  const recipient = owners.has("spouse") ? "spouse" : "taxpayer";
  const base = {
    factKey: fact.key,
    recipient,
    answers,
  } as const;
  if (allows === undefined || found.includes(undefined) || rows.length === 0)
    return { ...base, result: { kind: "waits" } };
  if (owners.size > 1) return { ...base, result: { kind: "gap", reason: GAP_OWNERS } };
  return { ...base, result: resultOf(answers, rows) };
}

/* Every Form 4972 the facts file, in the order recorded. */
export function form4972Copies(inputs: ResolverInputs): Form4972Copy[] {
  return getLumpSumDistributionFacts(inputs.facts).flatMap((fact) => copyOf(inputs, fact) ?? []);
}

/* The keys a waiting copy needs: its fact (a Part I answer) or a 1099-R it names. */
export function missingKeysOf(inputs: ResolverInputs, copy: Form4972Copy): string[] {
  if (copy.result.kind !== "waits") return [];
  const missingRows = copy.answers.distributionKeys.filter((key) => !inputs.factByKey.has(key));
  return missingRows.length > 0 ? missingRows : [copy.factKey];
}
