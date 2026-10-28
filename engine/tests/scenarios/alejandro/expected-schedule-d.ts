/* Every value is from docs/Alejandro-ScheduleD-Golden.pdf. */

import type { ExpectedResults } from "../../types.js";

export const alejandroScheduleDExpected: ExpectedResults = {
  engineFields: {
    "schedule-d.0.line.1b_proceeds": 1650,
    "schedule-d.0.line.1b_cost": 1350,
    "schedule-d.0.line.1b_adjustments": 0,
    "schedule-d.0.line.1b_gain_loss": 300,
    "schedule-d.0.line.7_net_short_term_gain_loss": 300,

    "schedule-d.0.line.8b_proceeds": 11500,
    "schedule-d.0.line.8b_cost": 9250,
    "schedule-d.0.line.8b_adjustments": 0,
    "schedule-d.0.line.8b_gain_loss": 2250,
    "schedule-d.0.line.15_net_long_term_gain_loss": 2250,

    "schedule-d.1.line.16_combined_gain_loss": 2550,
  },

  renderedText: {
    "schedule-d.0.header.taxpayer_name": "Alejandro Reyes",
    "schedule-d.0.header.ssn": "234567890",
    "schedule-d.0.line.1b_proceeds": "1,650",
    "schedule-d.0.line.1b_cost": "1,350",
    "schedule-d.0.line.1b_gain_loss": "300",
    "schedule-d.0.line.7_net_short_term_gain_loss": "300",
    "schedule-d.0.line.8b_proceeds": "11,500",
    "schedule-d.0.line.8b_cost": "9,250",
    "schedule-d.0.line.8b_gain_loss": "2,250",
    "schedule-d.0.line.15_net_long_term_gain_loss": "2,250",
    "schedule-d.1.line.16_combined_gain_loss": "2,550",
  },

  renderedChecked: [
    // Line 17: Yes (both 15 and 16 are gains).
    "schedule-d.1.line.17_both_gains_yes",
    // Line 20: Yes (lines 18+19 zero, not filing Form 4952 → use QDCG).
    "schedule-d.1.line.20_use_qual_div_worksheet_yes",
  ],

  renderedBlank: [
    // Lines 18 and 19 do not apply (no 28% gain, no §1250 gain).
    "schedule-d.1.line.18_rate_gain_worksheet_amount",
    "schedule-d.1.line.19_unrecaptured_sec1250_gain",
    // Lines 21 and 22 are skipped per line 20 = Yes.
    "schedule-d.1.line.21_allowable_loss",
    // 8949 itemizes into 1b/8b, so 1a/8a stay blank.
    "schedule-d.0.line.1a_proceeds",
    "schedule-d.0.line.8a_proceeds",
  ],
};
