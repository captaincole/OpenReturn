/*
 * The foreign tax sources: one entry for each payer that reports foreign tax or
 * foreign-source income. Form 1116 and the election to claim the credit without
 * it read only this list. Today it holds Form 1099-DIV box 7, Form 1099-INT
 * box 6 and the stated foreign taxes; a Schedule K-1 (K-3) route adds its own
 * entries to the same list.
 */

import {
  foreignIncomeStatementOf,
  getStatedForeignTaxFacts,
  makeForeignIncomeStatementKey,
  parseDividendFact,
  parseInterestFact,
  type ForeignIncomeCategory,
  type ForeignIncomeKind,
} from "../../facts/index.js";
import type { TaxFactRow } from "../../facts/rows.js";

export type { ForeignIncomeCategory, ForeignIncomeKind };

export interface ForeignTaxSource {
  /* The fact the entry comes from. */
  factKey: string;
  payer: string;
  /* Form 1116 line i; undefined when no document or answer names one. */
  country: string | undefined;
  category: ForeignIncomeCategory;
  incomeKind: ForeignIncomeKind;
  /* Foreign-source gross income in U.S. dollars; undefined while it is not stated. */
  grossIncome: number | undefined;
  /* The parts of grossIncome that are qualified dividends and capital gain distributions. */
  qualifiedDividends?: number;
  capitalGainDistributions?: number;
  /* Foreign tax paid, in U.S. dollars. */
  foreignTaxPaid: number;
  /*
   * Reported on a qualified payee statement (1099-DIV, 1099-INT, Schedule K-1
   * (Form 1041), Schedule K-3), the election's test
   * (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b01).
   */
  onPayeeStatement: boolean;
  /* The answer that states grossIncome, when it is missing (Cade asks for it). */
  grossIncomeKey?: string;
  /* A stated tax only: the income type, line 2, Part II (l) and (m)–(p), line 1b. */
  description?: string;
  definitelyRelatedExpenses?: number;
  datePaid?: string;
  foreignTaxInForeignCurrency?: number;
  alternativeBasisSourcing?: boolean;
}

type FactRow = { key: string; value: unknown; category: string };

const positive = (amount: number | undefined) => typeof amount === "number" && amount > 0;

/*
 * A RIC (a mutual fund) leaves 1099-DIV box 8 blank: "RICs ... Do not complete
 * box 8" (irs-1099div-inst-2025::sec::box-8-foreign-country-or-u-s-possession::b01).
 * Its income goes in one column with "RIC" on line i
 * (irs-1116-inst-2025::sec::specific-instructions::b02).
 */
export const RIC_COUNTRY = "RIC";

/*
 * 1099-DIV: box 7 is the tax (irs-1099div-inst-2025::sec::box-7-foreign-tax-paid::b01).
 * The 1099-DIV fact does not hold box 8 (Cade's ingest tool does not read it):
 * the foreign income statement states a payer's country, and a payer with none
 * stated is a RIC.
 */
function dividendSources(facts: ReadonlyArray<FactRow>): ForeignTaxSource[] {
  return parsedRows(facts, parseDividendFact).flatMap(({ sourceFact, dividends }) => {
    const factKey = sourceFact.key;
    const statement = foreignIncomeStatementOf(facts, factKey);
    if (!positive(dividends.box7) && statement === undefined) return [];
    return [
      {
        factKey,
        payer: dividends.payerName,
        country: statement?.country ?? RIC_COUNTRY,
        category: "passive",
        incomeKind: "dividends",
        grossIncome: statement?.grossIncome,
        qualifiedDividends: statement?.qualifiedDividends,
        capitalGainDistributions: statement?.capitalGainDistributions,
        foreignTaxPaid: dividends.box7 ?? 0,
        onPayeeStatement: true,
        grossIncomeKey: statement ? undefined : makeForeignIncomeStatementKey(factKey),
      },
    ];
  });
}

/*
 * 1099-INT: box 6 is the tax (irs-1099int-inst-2025::sec::box-6-foreign-tax-paid::b01),
 * box 7 the country (box-7-foreign-country-or-u-s-territory::b01).
 */
function interestSources(facts: ReadonlyArray<FactRow>): ForeignTaxSource[] {
  return parsedRows(facts, parseInterestFact).flatMap(({ sourceFact, interest }) => {
    const factKey = sourceFact.key;
    const statement = foreignIncomeStatementOf(facts, factKey);
    if (!positive(interest.box6) && statement === undefined) return [];
    return [
      {
        factKey,
        payer: interest.payerName,
        country: statement?.country ?? interest.box7,
        category: "passive",
        incomeKind: "interest",
        grossIncome: statement?.grossIncome,
        foreignTaxPaid: interest.box6 ?? 0,
        onPayeeStatement: true,
        grossIncomeKey: statement ? undefined : makeForeignIncomeStatementKey(factKey),
      },
    ];
  });
}

function statedSources(facts: ReadonlyArray<FactRow>): ForeignTaxSource[] {
  return getStatedForeignTaxFacts(facts).map(({ key, value }) => ({
    factKey: key,
    payer: value.payer,
    country: value.country,
    category: value.category,
    incomeKind: value.incomeKind,
    grossIncome: value.grossIncome,
    foreignTaxPaid: value.foreignTaxPaid,
    onPayeeStatement: false,
    description: value.description,
    definitelyRelatedExpenses: value.definitelyRelatedExpenses,
    datePaid: value.datePaid,
    foreignTaxInForeignCurrency: value.foreignTaxInForeignCurrency,
    alternativeBasisSourcing: value.alternativeBasisSourcing,
  }));
}

/* The resolver sees plain rows; the 1099 parsers read only their category, key and value. */
function parsedRows<T>(facts: ReadonlyArray<FactRow>, parse: (row: TaxFactRow) => T | null): T[] {
  return facts
    .map((row) => parse(row as TaxFactRow))
    .filter((parsed): parsed is T => parsed !== null);
}

/* Every source on the return, in fact order: 1099-DIV, then 1099-INT, then the stated taxes. */
export function foreignTaxSources(facts: ReadonlyArray<FactRow>): ForeignTaxSource[] {
  return [...dividendSources(facts), ...interestSources(facts), ...statedSources(facts)];
}
