/*
 * One Form 8828 for each sold home that files ("figure the actual recapture tax
 * separately", irs-8828-inst-2025::sec::special-rules::b02). Copy n prints the
 * nth home; Schedule 2 line 17b adds every copy's line 23. The golden run checks
 * copy 0 only; this file checks the later copies. A made-up second home on the
 * synthetic melaine return: given to a relative, so line 9 is its fair market
 * value (special-rules::b01) and no gain is in her income.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { loadFromFixtures, type Catalog } from "../../../../src/catalog.js";
import { evaluateForm, type EvaluateFormSharedState } from "../../../../src/engine.js";
import {
  makeMortgageSubsidyNoticeKey,
  makeMortgageSubsidySaleKey,
  type MortgageSubsidyNoticeFactValue,
  type MortgageSubsidySaleFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { getFormSpec } from "../../../../src/registry.js";
import { catalogPath } from "../../../helpers/formPaths.js";
import { melaineScenario as base } from "../../../scenarios/synthetic/melaine/index.js";

const spec = getFormSpec("form-8828");
let catalog: Catalog;

beforeAll(async () => {
  spec.register?.();
  catalog = await loadFromFixtures([catalogPath(spec)]);
});

const noticeTemplate = base.facts.find((fact) => fact.key.endsWith(".notice"))!;
const saleTemplate = base.facts.find((fact) => fact.key.endsWith(".sale"))!;

const SECOND_NOTICE: Partial<MortgageSubsidyNoticeFactValue> = {
  loanClosingDate: "2021-03-01",
  federallySubsidizedAmount: 10000,
};

/* Given away on 02/15/2025 at a fair market value of $200,000; the loan was not repaid. */
const SECOND_SALE: Partial<MortgageSubsidySaleFactValue> = {
  propertyAddress: "38 Cedar Elm Court, Georgetown, TX 78626",
  dispositionDate: "2025-02-15",
  fullRepaymentDate: undefined,
  salesPrice: 200000,
  expensesOfSale: 0,
  adjustedBasis: 170000,
  gainIncludedInIncome: 0,
};

function second(
  /* null: the notice has not come yet. */
  notice: Partial<MortgageSubsidyNoticeFactValue> | null = SECOND_NOTICE,
  sale: Partial<MortgageSubsidySaleFactValue> = SECOND_SALE,
): TaxFactRow[] {
  const saleRow: TaxFactRow = {
    ...saleTemplate,
    id: "f-sale-second",
    key: makeMortgageSubsidySaleKey("cedar-elm"),
    value: { ...(saleTemplate.value as MortgageSubsidySaleFactValue), ...sale },
  };
  if (notice === null) return [saleRow];
  const noticeRow: TaxFactRow = {
    ...noticeTemplate,
    id: "f-notice-second",
    key: makeMortgageSubsidyNoticeKey("cedar-elm"),
    value: { ...(noticeTemplate.value as MortgageSubsidyNoticeFactValue), ...notice },
  };
  return [noticeRow, saleRow];
}

function evaluate(extra: TaxFactRow[]) {
  return evaluateScenario({
    filing: { id: "form-8828-copies", taxYear: base.taxYear },
    facts: [...base.facts, ...extra],
    decisions: base.decisions,
    authEmail: null,
  });
}

/* Each copy's field values, evaluated as renderCopies does: the other forms' settled lines are shared. */
function copies(extra: TaxFactRow[]) {
  const result = evaluate(extra);
  const shared: EvaluateFormSharedState = {
    fieldResults: new Map(),
    formMustFiles: new Map(),
    settling: true,
  };
  for (const [formId, form] of result.forms) {
    shared.formMustFiles.set(formId, form.mustFile);
    if (formId === spec.formId) continue;
    for (const field of form.fields) shared.fieldResults.set(field.fieldId, field.result);
  }
  const count = spec.copies?.count(result.filingInfo) ?? 1;
  const values = Array.from({ length: count }, (_, index) => {
    const ctx = { ...result.ctx, filingInfo: spec.copies?.select(result.filingInfo, index) };
    const form = evaluateForm(spec.formId, ctx, catalog, shared);
    return (id: string) => {
      const found = form.fields.find((field) => field.fieldId === `form-8828.${id}`)?.result;
      return found?.ok ? found.value : undefined;
    };
  });
  return { result, count, values };
}

