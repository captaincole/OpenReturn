import {
  factsInCategory,
  missingInputs,
  num,
  resolveMustFile,
  sumCaSdi,
  sumW2Box,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { ScheduleAFilingInfo } from "./filingInfo.js";

/* Schedule A files when the return itemizes (decisions.itemize_vs_standard), or when set explicitly. */
export function resolveScheduleAInfo(inputs: ResolverInputs): ScheduleAFilingInfo {
  const { decisionByKey } = inputs;
  const resolution = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_a",
    fallbacks: [
      {
        rule: "fallback: decisions.itemize_vs_standard = itemized",
        value: decisionByKey.get("decisions.itemize_vs_standard") === "itemized",
        triggeredByDecisionKeys: ["decisions.itemize_vs_standard"],
      },
    ],
  });
  const w2Box17 = sumW2Box(inputs, "box17");
  const caSdi = sumCaSdi(factsInCategory(inputs, "wages"));
  const estStateTax = num(inputs, "state_local_tax.estimated_payments");
  const medicalDentalExpenses = num(inputs, "medical.expenses_total");
  const giftsCashCheck = num(inputs, "charitable.cash");
  const giftsOtherThanCash = num(inputs, "charitable.noncash");
  const realEstateTaxes = num(inputs, "state_local_tax.real_estate");
  const mortgageInterestForm1098 = num(inputs, "mortgage.interest_form_1098");
  return {
    mustFile: { "schedule-a": resolution },
    /* An itemizer answers these once; 0 is an answer. Blank lines would hide a deduction. */
    missingInputs: {
      "schedule-a": missingInputs({
        "medical.expenses_total": medicalDentalExpenses,
        "state_local_tax.real_estate": realEstateTaxes,
        "mortgage.interest_form_1098": mortgageInterestForm1098,
        "charitable.cash": giftsCashCheck,
        "charitable.noncash": giftsOtherThanCash,
      }),
    },
    medicalDentalExpenses,
    stateLocalIncomeTaxPaid: w2Box17 + caSdi + (estStateTax ?? 0),
    generalSalesTaxElection: decisionByKey.get("decisions.itemized.elect_general_sales_tax") as
      boolean | undefined,
    realEstateTaxes,
    personalPropertyTaxes: num(inputs, "state_local_tax.personal_property"),
    mortgageInterestForm1098,
    mortgageInterestNotForm1098: num(inputs, "mortgage.interest_not_form_1098"),
    pointsNotForm1098: num(inputs, "mortgage.points_not_form_1098"),
    giftsCashCheck,
    giftsOtherThanCash,
    giftsCarryover: num(inputs, "charitable.carryover"),
  };
}
