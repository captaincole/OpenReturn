/*
 * MANUAL EDIT: Schedule CA (540) line 8z column C for a trust's accumulation
 * distribution:
 * - FTB 5870A Part II: "Divide line 1 by six. Enter here and on Schedules CA
 *   (540), Part I, Section B, line 8z, column C" (Section A line 2; Section B
 *   line 4 likewise) (ca-5870a-inst-2025::sec::section-a::b01, ::section-b::b01);
 * - a trust that did not file Form 541 or pay the California tax on a
 *   noncontingent beneficiary's share: "The entire trust accumulation income ...
 *   should be reported on Schedule CA (540), Part I, Section B, line 8z, column
 *   C" (ca-5870a-inst-2025::sec::purpose::b02).
 * The other line 8z items keep their rules (childIncome.ts,
 * excessBusinessLoss.ts); line 9a column C adds the rows.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { numberOrBlank, sumOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Info as Form3461Info } from "../3461/figures.js";
import { isUnsupportedResult } from "../3801/context.js";
import { childIncomeBindings, OTHER_INCOME_ADDITIONS } from "./childIncome.js";
import { excessBusinessLossBindings } from "./excessBusinessLoss.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Info = ScheduleCaFilingInfo & Form3461Info;
type Bindings = Partial<{ [K in keyof ScheduleCa]: BindingFn<ScheduleCa, Info, K> }>;
type Form = FormAccessor<ScheduleCa>;

/* "Identify the type of income reported in the space provided" (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b05). */
const TRUST_LABEL = "Trust accumulation distribution";

/* The trust amount, its gap, "waits", or undefined when no trust amount applies. */
function trustAmount(info: ScheduleCaFilingInfo): number | Unsupported | "waits" | undefined {
  const carried = info.form5870AScheduleCaAddition;
  if (carried === undefined || carried === "waits") return carried;
  return "gap" in carried ? unsupported(carried.gap) : carried.amount;
}

/*
 * Line 8z column C: the child's amount plus the trust amount. With no child's
 * amount and no other line 8z item, the trust amount alone.
 */
function line8zColumnC(form: Form, info: Info) {
  const base = childIncomeBindings["1.line.b8z_additions"]!(form, info);
  const trust = trustAmount(info);
  if (trust === undefined) return base;
  if (trust === "waits") return undefined;
  if (isUnsupportedResult(trust)) return trust;
  if (typeof base === "number") return base + trust;
  if (base === undefined) return undefined;
  const alone = info.childIncomeLine8z === undefined && !numberOrBlank(form["1.line.b8z_federal"]);
  return alone ? trust : base;
}

const hasTrustAmount = (info: Info) => typeof trustAmount(info) === "number";

export const trustDistributionBindings: Bindings = {
  "1.line.b8z_additions": line8zColumnC,
  "1.line.b8z_income_type": (form, info) => {
    const base = excessBusinessLossBindings["1.line.b8z_income_type"]!(form, info);
    if (!hasTrustAmount(info)) return base;
    return typeof base === "string" ? `${base}, ${TRUST_LABEL}` : TRUST_LABEL;
  },
  // Line 9a column C: with a trust amount, the column's rows added (a gap row counts 0, as in excessBusinessLoss.ts).
  "2.line.b9a_additions": (form, info) => {
    const base = excessBusinessLossBindings["2.line.b9a_additions"]!(form, info);
    if (!hasTrustAmount(info)) return base;
    return sumOrBlank(...OTHER_INCOME_ADDITIONS.map((id) => form[id]));
  },
};
