/*
 * FTB 3805E on a whole return: who files, the copies, the printed lines, and
 * what reaches Schedule D (540). Built on the joline facts (README.md of the
 * scenario), changed per test.
 */

import { describe, expect, it } from "vitest";
import {
  makeInstallmentSaleFactKey,
  type InstallmentSaleFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import {
  form3805ETotals,
  salesForScheduleD1,
  SCHEDULE_D1_GAP,
} from "../../../../../src/state/ca/3805e/totals.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { alderHome, foothillLot } from "../../../../scenarios/synthetic/joline/facts.js";
import { jolineScenario as base } from "../../../../scenarios/synthetic/joline/index.js";

const isSale = (row: TaxFactRow) => row.key.startsWith("installment_sale.");
const others = base.facts.filter((row) => !isSale(row));

const saleRow = (slug: string, value: InstallmentSaleFactValue): TaxFactRow => ({
  ...others[0],
  id: `f-${slug}`,
  category: "capital_gains",
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

const withDecision = (key: string, value: unknown) => [
  ...base.decisions.filter((row) => row.decisionKey !== key),
  decision(key, value),
];

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3805e-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  const line = (formId: string, fieldId: string) => {
    const field = result.forms
      .get(formId)
      ?.fields.find((each) => each.fieldId === `${formId}.${fieldId}`);
    if (!field) return "missing";
    if (field.result.ok) return field.result.value;
    return field.result.unsupported ? "unsupported" : undefined;
  };
  return { files, line, result };
}

const lot = saleRow("foothill-lot", foothillLot);
const home = saleRow("alder-street-home", alderHome);

describe("who files FTB 3805E", () => {
  it("no installment sale fact: FTB 3805E and Schedule D (540) do not file", () => {
    const { files } = evaluate(others);
    expect([files("form-3805e"), files("schedule-d-ca")]).toEqual([false, false]);
  });

  it("the same amounts on both returns, nothing else: neither files", () => {
    const { files } = evaluate([...others, home]);
    expect([files("form-6252"), files("form-3805e"), files("schedule-d-ca")]).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("a California basis that differs files both, with Form 540", () => {
    const { files } = evaluate([...others, lot]);
    expect([files("form-3805e"), files("schedule-d-ca")]).toEqual([true, true]);
  });

  it("with Schedule D (540) filing, a sale with the same amounts files too (its line 1 row)", () => {
    const { result } = evaluate([...others, lot, home]);
    expect(result.filingInfo.form3805ETotals?.forms.map((form) => form.key)).toEqual([
      lot.key,
      home.key,
    ]);
  });

  it("a later year with no payment: a California basis that differs files neither", () => {
    const quiet = saleRow("quiet-lot", {
      ...foothillLot,
      dateSold: "2020-03-14",
      relatedParty: undefined,
      paymentsThisYear: 0,
      paymentsPriorYears: 100000,
    });
    const { files } = evaluate([...others, quiet]);
    expect([files("form-3805e"), files("schedule-d-ca")]).toEqual([false, false]);
  });

  it("no Form 540 (a nonresident): FTB 3805E does not file", () => {
    const { files } = evaluate(
      [...others, lot],
      withDecision("decisions.scope.must_file_ca_540", false),
    );
    expect(files("form-3805e")).toBe(false);
  });

  it("the decision wins; with no fact, every line is a gap", () => {
    const off = evaluate([...others, lot], withDecision("decisions.scope.must_file_3805e", false));
    expect(off.files("form-3805e")).toBe(false);
    const on = evaluate(others, withDecision("decisions.scope.must_file_3805e", true));
    expect(on.line("form-3805e", "0.line.5_selling_price")).toBe("unsupported");
  });
});

describe("the printed lines", () => {
  it("the first copy is the lot: Part I with the California basis, Part III completed", () => {
    const { line } = evaluate([...others, lot, home]);
    expect(line("form-3805e", "0.line.8_cost_or_other_basis")).toBe(90000);
    expect(line("form-3805e", "0.line.19_gross_profit_percentage")).toBe("0.6800");
    expect(line("form-3805e", "0.line.3_sold_to_related_party")).toBe("yes");
    expect(line("form-3805e", "1.line.28_related_party_second_disposition")).toBe("yes");
    expect(line("form-3805e", "1.line.29_second_disposition_exception")).toBeUndefined();
    expect(line("form-3805e", "1.line.37_related_party_income_less_recapture")).toBe(163200);
    expect(line("form-3805e", "1.line.23_payments_received_prior_years")).toBeUndefined();
  });

  it("a later year: Part I is blank and line 19 is the year of sale's percentage", () => {
    const later = saleRow("old-lot", {
      ...foothillLot,
      dateSold: "2023-03-14",
      paymentsPriorYears: 100000,
      relatedParty: undefined,
    });
    const { line } = evaluate([...others, later]);
    expect(line("form-3805e", "0.line.5_selling_price")).toBeUndefined();
    expect(line("form-3805e", "0.line.18_contract_price")).toBeUndefined();
    expect(line("form-3805e", "0.line.19_gross_profit_percentage")).toBe("0.6800");
    expect(line("form-3805e", "0.line.20_year_of_sale_debts_over_basis")).toBe(0);
    expect(line("form-3805e", "1.line.23_payments_received_prior_years")).toBe(100000);
    expect(line("form-3805e", "1.line.24_installment_sale_income")).toBe(40800);
  });

  it("a resale more than 2 years after the sale checks box a with its date", () => {
    const old = saleRow("old-lot", {
      ...foothillLot,
      dateSold: "2023-03-14",
      paymentsPriorYears: 100000,
      relatedParty: {
        ...foothillLot.relatedParty!,
        marketableSecurities: false,
        secondDisposition: { date: "2025-03-15", amountRealized: 340000 },
      },
    });
    const { line } = evaluate([...others, old]);
    expect(line("form-3805e", "1.line.29_second_disposition_exception")).toBe(
      "a_more_than_two_years_after",
    );
    expect(line("form-3805e", "1.line.29a_second_disposition_date")).toBe("03/15/2025");
    expect(line("form-3805e", "1.line.30_related_party_selling_price")).toBeUndefined();
  });

  it("a stated condition checks its box and skips lines 30 to 37", () => {
    const party = foothillLot.relatedParty!;
    const excepted = saleRow("lot", {
      ...foothillLot,
      relatedParty: {
        ...party,
        secondDisposition: { ...party.secondDisposition!, exception: "involuntary_conversion" },
      },
    });
    const { line } = evaluate([...others, excepted]);
    expect(line("form-3805e", "1.line.29_second_disposition_exception")).toBe(
      "c_involuntary_conversion",
    );
    expect(line("form-3805e", "1.line.35_related_party_installment_income")).toBeUndefined();
  });

  it("a later year waiting for the California recapture: listed as missing, lines blank", () => {
    const waiting = saleRow("rental-land", {
      ...foothillLot,
      dateSold: "2023-03-14",
      paymentsPriorYears: 100000,
      relatedParty: undefined,
      depreciationAllowed: 20000,
      recaptureIncome: 0,
      california: { depreciationAllowed: 15000 },
    });
    const { line, result } = evaluate([...others, waiting]);
    expect(result.filingInfo.missingInputs?.["form-3805e"]).toEqual([waiting.key]);
    expect(line("form-3805e", "1.line.24_installment_sale_income")).toBeUndefined();
  });
});

describe("what FTB 3805E sends on", () => {
  it("Schedule D (540) line 1 takes line 26 + 37 of each capital asset form; line 12b the difference", () => {
    const { line } = evaluate([...others, lot, home]);
    expect(line("schedule-d-ca", "0.line.1a.gain")).toBe(204000);
    expect(line("schedule-d-ca", "0.line.1b.gain")).toBe(107058);
    expect(line("schedule-d-ca", "3.line.12b")).toBe(9990);
    expect(line("schedule-ca", "0.line.7a_additions")).toBe(9990);
  });

  it("business property goes to Schedule D-1, which does not take it: no line 1 row, the route is a gap", () => {
    const business = { ...foothillLot, use: "business" as const, relatedParty: undefined };
    const sales = [{ key: "installment_sale.shop", value: business }];
    const totals = form3805ETotals(sales, false, undefined);
    expect(totals.scheduleDRows).toEqual([]);
    expect(totals.scheduleD1Gap).toBe(SCHEDULE_D1_GAP);
    expect(salesForScheduleD1(sales, false)).toEqual(["installment_sale.shop"]);
  });

  it("on the return, a business sale's form makes Schedule CA line 4 columns B and C a gap", () => {
    const business = { ...foothillLot, use: "business" as const, relatedParty: undefined };
    const { line } = evaluate([...others, saleRow("shop", business)]);
    expect(line("schedule-ca", "0.line.b4_subtractions")).toBe("unsupported");
    expect(line("schedule-ca", "0.line.b4_additions")).toBe("unsupported");
  });

  it("a capital asset with only the same amounts sends nothing to Schedule D-1", () => {
    const totals = form3805ETotals([{ key: home.key, value: alderHome }], false, undefined);
    expect(totals.scheduleD1Gap).toBeUndefined();
    expect(totals.scheduleDRows.map((row) => row.gain)).toEqual([107058]);
  });

  it("a form with a gap gives a row with that gap, so Schedule D (540)'s totals are a gap", () => {
    const gapped = saleRow("shed", {
      ...foothillLot,
      depreciationAllowed: 5000,
      relatedParty: undefined,
    });
    const { line } = evaluate([...others, gapped]);
    expect(line("form-3805e", "0.line.12_income_recapture")).toBe("unsupported");
    expect(line("schedule-d-ca", "3.line.11")).toBe("unsupported");
  });
});
