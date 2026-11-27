/*
 * irella — LOCKED expected values, drafted from the engine's
 * output on 2026-11-27 (scripts/draftExpected.ts).
 *
 * UNVERIFIED: no CPA return or filed-return check stands behind these
 * values. They are engine output, checked by hand, so a failure means
 * "the engine changed", not "the engine is wrong".
 *
 * Edit by hand. Change a value only after you verify it against the form
 * instructions or a filed return (scripts/compareFiled).
 */

import type { ExpectedResults } from "../../../types.js";

/* Rows 10 to 25 of line 6: the explanation fills nine rows. */
const EMPTY_ROWS = Array.from(
  { length: 16 },
  (_, index) => `form-8833.0.line.6_treaty_position_explanation_row_${index + 10}`,
);

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  /*
   * Form 8833 has no amounts: every line is a stated answer of the one treaty
   * position (facts.ts), laid out by federal/8833/lines.ts. Checked by hand
   * against the rendered PDF (README.md).
   */
  "form-8833": {
    renderedText: {
      "form-8833.0.header.taxpayer_name": "Irella Wenlock",
      "form-8833.0.header.us_taxpayer_id_number": "400-00-8833",
      "form-8833.0.header.address_country_of_residence":
        "4417 Bluebonnet Ridge Dr Apt 12\nAustin, TX 78745\nUnited States",
      "form-8833.0.header.address_united_states":
        "4417 Bluebonnet Ridge Dr Apt 12\nAustin, TX 78745",
      "form-8833.0.line.1a_treaty_country": "People's Republic of China",
      "form-8833.0.line.1b_treaty_articles": "20(c); Protocol, paragraph 2",
      "form-8833.0.line.2_code_provisions_overruled": "Sections 61 and 7701(b)",
      "form-8833.0.line.3_us_payor_name_address":
        "Prairie Crest State University, EIN 00-0008833\n1200 Campus Loop\nAustin, TX 78712",
      "form-8833.0.line.6_treaty_position_explanation_row_1":
        "I am a full-time doctoral student in chemistry at",
      "form-8833.0.line.6_treaty_position_explanation_row_2":
        "Prairie Crest State University. I first entered the United States on August 15, 2020, on an F-1 visa to begin my",
      "form-8833.0.line.6_treaty_position_explanation_row_3":
        "studies, and I was a resident of the People's Republic of China immediately before. I meet the substantial presence",
      "form-8833.0.line.6_treaty_position_explanation_row_4":
        "test for 2025 and am a resident alien for tax purposes. Article 20(c) of the United States-People's Republic of",
      "form-8833.0.line.6_treaty_position_explanation_row_5":
        "China income tax treaty exempts up to $5,000 a year of a student's income from personal services in the United",
      "form-8833.0.line.6_treaty_position_explanation_row_6":
        "States. Paragraph 2 of the 1984 Protocol to the treaty excepts Article 20 from the saving clause, so the exemption",
      "form-8833.0.line.6_treaty_position_explanation_row_7":
        "continues to apply to a resident alien. I claim the exemption for $5,000 of the $31,400 of wages that the",
      "form-8833.0.line.6_treaty_position_explanation_row_8":
        "university paid me as a teaching assistant in 2025 (Form W-2, box 1). The $5,000 is entered as a negative amount on",
      "form-8833.0.line.6_treaty_position_explanation_row_9": "Schedule 1 (Form 1040), line 8z.",
    },
    renderedChecked: [
      "form-8833.0.header.disclosing_under_section_6114",
      "form-8833.0.header.us_citizen_or_resident",
      "form-8833.0.line.5_reporting_required_6114_1b_no",
    ],
    // No reference ID (an individual), no dual-resident box, no limitation on benefits article, line 5 No.
    renderedBlank: [
      "form-8833.0.header.reference_id_number",
      "form-8833.0.header.dual_resident_disclosing_under_7701b",
      "form-8833.0.line.4_limitation_on_benefits_provisions",
      "form-8833.0.line.5_reporting_required_6114_1b_yes",
      "form-8833.0.line.5_6114_1b_subsections",
      ...EMPTY_ROWS,
    ],
  },
  "schedule-1": {
    engineFields: {
      // Line 8z — Other income amount
      "schedule-1.0.line.8z": -5000,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": -5000,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": -5000,
    },
    // Pub. 519: "Enter 'Exempt income,' the name of the treaty country, and the treaty article."
    renderedText: {
      "schedule-1.0.line.8z_type": "Exempt income, People's Republic of China, Article 20(c)",
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 31400,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 31400,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": -5000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 26400,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 26400,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 26400,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 10650,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 1068,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 1068,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 1068,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 1068,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 1620,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 1620,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 1620,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 552,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 552,
    },
  },
};

export function irellaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
