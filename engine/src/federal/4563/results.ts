/*
 * What Form 4563 sends to other forms, for every copy of it. Line 15 is the
 * amount the MAGI lines add back: Schedule 1-A line 2d, Schedule 8812 line 2c,
 * Form 8936 line 1e, Form 8863 lines 3 and 14, Form 8839 lines 7 and 25, Form
 * 8815 line 9, Form 8880 line 8, the Pub. 970 student loan interest worksheet line 8 and the
 * Pub. 915 social security worksheet line 5 (the Schedule A SALT worksheet's
 * line 3d waits for shared Schedule A lines, receivers.ts). The engine
 * evaluates only the first copy, so each total is figured
 * here from every person's lines, as Form 2555's are.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import { sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form4563FilingInfo } from "./filingInfo.js";
import { hasExcludedIncome } from "./lines.js";

export const files4563 = (info: BaseFilingInfo): boolean =>
  info.mustFile?.["form-4563"]?.value === true;

/* Every person's form, or undefined without the form or while an answer the form needs is missing. */
function settledFilers(info: Form4563FilingInfo) {
  if (!files4563(info)) return undefined;
  if ((info.missingInputs?.["form-4563"] ?? []).length > 0) return undefined;
  return info.form4563Filers ?? [];
}

/* Line 15 of every Form 4563; undefined without the form or while it waits. */
export function form4563Line15Total(info: Form4563FilingInfo): number | undefined {
  const filers = settledFilers(info);
  return filers === undefined ? undefined : sum(...filers.map((filer) => filer.lines.line15));
}

/*
 * A MAGI line that adds Form 4563 line 15 to an amount: the amount itself
 * without the form, the sum with it, undefined while the form waits.
 */
export function withForm4563Line15(
  amount: number | undefined,
  info: Form4563FilingInfo,
): number | undefined {
  if (amount === undefined || !files4563(info)) return amount;
  const line15 = form4563Line15Total(info);
  return line15 === undefined ? undefined : sum(amount, line15);
}

/* The excluded income's gross income, every copy (lines.ts excludedGrossIncome); 0 without the form. */
export function excludedGrossIncomeTotal(info: Form4563FilingInfo): number {
  return sum(...(settledFilers(info) ?? []).map((filer) => filer.excludedGrossIncome));
}

/* Some person excludes income: the deductions that are not definitely related are shared. */
export function excludesIncome(info: Form4563FilingInfo): boolean {
  return (settledFilers(info) ?? []).some((filer) => hasExcludedIncome(filer.lines));
}

const NONRESIDENT_ALIEN =
  "A bona fide resident of American Samoa who is not a U.S. citizen or resident is not allowed the standard deduction, and certain other deductions and credits (irs-4563-form-2025::sec::filing-form-1040-or-1040-sr::b02; Pub. 570, chapter 3, Nonresident alien); the engine does not figure that return.";

/* A filer who is a nonresident alien of the United States: a gap on the deduction lines. */
export function nonresidentAlienGap(info: Form4563FilingInfo): Unsupported | undefined {
  const filers = settledFilers(info) ?? [];
  return filers.some((filer) => !filer.answers.usCitizenOrResident)
    ? unsupported(NONRESIDENT_ALIEN)
    : undefined;
}
