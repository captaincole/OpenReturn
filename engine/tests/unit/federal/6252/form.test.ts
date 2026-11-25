/*
 * Form 6252 on a whole return: who files, the copies, the gaps and waits,
 * Part III's questions, the lines it sends on (Form 4797 lines 4, 10 and 15,
 * Schedule D lines 4, 11 and 19), and "no facts, nothing changes". The
 * synthetic bain and chiad scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeInstallmentSaleFactKey,
  type InstallmentSaleFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { duplex, pasture, trailer } from "../../../scenarios/synthetic/bain/facts.js";
import { bainScenario as base } from "../../../scenarios/synthetic/bain/index.js";
import { chiadScenario } from "../../../scenarios/synthetic/chiad/index.js";

const isInstallmentFact = (fact: TaxFactRow) => fact.key.startsWith("installment_sale.");
const otherFacts = base.facts.filter((fact) => !isInstallmentFact(fact));
const template = base.facts.find(isInstallmentFact)!;

const sale = (slug: string, value: InstallmentSaleFactValue): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeInstallmentSaleFactKey(slug),
  value,
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(
  installments: TaxFactRow[],
  extraDecisions: AIDecisionRow[] = [],
  facts = otherFacts,
) {
  const result = evaluateScenario({
    filing: { id: "form-6252-test", taxYear: base.taxYear },
    facts: [...facts, ...installments],
    decisions: [...base.decisions, ...extraDecisions],
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const gap = (formId: string, id: string) => {
    const found = field(formId, id);
    return found !== undefined && !found.ok && "unsupported" in found && found.unsupported === true;
  };
  return { result, files, field, value, gap, pending: pendingInputs(result) };
}

const LINE = {
  l12: "0.line.12_income_recapture_form_4797",
  l15: "0.line.15_excluded_gain_main_home",
  l19: "0.line.19_gross_profit_percentage",
  l23: "0.line.23_payments_received_prior_years",
  l24: "0.line.24_installment_sale_income",
  l26: "0.line.26_income_less_recapture",
  l28yes: "0.line.28_related_party_resold_yes",
  l28no: "0.line.28_related_party_resold_no",
  l29a: "0.line.29a_second_disposition_after_2_years",
  l29aDate: "0.line.29a_date_of_disposition",
  l29e: "0.line.29e_no_tax_avoidance_purpose",
  l27: "0.line.27_related_party_row1",
  l35: "0.line.35_related_party_sale_income",
  l5: "0.line.5_selling_price",
} as const;
const F4797_LINE_4 = "0.line.4_section_1231_gain_installment_sales";
const F4797_LINE_17 = "0.line.17_ordinary_gain_loss_total";
const SCHEDULE_D_LINE_4 = "0.line.4_short_term_gain_other_forms";
const SCHEDULE_D_LINE_11 = "0.line.11_long_term_gain_other_forms";

describe("Form 6252 who files", () => {
  it("files for an installment sale fact, one copy per sale", () => {
    const run = evaluate(base.facts.filter(isInstallmentFact));
    expect([run.files("form-6252"), run.files("form-4797"), run.files("schedule-d")]).toEqual([
      true,
      true,
      true,
    ]);
    expect(run.result.filingInfo.form6252Totals?.forms).toHaveLength(3);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(
      [sale("duplex", duplex)],
      [decision("decisions.scope.must_file_6252", false)],
    );
    expect(run.files("form-6252")).toBe(false);
  });

  it("no installment fact: the form does not file, and neither do Form 4797 and Schedule D", () => {
    const run = evaluate([]);
    expect([run.files("form-6252"), run.files("form-4797"), run.files("schedule-d")]).toEqual([
      false,
      false,
      false,
    ]);
    expect(run.value("form-1040", "line.7a")).toBeUndefined();
    expect(run.value("form-1040", "line.1a")).toBe(84000);
  });

  it("the decision with no fact makes the lines a gap", () => {
    const run = evaluate([], [decision("decisions.scope.must_file_6252", true)]);
    expect(run.files("form-6252")).toBe(true);
    expect(run.gap("form-6252", LINE.l5)).toBe(true);
  });

  it("a capital asset files Schedule D, not Form 4797 (chiad)", () => {
    const run = evaluate([], [], chiadScenario.facts);
    expect([run.files("schedule-d"), run.files("form-4797")]).toEqual([true, false]);
    expect(run.value("schedule-d", SCHEDULE_D_LINE_4)).toBe(8499);
    expect(run.value("schedule-d", SCHEDULE_D_LINE_11)).toBe(158928);
  });
});

describe("Form 6252 gaps and waits", () => {
  it("a 2025 sale with depreciation: line 12 needs Form 4797 Part III, so lines 12–26 and Form 4797 line 4 are a gap", () => {
    const run = evaluate([
      sale("duplex", { ...duplex, dateSold: "2025-03-01", relatedParty: undefined }),
    ]);
    expect(run.value("form-6252", "0.line.11_commissions_expenses_of_sale")).toBe(28800);
    expect([run.gap("form-6252", LINE.l12), run.gap("form-6252", LINE.l26)]).toEqual([true, true]);
    expect([run.gap("form-4797", F4797_LINE_4), run.gap("form-4797", F4797_LINE_17)]).toEqual([
      true,
      true,
    ]);
  });

  it("a 2025 sale with no depreciation: line 12 is 0 and the form is figured", () => {
    const land = { ...pasture, dateSold: "2025-06-01", paymentsPriorYears: undefined };
    const run = evaluate([sale("land", { ...land, remainingRecapture: undefined })]);
    expect(run.value("form-6252", LINE.l12)).toBe(0);
    expect(run.value("form-6252", LINE.l23)).toBeUndefined();
    expect(run.value("form-6252", LINE.l24)).toBe(9000);
  });

  it("a later year without the prior payments waits, and the sale is asked again", () => {
    const run = evaluate([sale("trailer", { ...trailer, paymentsPriorYears: undefined })]);
    expect(run.value("form-6252", LINE.l23)).toBeUndefined();
    expect(run.gap("form-6252", LINE.l23)).toBe(false);
    expect(run.value("form-6252", LINE.l19)).toBe("0.1800");
    expect(run.pending.pendingFacts).toContain(makeInstallmentSaleFactKey("trailer"));
    expect(run.value("form-4797", F4797_LINE_17)).toBeUndefined();
  });

  it("a later year with depreciation and no line 12 answer waits from line 12", () => {
    const run = evaluate([sale("trailer", { ...trailer, recaptureIncome: undefined })]);
    expect(run.value("form-6252", LINE.l12)).toBeUndefined();
    expect(run.value("form-6252", "0.line.11_commissions_expenses_of_sale")).toBe(1500);
  });

  it("line 14 zero or less: lines 15 on are a gap (line-14::b01)", () => {
    const run = evaluate([sale("loss", { ...trailer, sellingPrice: 50000 })]);
    expect(run.value("form-6252", "0.line.14_price_less_line_13")).toBe(-11500);
    expect(run.gap("form-6252", LINE.l15)).toBe(true);
  });

  it("a contingent payment sale with no stated maximum is a gap from line 5 (line-5::b01)", () => {
    const run = evaluate([
      sale("earnout", { ...trailer, sellingPriceDeterminable: false, sellingPrice: undefined }),
    ]);
    expect(run.gap("form-6252", LINE.l5)).toBe(true);
    expect(run.value("form-6252", "0.line.4_selling_price_determinable_no")).toBe(true);
  });

  it("an excluded gain over the maximum exclusion is a gap from line 15", () => {
    const home = chiadScenario.facts.find((fact) => fact.key.endsWith("heron-point-home"))!;
    const value = { ...(home.value as InstallmentSaleFactValue), excludedGain: 300000 };
    const run = evaluate([sale("home", value)]);
    expect(run.gap("form-6252", LINE.l15)).toBe(true);
    expect(run.value("form-6252", "0.line.14_price_less_line_13")).toBe(740000);
  });
});

describe("Form 6252 Part III", () => {
  const party = duplex.relatedParty!;

  it("no resale this year: line 28 No, lines 29–37 blank", () => {
    const run = evaluate([
      sale("duplex", {
        ...duplex,
        relatedParty: { ...party, resoldThisYear: false, secondDisposition: undefined },
      }),
    ]);
    expect([run.value("form-6252", LINE.l28no), run.value("form-6252", LINE.l35)]).toEqual([
      true,
      undefined,
    ]);
    expect(run.value("form-6252", LINE.l27)).toBe("Dorian Thornwell");
  });

  it("a resale more than 2 years after the first sale checks 29a with its date", () => {
    const run = evaluate([
      sale("duplex", {
        ...duplex,
        dateSold: "2023-03-01",
        relatedParty: {
          ...party,
          secondDisposition: { date: "2025-03-02", amountRealized: 520000 },
        },
      }),
    ]);
    expect([run.value("form-6252", LINE.l29a), run.value("form-6252", LINE.l29aDate)]).toEqual([
      true,
      "03/02/2025",
    ]);
    expect(run.value("form-6252", LINE.l35)).toBeUndefined();
  });

  it("an exception (29e) skips lines 30–37", () => {
    const resale = { ...party.secondDisposition!, exception: "no_tax_avoidance" as const };
    const run = evaluate([
      sale("duplex", { ...duplex, relatedParty: { ...party, secondDisposition: resale } }),
    ]);
    expect([run.value("form-6252", LINE.l29e), run.value("form-6252", LINE.l35)]).toEqual([
      true,
      undefined,
    ]);
    expect(run.value("form-4797", F4797_LINE_4)).toBe(19041);
  });

  it("a resale with no details waits, and the sale is asked again", () => {
    const run = evaluate([
      sale("duplex", { ...duplex, relatedParty: { ...party, secondDisposition: undefined } }),
    ]);
    expect(run.value("form-6252", LINE.l28yes)).toBe(true);
    expect(run.value("form-6252", LINE.l35)).toBeUndefined();
    expect(run.value("form-4797", F4797_LINE_4)).toBeUndefined();
    expect(run.pending.pendingFacts).toContain(makeInstallmentSaleFactKey("duplex"));
  });

  it("Part III is not completed after the 2 years that follow the year of sale", () => {
    const run = evaluate([sale("duplex", { ...duplex, dateSold: "2022-05-10" })]);
    expect([run.value("form-6252", LINE.l28yes), run.value("form-6252", LINE.l27)]).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("marketable securities resold after that window still complete Part III (decision, relatedParty.ts)", () => {
    const run = evaluate([
      sale("duplex", {
        ...duplex,
        dateSold: "2022-05-10",
        relatedParty: { ...party, marketableSecurities: true },
      }),
    ]);
    // The same lines as bain's duplex: no 29a box for marketable securities.
    expect([run.value("form-6252", LINE.l29a), run.value("form-6252", LINE.l35)]).toEqual([
      undefined,
      171369,
    ]);
    expect(run.value("form-4797", F4797_LINE_4)).toBe(19041 + 171369);
  });

  it("the final payment this year: Part III is not completed", () => {
    const run = evaluate([sale("duplex", { ...duplex, paymentsThisYear: 300000 })]);
    expect(run.value("form-6252", LINE.l27)).toBeUndefined();
  });
});