const scheduleTwo = (result: ReturnType<typeof evaluate>, id: string) => {
  const found = result.forms
    .get("schedule-2")
    ?.fields.find((field) => field.fieldId === `schedule-2.${id}`)?.result;
  // A value, the unsupported result itself, or undefined for a blank line.
  if (found?.ok) return found.value;
  return found !== undefined && "unsupported" in found && found.unsupported ? found : undefined;
};

const LINE_17B = "1.line.17b_recapture_federal_mortgage_subsidy";

describe("Form 8828 copies", () => {
  it("prints one copy for each home, the second home on copy 2", () => {
    const { count, values } = copies(second());
    expect(count).toBe(2);
    const [first, later] = values;
    expect(first!("0.line.23_recapture_tax")).toBe(6962);
    expect(later!("0.line.1_property_address")).toBe("38 Cedar Elm Court, Georgetown, TX 78626");
    // 03/01/2021 to 02/15/2025: 3 years 11 full months, the table's line 4.
    expect([
      later!("0.line.7_holding_period_years"),
      later!("0.line.7_holding_period_full_months"),
    ]).toEqual([3, 11]);
    expect(later!("0.line.8_full_repayment_date_year")).toBeUndefined();
    // 200,000 − 0 − 170,000 = 30,000; half is 15,000.
    expect([later!("0.line.13_gain_or_loss"), later!("0.line.14_half_of_gain")]).toEqual([
      30000, 15000,
    ]);
    // 68,150 − 59,155 = 8,995: $5,000 or more, so 100%.
    expect([
      later!("0.line.16_adjusted_qualifying_income"),
      later!("0.line.18_income_percentage"),
    ]).toEqual([59155, "100"]);
    // 10,000 × 80% = 8,000; the smaller of 15,000 and 8,000.
    expect([
      later!("0.line.20_holding_period_percentage"),
      later!("0.line.23_recapture_tax"),
    ]).toEqual(["80", 8000]);
  });

  it("adds every copy's line 23 on Schedule 2 line 17b", () => {
    const { result } = copies(second());
    expect(scheduleTwo(result, LINE_17B)).toBe(6962 + 8000);
    expect(scheduleTwo(result, "1.line.21_total_other_taxes")).toBe(14962);
  });

  it("a copy that stops at a loss adds nothing", () => {
    const { result, values } = copies(
      second(SECOND_NOTICE, { ...SECOND_SALE, adjustedBasis: 250000 }),
    );
    expect(values[1]!("0.line.13_gain_or_loss")).toBe(-50000);
    expect(scheduleTwo(result, LINE_17B)).toBe(6962);
  });

  it("waits for the second home's notice", () => {
    const { result, count } = copies(second(null));
    expect(count).toBe(2);
    expect(scheduleTwo(result, LINE_17B)).toBeUndefined();
    expect(pendingInputs(result).pendingFacts).toContain(makeMortgageSubsidyNoticeKey("cedar-elm"));
  });

  it("a gap on one copy makes line 17b unsupported", () => {
    const { result } = copies(second(SECOND_NOTICE, { ...SECOND_SALE, qsmlShareOfGain: 5000 }));
    expect(scheduleTwo(result, LINE_17B)).toMatchObject({ ok: false, unsupported: true });
  });

  it("a second home sold after the 9 years files no copy", () => {
    const { count, result } = copies(second({ ...SECOND_NOTICE, loanClosingDate: "2015-01-10" }));
    expect(count).toBe(1);
    expect(scheduleTwo(result, LINE_17B)).toBe(6962);
  });
});
