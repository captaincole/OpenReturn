/*
 * FTB 3805P Part III: the California additional tax on Archer MSA and Medicare
 * Advantage MSA distributions, from federal Form 8853
 * (ca-3805p-inst-2025::sec::part-iii-additional-tax-on-distributions-from-archer-and-medicare-advantage-medical-savings-accounts-msas::b01–b03).
 */

import type { FormSpec } from "../../../defineForm.js";
import type { Form8853FilingInfo } from "../../../federal/8853/filingInfo.js";
import { files8853, form8853Total } from "../../../federal/8853/results.js";
import { roundDollars } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3805pFilingInfo } from "./filingInfo.js";
import type { Form3805p } from "./types.js";

/* Line 10b: "multiply line 9 by 12.5% (.125)" (the form); California's rate, not the federal 20% (::b01). */
export const CA_MSA_ADDITIONAL_TAX_RATE = 0.125;

export const PART_III_WITHOUT_8853 =
  "No fact records an Archer MSA or Medicare Advantage MSA distribution, and federal Form 8853 is not modeled (ca-3805p-inst-2025::sec::part-iii-additional-tax-on-distributions-from-archer-and-medicare-advantage-medical-savings-accounts-msas::b01).";
const TWO_PEOPLE =
  "More than one person on the return has an MSA or an early distribution: each spouse/RDP completes a separate FTB 3805P (ca-3805p-inst-2025::sec::b-who-must-file::b03), and the engine prints one.";
const ROLLOVER =
  "Form 8853 line 6b holds a rollover, and California taxes a rollover from an Archer MSA to an HSA (ca-3805p-inst-2025::sec::part-iii-additional-tax-on-distributions-from-archer-and-medicare-advantage-medical-savings-accounts-msas::b01); no fact says where it went.";

type Info = Form3805pFilingInfo & Form8853FilingInfo;
type Bindings = FormSpec<Form3805p, Form3805pFilingInfo>["bindings"];

/* The one person Part III is for, or the reason the engine cannot print it. */
export function msaOwner(info: Info): "taxpayer" | "spouse" | Unsupported | undefined {
  if (!files8853(info)) return undefined;
  const holders = info.form8853MsaHolders ?? [];
  if (holders.length > 1) return unsupported(TWO_PEOPLE);
  const early = info.earlyDistributionOwner;
  if (early !== undefined && holders.length === 1 && early !== holders[0])
    return unsupported(TWO_PEOPLE);
  return holders[0];
}

const above0 = (value: number | Unsupported | undefined) =>
  typeof value === "number" && value <= 0 ? undefined : value;

/* Line 9: federal Form 8853 line 8 when there is no difference (::b02). */
function line9(info: Info): number | Unsupported | undefined {
  if (!files8853(info)) return unsupported(PART_III_WITHOUT_8853);
  const owner = msaOwner(info);
  if (typeof owner === "object") return owner;
  if ((info.form8853Lines?.["0.line.6b_rollovers_excess_withdrawn"] ?? 0) !== 0)
    return unsupported(ROLLOVER);
  return above0(form8853Total(info, ["0.line.8_taxable_archer_msa_distributions"]));
}

export const partIIIBindings: Bindings = {
  "0.part3.line_9_taxable_archer_msa_distribution": (_, info) => line9(info),
  // Line 10a: checked when the federal line 9a is (::b02): the federal exceptions apply.
  "0.part3.line_10a_archer_msa_tax_exception": (_, info) => {
    const nine = line9(info);
    if (typeof nine !== "number") return nine;
    return (info as Info).form8853Lines?.["0.line.9a_exception_additional_20_tax"] as
      boolean | undefined;
  },
  // Line 10b: 12.5% of the part of line 9 that meets no exception (the form; ::b02).
  "0.part3.line_10b_archer_msa_tax_due": (_, info) => {
    const nine = line9(info);
    if (typeof nine !== "number") return nine;
    const subject = (info as Info).form8853ArcherSubjectToTax;
    return subject === undefined ? undefined : roundDollars(subject * CA_MSA_ADDITIONAL_TAX_RATE);
  },
  // Line 11: "Enter the amount from federal Form 8853, line 13b" (::b03).
  "0.part3.line_11_medicare_advantage_msa_tax_due": (_, info) => {
    if (!files8853(info)) return unsupported(PART_III_WITHOUT_8853);
    const owner = msaOwner(info);
    if (typeof owner === "object") return owner;
    return above0(form8853Total(info, ["0.line.13b_additional_50_tax"]));
  },
};
