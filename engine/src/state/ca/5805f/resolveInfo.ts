import {
  CA_FARMER_ESTIMATED_TAX_KEYS,
  CA_PAYMENT_KEYS,
  isCaFarmerWaiver,
  PRIOR_YEAR_KEYS,
} from "../../../facts/index.js";
import { dayNumber } from "../../../federal/2210/dates.js";
import { roundDollars, sum } from "../../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { unsupported } from "../../../types.js";
import type { Form5805FAnswers, Form5805FFilingInfo } from "./filingInfo.js";
import { NO_PENALTY_BELOW, NO_PENALTY_BELOW_SEPARATE, type PriorYearInputs } from "./lines.js";
import { resolve5805FMustFile } from "./mustFile.js";

const BAD_DATE =
  "The date the underpayment was paid is not a calendar date (YYYY-MM-DD), so line 13 cannot be filled.";

/* Lines 7 to 9: the 2024 answers; undefined while the 2024 tax waits. */
function priorYearOf(
  inputs: ResolverInputs,
  separateReturn: boolean,
): Pick<Form5805FAnswers, "priorYear" | "priorYearWithholdingWaits"> {
  if (inputs.factByKey.get(PRIOR_YEAR_KEYS.caNoTwelveMonthReturn) === true) {
    return { priorYear: "no_twelve_month_return", priorYearWithholdingWaits: false };
  }
  const tax = num(inputs, PRIOR_YEAR_KEYS.caTax);
  if (tax === undefined) return { priorYear: undefined, priorYearWithholdingWaits: false };
  const limit = separateReturn ? NO_PENALTY_BELOW_SEPARATE : NO_PENALTY_BELOW;
  const withholding = num(inputs, PRIOR_YEAR_KEYS.caWithholding);
  const prior: PriorYearInputs = {
    taxLessLumpSum: roundDollars(tax),
    lumpSumTax: roundDollars(num(inputs, PRIOR_YEAR_KEYS.caLumpSumTax)),
    withholding: roundDollars(withholding),
  };
  return {
    priorYear: prior,
    priorYearWithholdingWaits: tax >= limit && withholding === undefined,
  };
}

/* Line 11's payments other than withholding; undefined while the January 15 part waits. */
function paymentsByDueDate(inputs: ResolverInputs): number | undefined {
  const estimated = num(inputs, CA_PAYMENT_KEYS.estimatedTax) ?? 0;
  const byDueDate =
    estimated > 0 ? num(inputs, CA_FARMER_ESTIMATED_TAX_KEYS.estimatedTaxByJanuary15) : 0;
  if (byDueDate === undefined) return undefined;
  /* The 2024 overpayment applied to 2025 estimated tax was paid before the due date. */
  return roundDollars(sum(byDueDate, num(inputs, CA_PAYMENT_KEYS.priorYearOverpaymentApplied)));
}

function underpaymentPaidOn(inputs: ResolverInputs): Form5805FAnswers["underpaymentPaidOn"] {
  const raw = inputs.factByKey.get(CA_FARMER_ESTIMATED_TAX_KEYS.underpaymentPaidOn);
  if (raw === undefined) return undefined;
  const day = typeof raw === "string" ? dayNumber(raw) : undefined;
  return day ?? unsupported(BAD_DATE);
}

function answersOf(inputs: ResolverInputs): Form5805FAnswers {
  const separateReturn = filingStatusOf(inputs) === "married_filing_separately";
  const filed = inputs.factByKey.get(CA_FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2);
  const waiver = inputs.factByKey.get(CA_FARMER_ESTIMATED_TAX_KEYS.waiver);
  return {
    files540: inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true,
    separateReturn,
    ...priorYearOf(inputs, separateReturn),
    paymentsByDueDate: paymentsByDueDate(inputs),
    filedAndPaidByMarch2: typeof filed === "boolean" ? filed : undefined,
    underpaymentPaidOn: underpaymentPaidOn(inputs),
    waiver: isCaFarmerWaiver(waiver) ? waiver : undefined,
  };
}

/* The answers the form waits on once it files. */
function required(inputs: ResolverInputs, answers: Form5805FAnswers): string[] {
  const asked: Record<string, unknown> = {
    [CA_FARMER_ESTIMATED_TAX_KEYS.filedAndPaidByMarch2]: answers.filedAndPaidByMarch2,
  };
  if (answers.priorYear !== "no_twelve_month_return") {
    asked[PRIOR_YEAR_KEYS.caTax] = num(inputs, PRIOR_YEAR_KEYS.caTax);
  }
  if (answers.priorYearWithholdingWaits) asked[PRIOR_YEAR_KEYS.caWithholding] = undefined;
  if (answers.paymentsByDueDate === undefined) {
    asked[CA_FARMER_ESTIMATED_TAX_KEYS.estimatedTaxByJanuary15] = undefined;
  }
  return missingInputs(asked);
}

/*
 * FTB 5805F (ca-5805f-inst-2025): who files (mustFile.ts) and the answers of
 * lines 7 to 16. Form 540's lines come in through the bindings.
 */
export function resolve5805FInfo(inputs: ResolverInputs): Form5805FFilingInfo {
  const resolution = resolve5805FMustFile(inputs);
  const answers = resolution.value === true ? answersOf(inputs) : undefined;
  return {
    mustFile: { "form-5805f": resolution },
    missingInputs: { "form-5805f": answers ? required(inputs, answers) : [] },
    form5805F: answers,
  };
}
