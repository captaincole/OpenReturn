/*
 * Form 8820: the orphan drug credit of the clinical testing the taxpayer pays
 * for in a sole proprietorship (Schedule C). One fact per return: "all members
 * of a group of businesses under common control ... are treated as a single
 * taxpayer" (irs-8820-form-2025::sec::member-of-controlled-group::b01), and
 * Form 8820 has one line 1. The taxpayer states every amount from the
 * business's books; no information return holds them.
 *
 * A credit passed through on a Schedule K-1 is not this fact: the K-1 holds
 * it (box 15 or box 13, code Z), and Form 8820 line 3 shows it. A taxpayer
 * whose only orphan drug credit is from a K-1 files no Form 8820
 * (irs-8820-form-2025::sec::purpose-of-form::b01).
 *
 * Without the reduced credit election (line 2a), the deduction for the
 * expenses goes down by the credit (irs-8820-form-2025::sec::line-2a::b02):
 * activitiesOnReturn.ts takes it off the business's Schedule C lines.
 */

import { isIsoDate } from "./depreciation.js";

type FactRow = { key: string; value: unknown; category: string };

/*
 * Line 1 by kind of expense: the amounts "that would be described as
 * qualified research expenses under section 41", with "clinical testing" for
 * "qualified research" and "100% (instead of 65% or 75%) of contract research
 * expenses" (irs-8820-form-2025::sec::purpose-of-form::b01). Each amount is
 * already less the part "funded by a grant, contract, or otherwise by a
 * governmental entity or another person".
 */
export interface ClinicalTestingExpenses {
  /* Wages for qualified services in the clinical testing (Schedule C line 26). */
  wages?: number;
  /* Supplies used in the clinical testing (Schedule C line 22). */
  supplies?: number;
  /* Rental or lease of computers used in the clinical testing (Schedule C line 20a). */
  computerRental?: number;
  /* Clinical testing performed for the taxpayer by another person, in full (Schedule C line 11). */
  contractTesting?: number;
}

/* One row of Part II (irs-8820-form-2025::sec::part-ii::b01). */
export interface OrphanDrug {
  /* Column (b): the generic name of the orphan drug. */
  name: string;
  /* Column (c): the designation application number. */
  designationApplicationNumber: string;
  /* Column (d): the date the drug was designated under section 526 of the Act, YYYY-MM-DD. */
  dateDesignated: string;
}

export interface OrphanDrugCreditFactValue {
  /* The Schedule C business (`business.<id>`) that pays for the clinical testing and deducts its expenses. */
  businessKey: string;
  /* Line 2a: the reduced credit under section 280C, made on the original return filed on time. */
  reducedCreditElection: boolean;
  expenses: ClinicalTestingExpenses;
  /* Part II: each drug whose expenses are in line 1. */
  drugs: OrphanDrug[];
  /*
   * Line 2b: the part of the Form 8932 line 2 credit attributable to wages
   * also used for line 2a (irs-8820-form-2025::sec::line-2b::b01). Asked when
   * the return claims a Form 8932 credit of its own and line 1 holds wages.
   */
  differentialWageCreditOnSameWages?: number;
}

export interface OrphanDrugCreditFact {
  key: string;
  value: OrphanDrugCreditFactValue;
}

const ORPHAN_DRUG_CATEGORY = "self_employment";
export const ORPHAN_DRUG_CREDIT_KEY = "orphan_drug_credit";

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isText = (value: unknown): boolean => typeof value === "string" && value.trim() !== "";

function isDrug(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isText(value.name) &&
    isText(value.designationApplicationNumber) &&
    isIsoDate(value.dateDesignated)
  );
}

function isExpenses(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["wages", "supplies", "computerRental", "contractTesting"].every((kind) =>
    isAmount(value[kind]),
  );
}

function isOrphanDrugCredit(value: unknown): value is OrphanDrugCreditFactValue {
  if (!isRecord(value)) return false;
  return (
    typeof value.businessKey === "string" &&
    typeof value.reducedCreditElection === "boolean" &&
    isExpenses(value.expenses) &&
    Array.isArray(value.drugs) &&
    value.drugs.every(isDrug) &&
    isAmount(value.differentialWageCreditOnSameWages)
  );
}

/* The return's orphan drug credit fact; malformed when its shape is wrong (Cade records it again). */
export function readOrphanDrugCreditFact(facts: ReadonlyArray<FactRow>): {
  fact?: OrphanDrugCreditFact;
  malformed: boolean;
} {
  const row = facts.find(
    (each) => each.category === ORPHAN_DRUG_CATEGORY && each.key === ORPHAN_DRUG_CREDIT_KEY,
  );
  if (row === undefined) return { malformed: false };
  if (!isOrphanDrugCredit(row.value)) return { malformed: true };
  return { fact: { key: row.key, value: row.value }, malformed: false };
}
