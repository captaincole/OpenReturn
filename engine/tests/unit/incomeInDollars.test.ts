/*
 * Income of a foreign account recorded in the account's currency
 * (facts/kinds/foreignCurrency.ts): the engine converts it with the rate on the
 * fact before any form reads it (incomeInDollars.ts). The synthetic faile
 * return (a dollar 1099-DIV and 1099-INT, the election for the credit) is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeForm8949BoxDecisionKey,
  makeInterestFactKey,
  makeTradeFactKey,
  type InterestFactValue,
  type TradeFactValue,
} from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows.js";
import { incomeInDollars } from "../../src/incomeInDollars.js";
import { evaluateScenario, pendingInputs } from "../../src/index.js";
import { dollarsFromForeign } from "../../src/money.js";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { faileScenario as base } from "../scenarios/synthetic/faile/index.js";

const EURO_KEY = makeInterestFactKey("porto-savings");
const SALE_KEY = makeTradeFactKey("lisbon-custody", "lisbon-001");

/* Interest credited in euros, Portuguese tax withheld at the treaty rate. */
const euroInterest: InterestFactValue = {
  payerName: "Banco Ribeira de Teste S.A.",
  box1: 1180.4,
  box6: 118.04,
  box7: "Portugal",
  conversion: {
    currency: "Euro (EUR)",
    exchangeRate: 0.886,
    rateSource: "Yearly average rate, 2025",
    taxExchangeRate: 0.852,
    taxRateSource: "Rate on 12/31/2025, the day the tax was withheld",
  },
};

const euroSale: TradeFactValue = {
  tradeId: "lisbon-001",
  description: "100 sh Exemplo Energia SA",
  quantity: 100,
  dateAcquired: "02/03/2025",
  dateSold: "10/06/2025",
  proceeds: 9000,
  costBasis: 7500,
  conversion: { currency: "Euro (EUR)", saleExchangeRate: 0.85, purchaseExchangeRate: 0.96 },
};

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
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

const SALE_DECISIONS = [
  decision("decisions.scope.has_reportable_sales", true),
  decision(makeForm8949BoxDecisionKey("lisbon-001"), "partI.boxC"),
];

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = []) {
  const kept = base.decisions.filter(
    (each) => !decisions.some((added) => added.decisionKey === each.decisionKey),
  );
  const result = evaluateScenario({
    filing: { id: "income-in-dollars", taxYear: base.taxYear },
    facts: [...base.facts, ...extra],
    decisions: [...kept, ...decisions],
    authEmail: null,
  });
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  return { value, field, pending: pendingInputs(result).pendingFacts };
}

describe("a dollar account", () => {
  it("passes through unchanged: the same row, the same lines", () => {
    const { facts, waitingForRate } = incomeInDollars(base.facts);
    facts.forEach((fact, index) => expect(fact).toBe(base.facts[index]));
    expect(waitingForRate).toEqual([]);
    const { value, pending } = evaluate([]);
    expect(value("schedule-b", "0.line.1_amount_1")).toBe(780);
    expect(value("form-1040", "line.2b")).toBe(780);
    expect(value("schedule-3", "0.line.1")).toBe(150);
    expect(pending).toEqual([]);
  });
});

describe("a foreign-currency amount", () => {
  it("converts each box with its rate and keeps the cents", () => {
    const [converted] = incomeInDollars([row("investment_income", EURO_KEY, euroInterest)]).facts;
    // 1,180.40 / 0.886 = 1,332.2799; 118.04 / 0.852 = 138.5446.
    expect(converted!.value).toEqual({
      payerName: "Banco Ribeira de Teste S.A.",
      box1: 1332.28,
      box6: 138.54,
      box7: "Portugal",
    });
  });

  it("flows in dollars to Schedule B, Form 1040 and the credit", () => {
    const { value } = evaluate([row("investment_income", EURO_KEY, euroInterest)]);
    expect(value("schedule-b", "0.line.1_amount_2")).toBe(1332);
    expect(value("schedule-b", "0.line.2_total_interest")).toBe(2112); // 780 + 1,332.28
    expect(value("form-1040", "line.2b")).toBe(2112);
    expect(value("schedule-3", "0.line.1")).toBe(288); // 118.40 + 31.20 + 138.54 = 288.14
  });

  it("converts a sale: the proceeds at the sale's rate, the cost at the purchase's", () => {
    const { value } = evaluate([row("investment_income", SALE_KEY, euroSale)], SALE_DECISIONS);
    // 9,000 / 0.85 = 10,588.24; 7,500 / 0.96 = 7,812.50.
    expect(value("form-8949", "0.part1.row1_proceeds")).toBe(10588);
    expect(value("form-8949", "0.part1.row1_cost_basis")).toBe(7813);
    expect(value("form-8949", "0.part1.row1_gain_loss")).toBe(2775);
    expect(value("schedule-d", "0.line.3_gain_loss")).toBe(2775);
  });
});

