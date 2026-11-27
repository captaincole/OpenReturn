/*
 * Form 540NR takes many lines exactly as Form 540 figures them: the header,
 * the exemptions, lines 13 to 19, the tax on line 19, and the refund lines.
 * The rule is Form 540's (state/ca/540/), not a copy: fromForm540 runs the
 * Form 540 method with a form accessor that reads each Form 540 line from the
 * Form 540NR line that holds the same amount (issue #336, point 3).
 *
 * A read the map does not name is an error, not a blank: a Form 540 method
 * that starts to read a new line must get its Form 540NR line here, or the
 * field shows the error instead of a wrong amount.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import type { Form540FilingInfo } from "../540/filingInfo.js";
import type { Form540 } from "../540/types.js";
import type { Form540NRLine } from "./form540NRBinding.js";
import type { Form540NR } from "./types.js";

/* The Form 540 line, and the Form 540NR line that holds the same amount; null when Form 540NR has none. */
const FORM_540_TO_540NR: Readonly<Record<string, string | null>> = {
  "line.7_personal_exemption_count": "0.line.7_personal_exemption_count",
  "line.7_personal_exemption_amount": "0.line.7_personal_exemption_amount",
  "line.8_blind_exemption_count": "0.line.8_blind_exemption_count",
  "line.8_blind_exemption_amount": "0.line.8_blind_exemption_amount",
  "line.9_senior_exemption_count": "0.line.9_senior_exemption_count",
  "line.9_senior_exemption_amount": "0.line.9_senior_exemption_amount",
  "line.10_dependent_exemption_count": "0.line.10_dependent_exemption_count",
  "line.10_dependent_exemption_amount": "0.line.10_dependent_exemption_amount",
  "line.11_total_exemption_amount": "1.line.11_total_exemption_amount",
  "line.13_federal_agi": "1.line.13_federal_agi",
  "line.14_ca_adjustments_subtractions": "1.line.14_ca_adjustments_subtractions",
  "line.15_ca_agi_before_additions": "1.line.15_agi_before_additions",
  "line.16_ca_adjustments_additions": "1.line.16_ca_adjustments_additions",
  "line.17_ca_agi": "1.line.17_agi_all_sources",
  "line.18_deductions": "1.line.18_deductions",
  "line.19_taxable_income": "1.line.19_total_taxable_income",
  "line.64_total_tax": "2.line.74_total_tax",
  // Form 540 line 93 is payments less use tax; Form 540NR has no use tax line.
  "line.95_payments_after_isr_penalty": "2.line.92_payments_after_isr_penalty",
  "line.94_use_tax_balance": null,
  "line.96_isr_penalty_balance": "2.line.93_isr_penalty_balance",
  "line.97_overpaid_tax": "2.line.101_overpaid_tax",
  "line.98_applied_to_2026_estimated_tax": "2.line.102_applied_to_2026_estimated_tax",
  "line.99_overpaid_tax_available": "2.line.103_overpaid_tax_available",
  "line.100_tax_due": "3.line.104_tax_due",
  "line.110_total_contributions": "3.line.120_total_contributions",
  "line.112_interest_and_late_penalties": "4.line.122_interest_and_late_penalties",
  "line.113_underpayment_estimated_tax": "4.line.123_underpayment_estimated_tax",
  "schedule-ca.3.line.c27_subtractions": "schedule-ca-540nr.3.line.c27_subtractions",
  "schedule-ca.3.line.c27_additions": "schedule-ca-540nr.3.line.c27_additions",
};

/* A read of another form that Form 540NR does not have: Form 540 itself, or Schedule CA (540). */
const isForm540Read = (key: string) =>
  key.startsWith("form-540.") || key.startsWith("schedule-ca.");
const isCrossFormRead = (key: string) => key.startsWith("form-") || key.startsWith("schedule-");

/* The Form 540NR accessor, seen as Form 540's. */
export function asForm540(form: FormAccessor<Form540NR>): FormAccessor<Form540> {
  return new Proxy({} as FormAccessor<Form540>, {
    get(_target, key) {
      if (typeof key !== "string") return undefined;
      if (key in FORM_540_TO_540NR) {
        const line = FORM_540_TO_540NR[key];
        return line === null ? undefined : form[line];
      }
      if (isCrossFormRead(key) && !isForm540Read(key)) return form[key];
      throw new Error(`Form 540NR has no line mapped for the Form 540 read "${key}".`);
    },
  });
}

type Form540Method<K extends keyof Form540> = BindingFn<Form540, Form540FilingInfo, K>;

/* The Form 540 method of line `K540`, as the binding of Form 540NR line `K`. */
export function fromForm540<K extends keyof Form540NR, K540 extends keyof Form540>(
  method: Form540Method<K540>,
): Form540NRLine<K> {
  return (form, info) => method(asForm540(form), info) as ReturnType<Form540NRLine<K>>;
}
