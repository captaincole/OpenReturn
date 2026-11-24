/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { withForm8814 } from "../8814/totals.js";
import { describeItem, entityTitle } from "../passThrough/items.js";
import { receivedAmounts } from "../passThrough/receipts.js";
import type { Form8960FilingInfo } from "./filingInfo.js";
import {
  NIIT_THRESHOLDS,
  netInvestmentIncome,
  nonpassiveK1Adjustments,
  nonpassiveRentalAdjustments,
} from "./lines.js";
import { pficBindings } from "./pficLines.js";
import type { Form8960 } from "./types.js";

const OTHER_MODIFICATIONS = unsupported(
  "Other NII modifications (section 1411 NOL, estate/trust distributions, section 404(k) dividends, etc.) — no scenario modeled yet.",
);

/*
 * A beneficiary enters box 14 code H on line 7 and, as its sign says, adjusts
 * MAGI on line 13 (irs-1041k1-inst-2025::sec::box-14-other-information::b03;
 * irs-8960-inst-2025::sec::line-7-other-modifications-to-investment-income::b04,
 * ::line-13-modified-adjusted-gross-income-magi::b03). Not modeled: a code H
 * that is not 0 makes both lines unsupported, naming the estate or trust.
 */
function netInvestmentAdjustmentGap(info: Form8960FilingInfo): Unsupported | undefined {
  const receipt = info.passThroughNetInvestmentAdjustment;
  if (receipt?.kind === "unsupported") return unsupported(receipt.reason);
  const named = receivedAmounts(receipt).map(
    ({ entity, item }) => `${entityTitle(entity)}: ${describeItem(item)}`,
  );
  return named.length > 0
    ? unsupported(`${named.join("; ")} adjusts lines 7 and 13, which is not modeled for a K-1.`)
    : undefined;
}

