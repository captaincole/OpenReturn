/*
 * riley — LOCKED expected values, drafted from the engine's
 * output on 2026-11-21 (scripts/draftExpected.ts).
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
  "form-5329": {
    engineFields: {
      // Line 1 — Early distributions includible in income
      "form-5329.0.line.1_early_distributions_in_income": 20000,
      // Line 2 — Early distributions included on line 1 that are not subject to the additional tax
      "form-5329.0.line.2_early_distributions_not_subject": 3900,
      // Line 3 — Amount subject to additional tax. Subtract line 2 from line 1
      "form-5329.0.line.3_amount_subject_to_tax": 16100,
      // Line 4 — Additional tax. Enter 10% (0.10) of line 3
      "form-5329.0.line.4_additional_tax_early_distributions": 1610,
    },
    // Line 2's number box: exceptions 23 and 05 both apply, so 99 (irs-5329-inst-2025::sec::line-2::b01).
    renderedText: { "form-5329.0.line.2_exception_number": "99" },
  },
  "schedule-2": {
    engineFields: {
      // Line 8 — Additional tax on IRAs or other tax-favored accounts. Attach Form 5329 if require
      "schedule-2.0.line.8_additional_tax_iras_tax_favored_accounts": 1610,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1610,
    },
    // Form 5329 files, so line 8's "not required" box stays clear (irs-1040-inst-2025::sec::line-8::b01).
    renderedBlank: ["schedule-2.0.line.8_ira_tax_favored_accounts_not_required"],
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 68000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 68000,
      // Line 5a — Pensions and annuities
      "form-1040.line.5a": 20000,
      // Line 5b — Taxable amount
      "form-1040.line.5b": 20000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 88000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 88000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 88000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 72250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 10815,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 10815,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 10815,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1610,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 12425,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 9800,
      // Line 25b — Federal income tax withheld from Form(s) 1099
      "form-1040.line.25b": 3200,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 13000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 13000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 575,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 575,
    },
  },
};

export function rileyExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
