/*
 * Schedule B's resolver: the payer lists of lines 1 and 5, Part III's answers,
 * and who must file. Moved out of filingInfoResolvers.ts, which re-exports it.
 */

import { isDividendFactKey, isInterestFactKey } from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { figuredForm8814, form8814Totals } from "../8814/totals.js";
import { filesForm8815, savingsBondExclusionScope } from "../8815/resolveInfo.js";
import { foreignAccountsOnReturn } from "../8938/resolveInfo.js";
import { receivedAmounts, receivedOnReturn, type Receipt } from "../passThrough/receipts.js";
import type { ForeignAccountFacts, PayerAmount, ScheduleBFilingInfo } from "./filingInfo.js";

/*
 * FinCEN Form 114 is required "if the aggregate value of foreign financial
 * accounts exceeds $10,000 at any time during 2025"
 * (irs-1040sb-inst-2025::sec::line-7a-question-2-see-fincen-form-114-and-its::b01).
 */
export const FINCEN_114_LIMIT = 10000;

/*
 * Line 7a from the Form 8938 account facts: an account recorded there is "a
 * financial account located in a foreign country"
 * (irs-1040sb-inst-2025::sec::line-7a-question-1-check-the-yes-box-if-at-any-time::b01).
 * Undefined with no account fact. One account worth more than $10,000 settles
 * question 2; a smaller one does not (the aggregate at any time is unknown).
 */
function foreignAccountFactsOf(inputs: ResolverInputs): ForeignAccountFacts | undefined {
  const accounts = foreignAccountsOnReturn(inputs);
  if (accounts.length === 0) return undefined;
  const countries = accounts
    .map((account) => account.country)
    .filter((country): country is string => country !== undefined && country !== "");
  return {
    countries: [...new Set(countries)],
    overFincenLimit: accounts.some((account) => account.maximumDollars > FINCEN_114_LIMIT),
  };
}

/*
 * A K-1's payer rows: "List each payer's name and the amount"
 * (irs-1040sb-inst-2025::sec::line-1::b01); the estate or trust is the payer
 * (irs-1041k1-inst-2025::sec::box-1-interest-income::b01, ::box-2a-ordinary-dividends::b01).
 */
const k1PayerRows = (receipt: Receipt): PayerAmount[] =>
  receivedAmounts(receipt).map(({ entity, item }) => ({
    payerName: entity.name,
    amount: item.amount ?? 0,
  }));

/*
 * Schedule B line 5 rows: the parents' dividends, then each K-1's, then each
 * Form 8814 line 9. irs-8814-inst-2025::sec::line-9::b01: each Form 8814 line 9
 * is a line 5 row named "Form 8814", and Schedule B files when it plus the
 * parents' dividends is more than $1,500. A child's foreign account (Part III,
 * ::b07) has no fact.
 */
function scheduleBDividendPayers(inputs: ResolverInputs, k1Dividends: Receipt) {
  const form8814Rows = (figuredForm8814(form8814Totals(inputs))?.line9ByChild ?? [])
    .filter((line9) => line9 > 0)
    .map((line9) => ({ payerName: "Form 8814", amount: line9 }));
  return [
    ...payerAmounts(inputs, isDividendFactKey, (value) => sum(value.box1a)),
    ...k1PayerRows(k1Dividends),
    ...form8814Rows,
  ];
}

// IRS Schedule B inst.: interest or dividends over $1,500, or a Part III "Yes".
export function resolveScheduleBInfo(inputs: ResolverInputs): ScheduleBFilingInfo {
  const k1Interest = receivedOnReturn(inputs, "interest_list");
  const k1Dividends = receivedOnReturn(inputs, "dividend_list");
  const interestPayers = [
    ...payerAmounts(inputs, isInterestFactKey, (value) => sum(value.box1, value.box3)),
    ...k1PayerRows(k1Interest),
  ];
  const dividendPayers = scheduleBDividendPayers(inputs, k1Dividends);
  // The explicit decision wins; with none, a Form 8938 account fact answers Yes.
  const foreignAccountFacts = foreignAccountFactsOf(inputs);
  const hasForeignFinancialAccount =
    boolDecision(inputs, "decisions.scope.has_foreign_financial_account") ??
    (foreignAccountFacts === undefined ? undefined : true);
  const hasForeignTrust = boolDecision(inputs, "decisions.scope.has_foreign_trust");
  const partIII = {
    "decisions.scope.has_foreign_financial_account": hasForeignFinancialAccount,
    "decisions.scope.has_foreign_trust": hasForeignTrust,
  };
  const rounding = inputs.decisionByKey.get("decisions.rounding.schedule_b");
  const interest = sum(...interestPayers.map((interestPayer) => interestPayer.amount));
  const dividends = sum(...dividendPayers.map((dividendPayer) => dividendPayer.amount));
  const bondExclusion = savingsBondExclusionScope(inputs);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_b",
    fallbacks: [
      {
        rule: `fallback: interest $${interest} or dividends $${dividends} > $1,500, or a Part III "Yes"`,
        value:
          interest > 1500 ||
          dividends > 1500 ||
          hasForeignFinancialAccount === true ||
          hasForeignTrust === true,
      },
      // Line 3 takes Form 8815 line 14 (irs-8815-form-2025::sec::omb-no-1545-0074::b03).
      {
        rule: "fallback: Form 8815 files (the savings bond interest exclusion, line 3)",
        value: filesForm8815(bondExclusion),
        triggeredByFactKeys: bondExclusion.resolution.derivation?.triggeredByFactKeys ?? [],
      },
    ],
  });
  return {
    mustFile: { "schedule-b": resolution },
    missingInputs: { "schedule-b": missingInputs(partIII) },
    interestPayers,
    rounding: rounding === "sum_rounded_rows" ? "sum_rounded_rows" : "round_total",
    dividendPayers,
    hasForeignFinancialAccount,
    foreignAccountFacts,
    hasForeignTrust,
    savingsBondExclusionGap: bondExclusion.exclusion.line9Gap,
    passThroughInterest: k1Interest,
    passThroughDividends: k1Dividends,
  };
}

function payerAmounts(
  inputs: ResolverInputs,
  isKind: (key: string) => boolean,
  amountOf: (v: Record<string, unknown>) => number,
): PayerAmount[] {
  return factsInCategory(inputs, "investment_income")
    .filter((row) => isKind(row.key))
    .map((row) => {
      const value = row.value as Record<string, unknown>;
      return { payerName: String(value.payerName ?? ""), amount: amountOf(value) };
    })
    .filter((payer) => payer.amount !== 0);
}

function boolDecision(inputs: ResolverInputs, key: string): boolean | undefined {
  const value = inputs.decisionByKey.get(key);
  return typeof value === "boolean" ? value : undefined;
}
