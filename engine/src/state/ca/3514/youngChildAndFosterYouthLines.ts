/*
 * Part VII (lines 23–28, the YCTC) and Part IX (lines 31–39, the FYTC). A
 * part is filled only when its credit applies ("If you meet all of the
 * requirements for YCTC, complete Part VII", ::sec::step-8-qualifications-for-young-child-tax::b01;
 * the same for the FYTC, ::sec::step-10-qualifications-for-foster-youth-tax-credit::b01).
 */

import type { BindingFn } from "../../../defineForm.js";
import { unsupported } from "../../../types.js";
import { caEitcOutcome, creditLine } from "./credit.js";
import type { Form3514FilingInfo } from "./filingInfo.js";
import {
  CA_YCTC_ZERO_INCOME_AGI_LIMIT,
  CA_YCTC_ZERO_INCOME_LIMIT,
  CA_YOUNG_CHILD_AND_FOSTER_YOUTH_CREDIT,
} from "./limits.js";
import { isGap, partIV, type Lines, type PartIV } from "./lines.js";
import type { Form3514 } from "./types.js";
import {
  centsParts,
  excessOverThreshold,
  FOSTER_NAME_GAP,
  fosterYouthClaimants,
  fytcOutcome,
  hasYoungChild,
  reductionCents,
  totalWages,
  YCTC_ZERO_EARNED_INCOME_GAP,
  yctcOutcome,
} from "./youngChildAndFosterYouth.js";

type Bindings = Partial<{ [K in keyof Form3514]: BindingFn<Form3514, Form3514FilingInfo, K> }>;

/* Part IV's lines once known, with no gap; undefined otherwise. */
function knownPartIV(form: Lines, info: Form3514FilingInfo): PartIV | undefined {
  const lines = partIV(form, info);
  return lines === undefined || isGap(lines) ? undefined : lines;
}

/*
 * Part VII applies with a child under six and the EITC allowed (earned income
 * over 0), or with earned income of zero or less (lines 23a and 23b decide).
 */
function partVII(form: Lines, info: Form3514FilingInfo): PartIV | undefined {
  const lines = knownPartIV(form, info);
  if (lines === undefined || !hasYoungChild(info)) return undefined;
  if (lines.line19 <= 0) return lines;
  return caEitcOutcome(form, info).kind === "credit" ? lines : undefined;
}

/* Line 25 when line 23 is over $27,425; lines 26–27 follow it. */
const line25 = (form: Lines, info: Form3514FilingInfo) => {
  const lines = partVII(form, info);
  return lines === undefined || lines.line19 <= 0 ? undefined : excessOverThreshold(lines.line19);
};

const yctcReduction = (form: Lines, info: Form3514FilingInfo) => {
  const excess = line25(form, info);
  return excess === undefined ? undefined : centsParts(reductionCents(excess, 1));
};

export function partVIIBindings(): Bindings {
  return {
    // Line 23 (::sec::line-23::b01): "Enter the amount from form FTB 3514, line 19."
    "2.line.23_ca_earned_income": (form, info) => partVII(form, info)?.line19,
    // Line 23a (::sec::line-23a::b01): only when line 23 is $0 or less.
    "2.line.23a_total_wages": (form, info) => {
      const lines = partVII(form, info);
      return lines === undefined || lines.line19 > 0 ? undefined : totalWages(lines.line13, info);
    },
    /*
     * Line 23b (::sec::line-23b::b01): checked when federal AGI exceeds $32,900.
     * Under that, the total net loss decides, which the engine does not figure:
     * the same gap line 28 reports. Blank when line 23a already stops the credit.
     */
    "2.line.23b_net_loss_or_agi_over_limit": (form, info) => {
      const lines = partVII(form, info);
      if (lines === undefined || lines.line19 > 0) return undefined;
      if (totalWages(lines.line13, info) > CA_YCTC_ZERO_INCOME_LIMIT) return undefined;
      const agi = form["form-1040.line.11b"];
      if (typeof agi !== "number") return undefined;
      return agi > CA_YCTC_ZERO_INCOME_AGI_LIMIT ? true : unsupported(YCTC_ZERO_EARNED_INCOME_GAP);
    },
    "2.line.25_excess_over_threshold": line25,
    // Line 26: line 25 / 100, two decimals, whole dollars before the point.
    "2.line.26_excess_divided_by_100_whole": (form, info) => yctcLine26(form, info)?.dollars,
    "2.line.26_excess_divided_by_100_decimal": (form, info) => yctcLine26(form, info)?.cents,
    "2.line.27_reduction_amount_dollars": (form, info) => yctcReduction(form, info)?.dollars,
    "2.line.27_reduction_amount_cents": (form, info) => yctcReduction(form, info)?.cents,
    // Line 28: the YCTC (youngChildAndFosterYouth.ts); also Form 540 line 76.
    "2.line.28_yctc": (form, info) => creditLine(yctcOutcome(form, info)),
  };
}