export function register(): void {
  defineForm<Form8960, Form8960FilingInfo>("form-8960", {
    bindings: {
      ...pficBindings,
      "0.header.ssn_or_ein": (_, info) => info.taxpayerSSN,
      "0.line.1": (form) => sum(form["form-1040.line.2b"]),
      "0.line.2": (form) => sum(form["form-1040.line.3b"]),
      // MANUAL EDIT: a filed Schedule E whose Schedule 1 line 5 is still blank makes line 4a wait.
      "0.line.4a": (form, info) =>
        info.mustFile?.["schedule-e"]?.value !== false && form["schedule-1.0.line.5"] === undefined
          ? undefined
          : sum(
              form["schedule-1.0.line.3"],
              form["schedule-1.0.line.5"],
              form["schedule-1.0.line.6"],
            ),
      /*
       * MANUAL EDIT: irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01,
       * ::b02: nonpassive section 162 income goes on line 4b as a negative, a loss as a
       * positive. Line G "Yes" makes every Schedule C business nonpassive. Schedule F
       * is not modeled, and no fact marks a trader in financial instruments. A K-1's
       * nonpassive trade or business income or loss on Schedule E Part II comes out
       * the same way (lines.ts nonpassiveK1Adjustments).
       */
      "0.line.4b": (form, info) => {
        const scheduleC = form["schedule-1.0.line.3"];
        if (info.scheduleCNonpassive === true && typeof scheduleC !== "number") return undefined;
        const rentals = nonpassiveRentalAdjustments(form, info.rentalProperties ?? []);
        if (rentals === undefined) return undefined;
        const k1s = nonpassiveK1Adjustments(info.passThroughBusiness);
        if (k1s === undefined || !Array.isArray(k1s)) return k1s;
        const business =
          info.scheduleCNonpassive === true && typeof scheduleC === "number"
            ? 0 - scheduleC
            : undefined;
        return business === undefined && rentals.length === 0 && k1s.length === 0
          ? undefined
          : sum(business, ...rentals, ...k1s);
      },
      "0.line.4c": (form) => sum(form["0.line.4a"], form["0.line.4b"]),
      "0.line.5a": (form) => sum(form["form-1040.line.7a"], form["schedule-1.0.line.4"]),
      "0.line.5d": (form) => sum(form["0.line.5a"], form["0.line.5b"], form["0.line.5c"]),
      /*
       * MANUAL EDIT: irs-8960-inst-2025::sec::line-7-other-modifications-to-investment-income::b04:
       * each Form 8814 line 12, excluding Alaska Permanent Fund dividends (the
       * Pub. 550 share, federal/8814/lines.ts). The other line 7 items have no
       * fact: with no Form 8814 amount the line stays unsupported.
       */
      "0.line.7": (_, info) => {
        const k1Gap = netInvestmentAdjustmentGap(info);
        if (k1Gap) return k1Gap;
        const line7 = withForm8814(
          info.form8814Totals,
          0,
          (figured) => figured.line12LessAlaskaDividends,
        );
        return line7 === 0 ? OTHER_MODIFICATIONS : line7;
      },
      "0.line.8": (form) =>
        sum(
          form["0.line.1"],
          form["0.line.2"],
          form["0.line.3"],
          form["0.line.4c"],
          form["0.line.5d"],
          form["0.line.6"],
          form["0.line.7"],
        ),
      "0.line.9d": (form) => sum(form["0.line.9a"], form["0.line.9b"], form["0.line.9c"]),
      // MANUAL EDIT: line 10 = the taxpayer's stated modifications; blank when they state none.
      "0.line.10": (_, info) => {
        const stated = info.additionalModifications;
        return typeof stated === "number" && stated !== 0 ? roundDollars(stated) : undefined;
      },
      "0.line.11": (form) => sum(form["0.line.9d"], form["0.line.10"]),
      "0.line.12": (form) => netInvestmentIncome(form["0.line.8"], form["0.line.11"]),
      // MAGI = AGI; the FEIE/CFC add-backs are not modeled. MANUAL EDIT: nor a K-1's code H adjustment.
      "0.line.13": (form, info) =>
        netInvestmentAdjustmentGap(info) ?? sum(form["form-1040.line.11b"]),
      // MANUAL EDIT: statutory thresholds; not indexed for inflation.
      "0.line.14": (_, info) =>
        info.filingStatus ? NIIT_THRESHOLDS[info.filingStatus] : undefined,
      // MANUAL EDIT: line 9a = Schedule A line 9; blank when Schedule A is not filed.
      "0.line.9a": (form) => {
        const value = form["schedule-a.0.line.9_investment_interest"];
        return typeof value === "number" ? value : undefined;
      },
      // MANUAL EDIT: line 9b = the taxpayer's allocation, capped at the SALT actually deducted (Schedule A line 5e).
      "0.line.9b": (form, info) => {
        const deducted = form["schedule-a.0.line.5e_salt_cap"];
        const allocated = info.stateLocalTaxAllocableToInvestmentIncome;
        return typeof deducted === "number" && typeof allocated === "number"
          ? Math.min(roundDollars(allocated), deducted)
          : undefined;
      },
      // MANUAL EDIT: line 16 = smaller of line 12 or line 15.
      "0.line.16": (form) => {
        const nii = form["0.line.12"];
        const excess = form["0.line.15"];
        return typeof nii === "number" && typeof excess === "number"
          ? Math.min(nii, excess)
          : undefined;
      },
      // MANUAL EDIT: line 17 = line 16 × 3.8%.
      "0.line.17": (form) => {
        const base = form["0.line.16"];
        return typeof base === "number" ? roundDollars(base * 0.038) : undefined;
      },
      // MANUAL EDIT: line 15 waits while line 13 is blank or a gap, so line 17 never shows a $0 it did not figure.
      "0.line.15": (form) =>
        typeof form["0.line.13"] !== "number"
          ? undefined
          : atLeast(
              0,
              sum(form["0.line.13"], form["0.line.14"] === undefined ? 0 : -form["0.line.14"]),
            ),
    },

    unsupported: {
      "0.header.taxpayer_name":
        "Full name needs first + last joined, and no single identity fact holds the combined name; we have no rule that concatenates text.",
      "0.header.election_6013g":
        "No nonresident-alien-spouse scenario yet; section 6013(g) NIIT election not modeled.",
      "0.header.election_6013h":
        "No nonresident-alien-spouse scenario yet; section 6013(h) NIIT election not modeled.",
      "0.line.3":
        "Only nonqualified annuities count (not 401/403/IRA/457), and our 1099-R facts don't say which kind of plan paid the distribution; no nonqualified-annuity scenario yet.",
      "0.line.5c":
        "Partnership interest / S corporation stock disposition adjustment — no K-1 or pass-through disposition scenario yet.",
      "0.line.9c":
        "Miscellaneous investment expenses are generally disallowed post-2017 (OBBBA made permanent); no ingestion path for allowable section 62/212 expenses.",
      "0.line.18a":
        "Lines 18–21 are completed only by estates and trusts (Form 1041 filers). We only model individual 1040 filers, so this stays blank.",
      "0.line.18b":
        "Estate/trust deductions for distributions and charitable deductions (sections 651/661/642(c)). We have no Form 1041 scenario.",
      "0.line.18c":
        "Undistributed NII for estates and trusts. We have no Form 1041 scenario, so individuals leave it blank.",
      "0.line.19a":
        "AGI of the estate or trust (from Form 1041). We have no estate/trust scenario; individuals use line 13 instead.",
      "0.line.19b":
        "Dollar amount where the top estate/trust bracket starts (Form 1041 Schedule G). Applies only to estates and trusts, which we don't model.",
      "0.line.19c":
        "Estate/trust AGI minus the bracket threshold. We have no estate/trust scenario.",
      "0.line.20":
        "Smaller of line 18c or line 19c, for estates and trusts only. We have no estate/trust scenario.",
      "0.line.21":
        "NIIT for estates and trusts (line 20 × 3.8%). Individuals use line 17 instead, and we have no estate/trust scenario.",
    },
  });
}
