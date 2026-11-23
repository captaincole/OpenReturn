/*
 * min — LOCKED expected values, drafted from the engine's
 * output on 2026-11-23 (scripts/draftExpected.ts).
 *
 * UNVERIFIED: no CPA return or filed-return check stands behind these
 * values. They are engine output, checked by hand, so a failure means
 * "the engine changed", not "the engine is wrong".
 *
 * Edit by hand. Change a value only after you verify it against the form
 * instructions or a filed return (scripts/compareFiled).
 */

import type { ExpectedResults } from "../../../types.js";

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "schedule-e": {
    engineFields: {
      // Line 28 row A — (k) Nonpassive income from Schedule K-1
      "schedule-e.1.line.28_row_a_col_k_nonpassive_income": 3200,
      // Line 29a — Totals, column (k) nonpassive income
      "schedule-e.1.line.29a_totals_col_k": 3200,
      // Line 30 — Add columns (h) and (k) of line 29a
      "schedule-e.1.line.30_add_income_columns": 3200,
      // Line 32 — Total partnership and S corporation income or (loss). Combine lines 30 and 31
      "schedule-e.1.line.32_total_partnership_s_corp_income": 3200,
      // Line 41 — Total income or (loss). Combine lines 26, 32, 37, 39, and 40
      "schedule-e.1.line.41_total_income_or_loss": 3200,
    },
  },
  "form-8995": {
    engineFields: {
      // Line 1i — (c) Qualified business income or (loss)
      "form-8995.0.line.1i_c": 3200,
      // Line 2 — Total qualified business income or (loss). Combine lines 1i through 1v, column (c
      "form-8995.0.line.2": 3200,
      // Line 4 — Total qualified business income. Combine lines 2 and 3. If zero or less, enter -0
      "form-8995.0.line.4": 3200,
      // Line 5 — Qualified business income component. Multiply line 4 by 20% (0.20)
      "form-8995.0.line.5": 640,
      // Line 10 — Qualified business income deduction before the income limitation. Add lines 5 an
      "form-8995.0.line.10": 640,
      // Line 11 — Taxable income before qualified business income deduction
      "form-8995.0.line.11": 121490,
      // Line 13 — Subtract line 12 from line 11. If zero or less, enter -0-
      "form-8995.0.line.13": 121490,
      // Line 14 — Income limitation. Multiply line 13 by 20% (0.20)
      "form-8995.0.line.14": 24298,
      // Line 15 — Qualified business income deduction. Enter the smaller of line 10 or line 14
      "form-8995.0.line.15": 640,
    },
  },
  "schedule-1": {
    engineFields: {
      // Line 5 — Rental real estate, royalties, partnerships, S corporations, trusts, etc. Attach
      "schedule-1.0.line.5": 3200,
      // Line 8h — Jury duty pay
      "schedule-1.0.line.8h": 640,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 640,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 3840,
      // Line 21 — Student loan interest deduction
      "schedule-1.1.line.21": 1850,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 1850,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 8 — Additional tax on IRAs or other tax-favored accounts. Attach Form 5329 if require
      "schedule-2.0.line.8_additional_tax_iras_tax_favored_accounts": 300,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 300,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 148000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 148000,
      // Line 4a — IRA distributions
      "form-1040.line.4a": 3000,
      // Line 4b — Taxable amount
      "form-1040.line.4b": 3000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 3840,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 154840,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 1850,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 152990,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 152990,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 31500,
      // Line 13a — Qualified business income deduction from Form 8995 or Form 8995-A
      "form-1040.line.13a": 640,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 32140,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 120850,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 16415,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 16415,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 16415,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 300,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 16715,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 17900,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 300,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 18200,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 18200,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 1485,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 1485,
    },
  },
};

export function minExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
