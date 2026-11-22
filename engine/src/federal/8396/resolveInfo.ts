import {
  getMortgageCreditCertificate,
  MORTGAGE_CREDIT_CARRYFORWARD_KEYS,
  MORTGAGE_CREDIT_KEYS,
} from "../../facts/index.js";
import { missingInputs, num, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8396FilingInfo } from "./filingInfo.js";
import { certificateCredit } from "./lines.js";

/*
 * Who files: a holder of a qualified Mortgage Credit Certificate
 * (irs-8396-form-2025::sec::who-can-claim-the-credit::b01), and a filer with a
 * credit carried forward from the 2024 Form 8396 to use (lines 4 to 6,
 * irs-8396-form-2025::sec::part-ii-mortgage-interest-credit-carryforward-to-2026::b01).
 * The explicit decision still wins. A filing form asks for the certificate and
 * the three carryforwards (0 is an answer): lines 1 to 9 read them all.
 */
export function resolve8396Info(inputs: ResolverInputs): Form8396FilingInfo {
  const certificate = getMortgageCreditCertificate(inputs.factByKey);
  const carriedKeys = MORTGAGE_CREDIT_CARRYFORWARD_KEYS.filter(
    (key) => (num(inputs, key) ?? 0) > 0,
  );
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8396",
    fallbacks: [
      {
        rule: "fallback: a Mortgage Credit Certificate is recorded",
        value: certificate !== undefined,
        triggeredByFactKeys: certificate ? [MORTGAGE_CREDIT_KEYS.certificate] : [],
      },
      {
        rule: "fallback: a credit carried forward from the 2024 Form 8396",
        value: carriedKeys.length > 0,
        triggeredByFactKeys: carriedKeys,
      },
    ],
  });
  const carryforwards = {
    from2022: num(inputs, MORTGAGE_CREDIT_KEYS.carryforwardFrom2022),
    from2023: num(inputs, MORTGAGE_CREDIT_KEYS.carryforwardFrom2023),
    from2024: num(inputs, MORTGAGE_CREDIT_KEYS.carryforwardFrom2024),
  };
  const asked =
    resolution.value === true
      ? missingInputs({
          [MORTGAGE_CREDIT_KEYS.certificate]: certificate,
          [MORTGAGE_CREDIT_KEYS.carryforwardFrom2022]: carryforwards.from2022,
          [MORTGAGE_CREDIT_KEYS.carryforwardFrom2023]: carryforwards.from2023,
          [MORTGAGE_CREDIT_KEYS.carryforwardFrom2024]: carryforwards.from2024,
        })
      : [];
  return {
    mustFile: { "form-8396": resolution },
    missingInputs: { "form-8396": asked },
    mortgageCreditCertificate: certificate,
    mortgageCreditCarryforwards: carryforwards,
  };
}

/*
 * Line 3 as the Schedule A line 8a reduction: "subtract the amount shown on
 * Form 8396, line 3, from the total deductible interest you paid on your home
 * mortgage" (irs-1040sa-inst-2025::sec::line-8a::b02;
 * irs-8396-form-2025::sec::line-3::b01). Nothing while the form does not file;
 * `waits` while the certificate is not recorded; `gap` when line 3 is unsupported.
 */
export interface MortgageCreditReduction {
  amount?: number;
  waits?: boolean;
  gap?: string;
}

export function mortgageCreditReduction(inputs: ResolverInputs): MortgageCreditReduction {
  const info = resolve8396Info(inputs);
  if (info.mustFile?.["form-8396"]?.value !== true) return {};
  const certificate = info.mortgageCreditCertificate;
  if (certificate === undefined) return { waits: true };
  const credit = certificateCredit(certificate);
  return "unsupported" in credit ? { gap: credit.reason } : { amount: credit.line3 };
}