/* Line 26 (and 37) as its two boxes: line 25 in cents is line 25 / 100. */
function yctcLine26(form: Lines, info: Form3514FilingInfo) {
  const excess = line25(form, info);
  return excess === undefined ? undefined : centsParts(excess);
}

/* The FYTC's claimants and Part IV once the credit applies; undefined otherwise. */
function partIX(form: Lines, info: Form3514FilingInfo) {
  if (fytcOutcome(form, info).kind !== "credit") return undefined;
  const claimants = fosterYouthClaimants(info);
  const lines = knownPartIV(form, info);
  if (claimants === undefined || lines === undefined) return undefined;
  const count = Number(claimants.taxpayer) + Number(claimants.spouse);
  return { ...claimants, count, lines, excess: excessOverThreshold(lines.line19) };
}

/* A line for one claimant: its value when that spouse claims the FYTC. */
const forClaimant =
  <T>(who: "taxpayer" | "spouse", value: (info: Form3514FilingInfo) => T) =>
  (form: Lines, info: Form3514FilingInfo) => {
    const part = partIX(form, info);
    return part === undefined || !part[who] ? undefined : value(info);
  };

const fytcReduction = (form: Lines, info: Form3514FilingInfo) => {
  const part = partIX(form, info);
  return part?.excess === undefined
    ? undefined
    : centsParts(reductionCents(part.excess, part.count));
};

export function partIXBindings(): Bindings {
  const nameGap = () => unsupported(FOSTER_NAME_GAP);
  return {
    // Line 31 (::sec::line-31::b01): each spouse who qualifies checks a box.
    "2.line.31a_primary_taxpayer_claims_fytc": (form, info) => partIX(form, info)?.taxpayer,
    "2.line.31b_spouse_claims_fytc": (form, info) => partIX(form, info)?.spouse,
    // Line 32 (::sec::line-32::b01): the name in foster care when it differs.
    "2.line.32a_foster_first_name_taxpayer": forClaimant("taxpayer", nameGap),
    "2.line.32b_foster_last_name_taxpayer": forClaimant("taxpayer", nameGap),
    "2.line.32a_foster_first_name_spouse": forClaimant("spouse", nameGap),
    "2.line.32b_foster_last_name_spouse": forClaimant("spouse", nameGap),
    // Line 33 (::sec::line-33::b01): "You may only provide consent for yourself. Consent is optional."
    "3.line.33a_taxpayer_cdss_consent": forClaimant(
      "taxpayer",
      (info) => info.caEitcAnswers?.cdssConsentTaxpayer,
    ),
    "3.line.33b_spouse_cdss_consent": forClaimant(
      "spouse",
      (info) => info.caEitcAnswers?.cdssConsentSpouse,
    ),
    // Line 34 (::sec::line-34::b01): "Enter the amount from form FTB 3514, line 19."
    "3.line.34_ca_earned_income": (form, info) => partIX(form, info)?.lines.line19,
    // Line 35: $1,189, or $2,378 when both spouses claim it.
    "3.line.35_available_fytc": (form, info) => {
      const part = partIX(form, info);
      return part === undefined ? undefined : CA_YOUNG_CHILD_AND_FOSTER_YOUTH_CREDIT * part.count;
    },
    // Line 36 (::sec::line-36::b01): line 34 less $27,425, when over it.
    "3.line.36_excess_over_threshold": (form, info) => partIX(form, info)?.excess,
    "3.line.37_excess_divided_by_100_whole": (form, info) => fytcLine37(form, info)?.dollars,
    "3.line.37_excess_divided_by_100_decimal": (form, info) => fytcLine37(form, info)?.cents,
    "3.line.38_reduction_amount_dollars": (form, info) => fytcReduction(form, info)?.dollars,
    "3.line.38_reduction_amount_cents": (form, info) => fytcReduction(form, info)?.cents,
    // Line 39: the FYTC; also Form 540 line 77.
    "3.line.39_fytc": (form, info) => creditLine(fytcOutcome(form, info)),
  };
}

function fytcLine37(form: Lines, info: Form3514FilingInfo) {
  const excess = partIX(form, info)?.excess;
  return excess === undefined ? undefined : centsParts(excess);
}
