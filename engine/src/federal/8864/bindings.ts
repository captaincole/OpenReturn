/*
 * Form 8864 (Rev. December 2025), Biodiesel, Renewable Diesel, or Sustainable
 * Aviation Fuels Credit, for an individual: lines 7 to 9 from the agri-biodiesel
 * production facts of the taxpayer's own businesses (figures.ts), line 10 from
 * the K-1s and the stated pass-through credits (resolveInfo.ts), line 11 to Form
 * 3800 Part III line 1l or 1ff (form3800.ts). Line 9 is also the business's
 * Schedule C line 6 income (facts/kinds/activitiesOnReturn.ts) and Form 6251
 * line 3 takes it back (receivers.ts).
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { AmountOrGap, Form8864FilingInfo } from "./filingInfo.js";
import { line11Of, type OwnProductionLines } from "./lines.js";
import type { Form8864 } from "./types.js";

type Value = number | Unsupported | undefined;

/*
 * Lines 7 to 9: the taxpayer's own production. Blank with none (a return with
 * only line 10), the gap when the facts do not settle the lines. A period with
 * no gallons leaves its line blank.
 */
function ownLine(info: Form8864FilingInfo, line: keyof OwnProductionLines): Value {
  const figures = info.form8864;
  if (figures === undefined || !figures.ownProduction) return undefined;
  if (figures.gap !== undefined) return unsupported(figures.gap);
  const lines = figures.lines;
  if (lines === undefined) return undefined;
  if ((line === "line7a" || line === "line7c") && lines.line7a === 0) return undefined;
  if ((line === "line8a" || line === "line8c") && lines.line8a === 0) return undefined;
  return lines[line];
}

const valueOf = (figure: AmountOrGap | undefined): Value =>
  figure === undefined ? undefined : "gap" in figure ? unsupported(figure.gap) : figure.amount;

const isGap = (value: Value): value is Unsupported => typeof value === "object";

/* Line 11: "Add lines 9 and 10"; blank while both are blank. */
function line11Value(info: Form8864FilingInfo): Value {
  const line9 = ownLine(info, "line9");
  const line10 = valueOf(info.form8864?.line10);
  if (isGap(line9)) return line9;
  if (isGap(line10)) return line10;
  return line11Of(line9, line10);
}

/* Line A: "If making a transfer election, enter the IRS-issued registration number" (irs-8864-face-2025::sec::face-page-1::b01). */
function lineA(info: Form8864FilingInfo): string | Unsupported | undefined {
  const registration = info.form8864?.transferRegistration;
  if (registration === undefined) return undefined;
  return "gap" in registration ? unsupported(registration.gap) : registration.number;
}

export function register(): void {
  defineForm<Form8864, Form8864FilingInfo>("form-8864", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.header.a_transfer_election_registration_number": (_, info) => lineA(info),
      "0.line.7_agri_biodiesel_before_july_col_a": (_, info) => ownLine(info, "line7a"),
      "0.line.7_agri_biodiesel_before_july_col_c": (_, info) => ownLine(info, "line7c"),
      "0.line.8_agri_biodiesel_after_june_col_a": (_, info) => ownLine(info, "line8a"),
      "0.line.8_agri_biodiesel_after_june_col_c": (_, info) => ownLine(info, "line8c"),
      "0.line.9_total_agri_biodiesel_credit": (_, info) => ownLine(info, "line9"),
      "0.line.10_credit_from_pass_through_entities": (_, info) => valueOf(info.form8864?.line10),
      "0.line.11_add_lines_9_10": (_, info) => line11Value(info),
      /*
       * Lines 12 and 13: "Cooperatives, estates, and trusts, go to line 12 ...
       * All others, stop here" (irs-8864-face-2025::sec::face-page-1::b01). An
       * individual stops at line 11: both stay blank.
       */
      "0.line.12_allocated_to_patrons_beneficiaries": () => undefined,
      "0.line.13_cooperative_estate_trust_credit": () => undefined,
    },

    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
