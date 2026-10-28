/* Every value is from docs/Alejandro-ScheduleCA-Golden.pdf. No CA adjustments: col B/C are 0. */

import type { ExpectedResults } from "../../types.js";

export const alejandroScheduleCaExpected: ExpectedResults = {
  engineFields: {
    "schedule-ca.0.line.1a_federal": 100000,
    "schedule-ca.0.line.1a_subtractions": 0,
    "schedule-ca.0.line.1z_federal": 100000,
    "schedule-ca.0.line.1z_subtractions": 0,
    "schedule-ca.0.line.3b_federal": 385,
    "schedule-ca.0.line.3b_subtractions": 0,
    "schedule-ca.0.line.3b_additions": 0,
    "schedule-ca.0.line.7a_federal": 2550,
    "schedule-ca.0.line.7a_subtractions": 0,
    "schedule-ca.0.line.7a_additions": 0,
    // Lines 4b, 5b, 6b (no IRA, pension, or Social Security) are blank on the CPA return.

    "schedule-ca.2.line.b10_federal": 102935, // 100,000 + 385 + 2,550

    "schedule-ca.3.line.c27_federal": 102935,
    // Column B totals (lines 10 and 27) are blank on the CPA return: no subtractions.

    // CA single standard deduction.
    "schedule-ca.5.page2.total_itemized_30_standard_or_itemized": 5706,
  },

  renderedText: {
    "schedule-ca.0.header.name": "Alejandro Reyes",
    // Bare digits, though the widget (maxLength=11) could hold dashes.
    "schedule-ca.0.header.ssn": "234567890",
  },

  renderedBlank: ["schedule-ca.4.page2.itemize_ca_not_federal"],

  renderedChecked: [],
};
