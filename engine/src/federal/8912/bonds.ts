/*
 * Parts III and IV from the facts: one Part III row for each Form 1097-BTC,
 * one Part IV for each bond or pass-through credit no Form 1097-BTC reported,
 * and the pass-through CREB interests the line 12 formula limits.
 */

import {
  getBondTaxCreditStatementFacts,
  getTaxCreditBondFacts,
  type BondTaxCreditStatementFact,
  type BondTaxCreditStatementValue,
  type TaxCreditBondFact,
  type TaxCreditBondFactValue,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { PartIIIRow, PartIVForm, PartIVLines, PartIVRow } from "./filingInfo.js";
import {
  BUILD_AMERICA_BOND_CREDIT_RATE,
  CALENDAR_2025,
  FIRST_QUALIFIED_QZAB_DATE,
  FULL_YEAR_PERCENT,
  LAST_ISSUE_DATE,
  allowanceShares,
  line18Row,
  line19,
  line20,
  rowPercent,
  type Holding,
  type PassThroughCreb,
} from "./lines.js";

/* Box 3 code 101: a clean renewable energy bond (the Form 1097-BTC instructions). */
export const CREB_BOND_TYPE_CODE = "101";

/*
 * A QZAB issued before October 4, 2008: "the taxpayer must be a bank,
 * insurance company, or other corporation actively engaged in the business of
 * lending money", or an S corporation shareholder through the S corporation
 * (irs-8912-inst-2025::sec::who-can-claim-the-credits::b01). An individual
 * holding one directly claims nothing.
 */
function isEarlyQzab(bond: TaxCreditBondFactValue): boolean {
  if (bond.bondType === "qzab_before_october_4_2008") return true;
  return (
    bond.bondType === "qzab" &&
    bond.issueDate !== undefined &&
    bond.issueDate < FIRST_QUALIFIED_QZAB_DATE
  );
}

/* A Part IV the form takes: never a bond issued after 2017 ("Don't enter any bond credits for bonds issued after 2017"). */
export function claimsCredit(bond: TaxCreditBondFactValue): boolean {
  if (bond.issueDate !== undefined && bond.issueDate > LAST_ISSUE_DATE) return false;
  return bond.source === "pass_through" || !isEarlyQzab(bond);
}

export const claimingBonds = (inputs: ResolverInputs): TaxCreditBondFact[] =>
  getTaxCreditBondFacts(inputs.facts).filter((fact) => claimsCredit(fact.value));

/* Part III takes each Form 1097-BTC with a credit in box 1. */
export const statementsWithCredit = (inputs: ResolverInputs): BondTaxCreditStatementFact[] =>
  getBondTaxCreditStatementFacts(inputs.facts).filter((fact) => fact.value.box1Total !== 0);

/* Line 13 columns (a), (b1), (b2) and (c) (irs-8912-inst-2025::sec::part-iii-bond-credit-s-reported-to-you-on::b01). */
export function partIIIRows(statements: readonly BondTaxCreditStatementFact[]): PartIIIRow[] {
  return statements.map(({ value }) => ({
    filerName: value.filerName,
    filerTin: value.filerTin,
    uniqueIdentifier: value.box2bUniqueIdentifier,
    amount: value.box1Total,
  }));
}

/* When the holder held the bond: a sale ends the holding; a maturity or a redemption ends the bond. */
function holdingOf(bond: TaxCreditBondFactValue): Holding {
  const redeemed = bond.disposal === "redeemed" ? bond.disposedDate : undefined;
  const ends = [bond.maturityDate, redeemed].filter((date): date is string => date !== undefined);
  return {
    issued: bond.issueDate,
    acquired: bond.acquiredDate,
    sold: bond.disposal === "sold" ? bond.disposedDate : undefined,
    ended:
      ends.length === 0 ? undefined : ends.reduce((first, date) => (date < first ? date : first)),
  };
}

/* A held bond waits while a date or a row's credit rate is missing. */
export function heldBondWaits(bond: TaxCreditBondFactValue): boolean {
  if (bond.issueDate === undefined || bond.maturityDate === undefined) return true;
  if (bond.disposedDate !== undefined && bond.disposal === undefined) return true;
  const rows = bond.rows ?? [];
  if (rows.length === 0) return true;
  return bond.bondType !== "bab" && rows.some((row) => row.creditRate === undefined);
}

/* Lines 18 to 20 of a held bond (irs-8912-inst-2025::sec::line-18-column-a::b01–b04). */
function heldBondLines(bond: TaxCreditBondFactValue): PartIVLines | undefined {
  if (heldBondWaits(bond)) return undefined;
  const flat = bond.bondType === "bab" ? FULL_YEAR_PERCENT : undefined;
  const shares = allowanceShares(CALENDAR_2025, holdingOf(bond));
  const rows: PartIVRow[] = (bond.rows ?? []).map((row) => {
    const columns = line18Row({
      outstandingAmount: row.outstandingAmount,
      creditRate: bond.bondType === "bab" ? BUILD_AMERICA_BOND_CREDIT_RATE : (row.creditRate ?? 0),
      percent: flat ?? rowPercent(shares, row.creditAllowanceDates),
    });
    return { identifier: row.identifier, columns, f: columns.f };
  });
  const total = line19(rows.map((row) => row.f));
  const newBond = bond.bondType === "ncreb" || bond.bondType === "qecb";
  return { rows, line19: total, line20: line20(total, newBond) };
}

/*
 * A pass-through credit: "complete lines 15a and 15b and enter the credit
 * amount on line 18, column (f)" (irs-8912-inst-2025::sec::part-iv-bond-credits-from-bonds-held-by-you::b01).
 *
 * DECISION (2026-11-26, by the author): line 20 takes line 19 as it is for a
 * credit an entity passed through, also for a new CREB or a QECB.
 * - Line 20: "For a new clean renewable energy bond or a qualified energy
 *   conservation bond, multiply the amount on line 19 by 70% (0.70)"
 *   (irs-8912-face-2025::sec::face-part-iv::b02).
 * - Column (f): "If the bond credit is from a pass-through entity, enter the
 *   amount of the credit in column (f)" (irs-8912-inst-2025::sec::line-18-column-a::b04);
 *   and line 4 of the entity's own Form 8912, after its line 20, is what
 *   "partnerships and S corporations, report ... on Schedule K"
 *   (irs-8912-face-2025::sec::face-part-i::b01).
 * The entity's amount is already the credit, so a second 70% would cut it twice.
 */
function passThroughLines(bond: TaxCreditBondFactValue): PartIVLines | undefined {
  if (bond.passThroughCredit === undefined) return undefined;
  const columnF = roundDollars(bond.passThroughCredit);
  return { rows: [{ f: columnF }], line19: columnF, line20: line20(columnF, false) };
}

export function partIVForm(fact: TaxCreditBondFact): PartIVForm {
  const bond = fact.value;
  const held = bond.source === "held";
  return {
    factKey: fact.key,
    issuer: bond.issuerNameCityState,
    issuerEin: bond.issuerEin,
    issueDate: held ? bond.issueDate : undefined,
    maturityDate: held ? bond.maturityDate : undefined,
    disposedDate: held ? bond.disposedDate : undefined,
    lines: held ? heldBondLines(bond) : passThroughLines(bond),
  };
}

/*
 * Whether a Form 1097-BTC came from a pass-through entity. A statement whose
 * "Form 1097-BTC issuer is" box reads "Issuer of bond or its agent filing
 * current year Form 1097-BTC for credit being reported" is from the bond's
 * issuer, so the answer is no; only "An entity or a person that received ...
 * and is distributing part or all of that credit to others" needs it (Form
 * 1097-BTC, Rev. April 2025).
 */
export function fromPassThrough(value: BondTaxCreditStatementValue): boolean | undefined {
  return value.filerIsBondIssuer === true ? false : value.fromPassThroughEntity;
}

/* One pass-through CREB credit before grouping by entity; undefined parts wait. */
interface CrebEntry {
  entity: string;
  credit: number | undefined;
  attributableTaxableIncome: number | undefined;
}

function crebEntries(
  statements: readonly BondTaxCreditStatementFact[],
  bonds: readonly TaxCreditBondFact[],
  partIV: readonly PartIVForm[],
): CrebEntry[] | undefined {
  const crebStatements = statements.filter(
    ({ value }) => value.box3BondType === CREB_BOND_TYPE_CODE,
  );
  if (crebStatements.some(({ value }) => fromPassThrough(value) === undefined)) return undefined;
  const fromStatements = crebStatements
    .filter(({ value }) => fromPassThrough(value) === true)
    .map(({ value }) => ({
      entity: value.filerTin ?? value.filerName,
      credit: roundDollars(value.box1Total),
      attributableTaxableIncome: value.attributableTaxableIncome,
    }));
  const fromBonds = bonds
    .map((fact, index) => ({ bond: fact.value, lines: partIV[index]?.lines }))
    .filter(({ bond }) => bond.source === "pass_through" && bond.bondType === "creb")
    .map(({ bond, lines }) => ({
      entity: bond.issuerEin,
      credit: lines?.line20,
      attributableTaxableIncome: bond.attributableTaxableIncome,
    }));
  return [...fromStatements, ...fromBonds];
}

/*
 * The interests of the line 12 formula: "Figure the credit limitation
 * separately for each interest in a pass-through entity"
 * (irs-8912-inst-2025::sec::line-12::b02). Entries with the same entity
 * (its identifying number) are one interest. Undefined while one waits.
 */
export function passThroughCrebs(
  statements: readonly BondTaxCreditStatementFact[],
  bonds: readonly TaxCreditBondFact[],
  partIV: readonly PartIVForm[],
): PassThroughCreb[] | undefined {
  const entries = crebEntries(statements, bonds, partIV);
  if (entries === undefined) return undefined;
  if (
    entries.some(
      (entry) => entry.credit === undefined || entry.attributableTaxableIncome === undefined,
    )
  ) {
    return undefined;
  }
  const byEntity = new Map<string, PassThroughCreb>();
  for (const entry of entries) {
    const known = byEntity.get(entry.entity);
    byEntity.set(entry.entity, {
      credit: (known?.credit ?? 0) + (entry.credit ?? 0),
      attributableTaxableIncome:
        known?.attributableTaxableIncome ?? entry.attributableTaxableIncome ?? 0,
    });
  }
  return [...byEntity.values()];
}
