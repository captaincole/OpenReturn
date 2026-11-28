/*
 * Form 8900, Qualified Railroad Track Maintenance Credit, for an individual:
 * lines 1 to 5 from the railroad track maintenance fact of the taxpayer's own
 * business (figures.ts), line 6 from the K-1s, line 7 to Form 3800 Part III
 * line 4g (form3800.ts). Line 5 also lowers the basis of the track asset that
 * holds the capitalized expenditures (facts/kinds/activitiesOnReturn.ts).
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8900Figures, Form8900FilingInfo } from "./filingInfo.js";
import { line7Of, type TrackLines } from "./lines.js";
import type { Form8900 } from "./types.js";

type Value = number | Unsupported | undefined;

const isGap = (value: unknown): value is Unsupported => typeof value === "object" && value !== null;

/*
 * Lines 1 to 5 of the taxpayer's own business. Blank with no fact of its own
 * (only line 6), and while an answer is missing; the gap when the facts do
 * not add up.
 */
function ownLine(figures: Form8900Figures | undefined, line: keyof TrackLines): Value {
  if (figures === undefined || !figures.ownCredit) return undefined;
  if (figures.gap !== undefined) return unsupported(figures.gap);
  return figures.lines?.[line];
}

/* Line 6: the K-1 credits, or the gap of a K-1 with no amount; blank with none. */
function line6Of(figures: Form8900Figures | undefined): Value {
  const k1 = figures?.k1Credits;
  if (k1 === undefined) return undefined;
  return "gap" in k1 ? unsupported(k1.gap) : k1.amount;
}

/* Line 7: "Add lines 5 and 6"; blank while both are blank or line 5 waits. */
function line7Value(figures: Form8900Figures | undefined): Value {
  const line5 = ownLine(figures, "line5");
  const line6 = line6Of(figures);
  if (isGap(line5)) return line5;
  if (isGap(line6)) return line6;
  if (line5 === undefined && line6 === undefined) return undefined;
  if (figures?.ownCredit && line5 === undefined) return undefined;
  return line7Of(line5, line6);
}

/* Miles print as entered, with their decimals; formatDollars would round them. */
const asMiles = (value: unknown) => String(value);

export function register(): void {
  defineForm<Form8900, Form8900FilingInfo>("form-8900", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.line.1_track_maintenance_expenditures": (_, info) => ownLine(info.form8900, "line1"),
      "0.line.2_forty_percent_of_line1": (_, info) => ownLine(info.form8900, "line2"),
      // Lines 3a and 3b: "This line only applies to you if you are a Class II or Class III railroad" (line-3a::b01, line-3b::b01).
      "0.line.3a_miles_owned_or_leased": (_, info) => ownLine(info.form8900, "line3a"),
      "0.line.3b_miles_assigned_to_others": (_, info) => ownLine(info.form8900, "line3b"),
      "0.line.3c_miles_assigned_to_you": (_, info) => ownLine(info.form8900, "line3c"),
      "0.line.3d_total_miles": (_, info) => ownLine(info.form8900, "line3d"),
      "0.line.4_miles_times_3500": (_, info) => ownLine(info.form8900, "line4"),
      "0.line.5_smaller_of_line2_or_line4": (_, info) => ownLine(info.form8900, "line5"),
      "0.line.6_credit_from_partnerships_s_corps": (_, info) => line6Of(info.form8900),
      "0.line.7_total_credit": (_, info) => line7Value(info.form8900),
    },

    formatters: {
      // The SSN widget keeps the dashes.
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.line.3a_miles_owned_or_leased": asMiles,
      "0.line.3b_miles_assigned_to_others": asMiles,
      "0.line.3c_miles_assigned_to_you": asMiles,
      "0.line.3d_total_miles": asMiles,
    },
  });
}
