/*
 * Where Form 4136's credit goes: line 17 "Enter here and on Schedule 3 (Form
 * 1040), line 12" (irs-4136-face-2025::sec::face-part-ii-4::b01;
 * irs-1040-inst-2025::sec::line-12-3::b01). The credit is refundable: Schedule
 * 3 line 15 adds it to Form 1040 line 31.
 *
 * DECISION (2026-11-26, by the author): the cents. Form 1040 instructions: "You
 * can round off cents to whole dollars on your return and schedules. If you do
 * round to whole dollars, you must round all amounts"
 * (irs-1040-inst-2025::sec::rounding-off-to-whole::b01). Form 4136 prints a
 * cents box in columns (d) and (e) and on line 17, and its example keeps them:
 * "7,391 GGE x $0.109 = $805.62 claim amount"
 * (irs-4136-inst-2025::sec::line-11::b02). The engine keeps the cents on Form
 * 4136, the form's own boxes and example, and rounds line 17 to the nearest
 * dollar on Schedule 3 line 12, which has no cents box, as every other line of
 * the return. Under $1 changes.
 *
 * DECISION (2026-11-26, by the author): the income tax side. "Include any
 * credit or refund of excise taxes on fuels in your gross income if you claimed
 * the total cost of the fuel (including the excise taxes) as an expense
 * deduction" (irs-4136-inst-2025::sec::including-the-ftc-in-income::b01). The
 * Schedule C line 6 and Schedule F line 8 instructions name the credit
 * "claimed on your 2024 Form 1040" or "2024 Schedule 3" as 2025 income
 * (irs-1040sc-inst-2025::sec::line-6::b01, irs-1040sf-inst-2025::sec::line-8::b01).
 * Pub. 225's cash-method example reports the 2025 credit on the 2025 Schedule F
 * (irs-pub-225-2025::sec::including-the-credit-or::b01). The engine follows the
 * schedules' own instructions: this year's credit is next year's income, and it
 * adds nothing from this Form 4136 to this year's income. Last year's credit is
 * in the business's stated other income (BusinessFactValue.otherIncome,
 * FarmFactValue.otherIncome), which Cade asks for. The year the credit is taxed
 * changes ($110 in the Pub. 225 example).
 *
 * DECISION (2026-11-26, by the author): the same question for a business or
 * farm on the accrual method. The schedules name last year's credit
 * (irs-1040sc-inst-2025::sec::line-6::b01; Schedule F line 43: "See Line 8,
 * earlier", irs-1040sf-inst-2025::sec::line-43::b01). Pub. 225: "If you use an
 * accrual method, include the amount of credit or refund in gross income for
 * the tax year in which you used the fuels"; its example reports the 2025
 * credit of $155 on the 2025 Schedule F
 * (irs-pub-225-2025::sec::including-the-credit-or::b02). The engine follows
 * Pub. 225 for the accrual method, a rule written for that group: this year's
 * credit is this year's income. The engine does not add an amount from another
 * form to the business's income, so Schedule C line 6 or Schedule F line 43 of
 * that business is unsupported (accrualCreditGap); a cash-method business
 * keeps the decision above.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form4136FilingInfo } from "./filingInfo.js";
import { schedule3Line12 } from "./lines.js";

type Received = { value: number | Unsupported | undefined } | undefined;

const ACCRUAL_CREDIT_INCOME =
  "This business uses the accrual method and claims the fuel tax credit on this year's Form 4136: the credit is income of the year the fuel was used (irs-pub-225-2025::sec::including-the-credit-or::b02), and the engine does not add it to this line or to the lines that total it.";

/*
 * The other-income line of an accrual-method business or farm that a Form 4136
 * claim names (the DECISION above): the reason it is unsupported, or undefined.
 */
export function accrualCreditGap(
  info: BaseFilingInfo,
  businessKey: string | undefined,
): Unsupported | undefined {
  const keys = (info as Form4136FilingInfo).form4136AccrualBusinessKeys;
  return businessKey !== undefined && keys?.includes(businessKey)
    ? unsupported(ACCRUAL_CREDIT_INCOME)
    : undefined;
}

/*
 * Schedule 3 line 12: line 17 in whole dollars, or the gap that holds it.
 * Undefined when Form 4136 does not file, so Schedule 3 keeps its old reason;
 * blank while line 17 waits for a registration number.
 */
export function line12From4136(info: BaseFilingInfo): Received {
  const own = info as Form4136FilingInfo;
  if (own.mustFile?.["form-4136"]?.value !== true) return undefined;
  if (own.form4136Gap !== undefined) return { value: unsupported(own.form4136Gap) };
  const result = own.form4136;
  if (result === undefined || result.missingRegistration || result.line17 === undefined) {
    return { value: undefined };
  }
  return { value: schedule3Line12(result.line17) };
}
