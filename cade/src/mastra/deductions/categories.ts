/*
 * The category each deduction amount is recorded under. A fact key starts with
 * its kind ("mortgage.interest_form_1098"), and every key of a kind has the
 * same category, so one table by kind covers every amount the engine asks for.
 */

import type { CATEGORIES } from "../tools/taxFacts";

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_BY_KIND = new Map<string, Category>([
  ["state_local_tax", "state_local_tax"],
  ["mortgage", "mortgage"],
  ["investment_interest", "investment_income"],
  ["charitable", "charitable"],
  ["medical", "medical"],
  // California's miscellaneous deductions (investment fees) have no category of their own.
  ["misc_deductions", "other"],
]);

/* Undefined for a kind the table does not know: the unit test keeps the catalog inside it. */
export const knownCategory = (key: string): Category | undefined =>
  CATEGORY_BY_KIND.get(key.split(".")[0]);

export const categoryOf = (key: string): Category => knownCategory(key) ?? "other";
