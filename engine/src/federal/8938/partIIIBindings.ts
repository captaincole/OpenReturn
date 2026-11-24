/*
 * Part III, lines 13 and 14 (irs-8938-inst-2025::sec::part-iii::b01): for each
 * tax item, (c) the amount reported, (d) the form and line, (e) the schedule
 * and line. A row with no amount stays blank.
 */

import type { BindingFn } from "../../defineForm.js";
import { roundDollars } from "../../money.js";
import { unsupported } from "../../types.js";
import { isGap } from "../1116/copies.js";
import { foreignTaxCredit } from "../1116/credit.js";
import type { Accessor } from "../1116/returnAmounts.js";
import type { Form8938FilingInfo } from "./filingInfo.js";
import type { CategoryItems, TaxItem } from "./partIII.js";
import type { Form8938 } from "./types.js";

type Fn = BindingFn<Form8938, Form8938FilingInfo, keyof Form8938>;

/* Where each item is on the return: Form 1040's line, and the schedule's line when that schedule files. */
interface Where {
  form: string;
  schedule?: { formId: string; text: (category: CategoryItems) => string };
}

/* Schedule D's lines in the order they print. */
const SCHEDULE_D_ORDER = ["1b", "2", "3", "8b", "9", "10", "13"];

function scheduleDLines(category: CategoryItems): string {
  const lines = SCHEDULE_D_ORDER.filter((line) => category.scheduleDLines.includes(line));
  return lines.length === 1
    ? `Schedule D, line ${lines[0]}`
    : `Schedule D, lines ${lines.join(", ")}`;
}

/*
 * Interest: Form 1040 line 2b and Schedule B line 1; dividends: line 3b and
 * Schedule B line 5; other income: line 8 from Schedule 1 line 8z; gains:
 * line 7a from Schedule D (irs-1040-inst-2025::sec::line-7b::b01, "the total
 * on line 7a"); deductions (the early withdrawal penalty): line 10
 * from Schedule 1 line 18; credits (the foreign tax credit): line 20 from
 * Schedule 3 line 1. Royalties have no route in the engine (partIII.ts).
 */
const WHERE: Record<TaxItem, Where> = {
  interest: {
    form: "Form 1040, line 2b",
    schedule: { formId: "schedule-b", text: () => "Schedule B, line 1" },
  },
  dividends: {
    form: "Form 1040, line 3b",
    schedule: { formId: "schedule-b", text: () => "Schedule B, line 5" },
  },
  royalties: { form: "Form 1040, line 8" },
  otherIncome: {
    form: "Form 1040, line 8",
    schedule: { formId: "schedule-1", text: () => "Schedule 1, line 8z" },
  },
  gains: { form: "Form 1040, line 7a", schedule: { formId: "schedule-d", text: scheduleDLines } },
  deductions: {
    form: "Form 1040, line 10",
    schedule: { formId: "schedule-1", text: () => "Schedule 1, line 18" },
  },
  credits: {
    form: "Form 1040, line 20",
    schedule: { formId: "schedule-3", text: () => "Schedule 3, line 1" },
  },
};

const LETTERS: Record<TaxItem, string> = {
  interest: "a",
  dividends: "b",
  royalties: "c",
  otherIncome: "d",
  gains: "e",
  deductions: "f",
  credits: "g",
};

const CATEGORIES = [
  { line: "13", prefix: "accounts", pick: (info: Form8938FilingInfo) => info.form8938?.accounts },
  {
    line: "14",
    prefix: "other_assets",
    pick: (info: Form8938FilingInfo) => info.form8938?.otherAssets,
  },
] as const;

const SUFFIX: Record<TaxItem, string> = {
  interest: "interest",
  dividends: "dividends",
  royalties: "royalties",
  otherIncome: "other_income",
  gains: "gains_losses",
  deductions: "deductions",
  credits: "credits",
};

/*
 * Column (c): the category's total, whole dollars. Credits print only when
 * Schedule 3 line 1 claims the foreign tax credit; a gap there is a gap here.
 */
function amountOf(
  form: Accessor,
  info: Form8938FilingInfo,
  category: CategoryItems,
  item: TaxItem,
) {
  const gap = category.gaps[item];
  if (gap !== undefined) return unsupported(gap);
  if (item === "gains" && category.gainsWait) return undefined;
  const total = category.totals[item];
  if (total === undefined) return undefined;
  if (item === "credits") {
    const credit = foreignTaxCredit(form, info);
    if (isGap(credit))
      return unsupported(`Schedule 3 line 1 (the foreign tax credit): ${credit.reason}`);
    if (typeof credit !== "number" || credit <= 0) return undefined;
  }
  return roundDollars(total);
}

function itemBindings(
  line: string,
  prefix: string,
  pick: (info: Form8938FilingInfo) => CategoryItems | undefined,
  item: TaxItem,
): Record<string, Fn> {
  const base = `0.line.${line}${LETTERS[item]}_${prefix}_${SUFFIX[item]}`;
  const amount: Fn = (form, info) => {
    const category = pick(info);
    return category === undefined ? undefined : amountOf(form, info, category, item);
  };
  const where = WHERE[item];
  return {
    [`${base}_col_c`]: amount,
    [`${base}_col_d`]: (form) =>
      typeof form[`${base}_col_c` as keyof Form8938] === "number" ? where.form : undefined,
    [`${base}_col_e`]: (form, info) => {
      const category = pick(info);
      const { schedule } = where;
      if (category === undefined || schedule === undefined) return undefined;
      if (typeof form[`${base}_col_c` as keyof Form8938] !== "number") return undefined;
      return info.mustFile?.[schedule.formId]?.value === true ? schedule.text(category) : undefined;
    },
  };
}

export function partIIIBindings(): Record<string, Fn> {
  const items = Object.keys(LETTERS) as TaxItem[];
  return Object.assign(
    {},
    ...CATEGORIES.flatMap(({ line, prefix, pick }) =>
      items.map((item) => itemBindings(line, prefix, pick, item)),
    ),
  );
}