describe("a missing rate", () => {
  it("is a pending input, and the interest lines and the credit wait", () => {
    const noRate = { ...euroInterest, conversion: { currency: "Euro (EUR)" } };
    const { value, field, pending } = evaluate([row("investment_income", EURO_KEY, noRate)]);
    expect(pending).toEqual([EURO_KEY]);
    expect(value("schedule-b", "0.line.1_payer_name_2")).toBe("Banco Ribeira de Teste S.A.");
    for (const [formId, id] of [
      ["schedule-b", "0.line.1_amount_2"],
      ["schedule-b", "0.line.2_total_interest"],
      ["form-1040", "line.2b"],
      ["schedule-3", "0.line.1"],
    ] as const) {
      expect(field(formId, id)?.ok, `${formId} ${id}`).toBe(false);
      const result = field(formId, id) as { unsupported?: boolean } | undefined;
      expect(result?.unsupported, `${formId} ${id}`).toBeFalsy();
    }
  });

  it("waits for the tax rate when the tax box has an amount", () => {
    const { conversion } = euroInterest;
    const noTaxRate = {
      ...euroInterest,
      conversion: { ...conversion!, taxExchangeRate: undefined },
    };
    const { value, pending } = evaluate([row("investment_income", EURO_KEY, noTaxRate)]);
    expect(pending).toEqual([EURO_KEY]);
    expect(value("schedule-3", "0.line.1")).toBeUndefined();
  });

  it("is a pending input for a sale, and its row and Schedule D line wait", () => {
    const noRate = { ...euroSale, conversion: { currency: "Euro (EUR)", saleExchangeRate: 0.85 } };
    const { value, pending } = evaluate(
      [row("investment_income", SALE_KEY, noRate)],
      SALE_DECISIONS,
    );
    expect(pending).toEqual([SALE_KEY]);
    expect(value("form-8949", "0.part1.row1_proceeds")).toBeUndefined();
    expect(value("form-8949", "0.part1.totals_proceeds")).toBeUndefined();
    expect(value("schedule-d", "0.line.3_proceeds")).toBeUndefined();
  });
});

describe("rounding", () => {
  it("rounds a converted amount to the cent, the half cent up", () => {
    expect(dollarsFromForeign(1.005, 1)).toBe(1.01);
    expect(dollarsFromForeign(0.125, 1)).toBe(0.13);
    expect(dollarsFromForeign(-0.125, 1)).toBe(-0.13);
    expect(dollarsFromForeign(1180.4, 0.886)).toBe(1332.28);
  });

  it("keeps the cents to the line, which rounds the half dollar up", () => {
    // 886.443 / 0.886 = 1,000.50 exactly: Schedule B rounds the row to 1,001.
    const half = { ...euroInterest, box1: 886.443, box6: undefined };
    const [converted] = incomeInDollars([row("investment_income", EURO_KEY, half)]).facts;
    expect((converted!.value as InterestFactValue).box1).toBe(1000.5);
    const { value } = evaluate([row("investment_income", EURO_KEY, half)]);
    expect(value("schedule-b", "0.line.1_amount_2")).toBe(1001);
    expect(value("schedule-b", "0.line.2_total_interest")).toBe(1781); // 780 + 1,000.50
  });
});
