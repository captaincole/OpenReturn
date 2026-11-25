/*
 * Income of a foreign account recorded in the account's currency
 * (facts/kinds/foreignCurrency.ts): the engine looks up each rate in its tables
 * and converts before any form reads it (incomeInDollars.ts). The synthetic
 * faile return (a dollar 1099-DIV and 1099-INT, the election for the credit)
 * is the base. Rates typed from the published pages:
 * - G.5A 2025 average: EUR 1.1306 dollars per euro;
 * - H.10: EUR 12/31/2025 1.1736, 10/08/2025 1.1606, 07/03/2025 1.1758,
 *   02/05/2025 1.0419, 12/26/2025 1.1766 (dollars per euro).
 */

import { describe, expect, it } from "vitest";
import {
  FOREIGN_INCOME_RATE_METHOD_KEY,
  FOREIGN_TAX_CREDIT_KEYS,
  makeDividendFactKey,
  makeForm8949BoxDecisionKey,
  makeInterestFactKey,
  makeTradeFactKey,
  type DividendFactValue,
  type InterestFactValue,
  type TradeFactValue,
} from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows.js";
import { exchangeRateGap, incomeInDollars } from "../../src/incomeInDollars.js";
import { evaluateScenario, pendingInputs } from "../../src/index.js";
import { dollarsFromForeign, type UnitsPerDollar } from "../../src/money.js";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { faileScenario as base } from "../scenarios/synthetic/faile/index.js";

const EURO_KEY = makeInterestFactKey("porto-savings");
const DIVIDEND_KEY = makeDividendFactKey("porto-savings");
const SALE_KEY = makeTradeFactKey("lisbon-custody", "lisbon-001");

/* Interest credited in euros on 31 December, Portuguese tax withheld that day. */
const euroInterest: InterestFactValue = {
  payerName: "Banco Ribeira de Teste S.A.",
  box1: 1180.4,
  box6: 118.04,
  box7: "Portugal",
  foreignCurrency: {
    code: "EUR",
    byDate: [{ date: "12/31/2025", amounts: { box1: 1180.4, box6: 118.04 } }],
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
  foreignCurrency: { code: "EUR", saleSettled: "10/08/2025", purchaseSettled: "02/05/2025" },
};

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const income = (key: string, value: unknown) => row("investment_income", key, value);

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
  const unsupported = (formId: string, id: string) =>
    (field(formId, id) as { unsupported?: boolean } | undefined)?.unsupported === true;
  return { value, field, unsupported, pending: pendingInputs(result).pendingFacts };
}

const convert = (value: unknown, decisions: AIDecisionRow[] = [], key = EURO_KEY) =>
  incomeInDollars([income(key, value)], decisions).facts[0]!.value;

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

describe("interest", () => {
  it("takes the yearly average with no decision; the tax, the rate of its day", () => {
    // 1,180.40 × 1.1306 = 1,334.56; 118.04 × 1.1736 = 138.53.
    expect(convert(euroInterest)).toEqual({
      payerName: "Banco Ribeira de Teste S.A.",
      box1: 1334.56,
      box6: 138.53,
      box7: "Portugal",
    });
  });

  it("takes the rate of each day credited under the daily method", () => {
    const twice: InterestFactValue = {
      ...euroInterest,
      box6: undefined,
      foreignCurrency: {
        code: "EUR",
        byDate: [
          { date: "07/03/2025", amounts: { box1: 590.2 } },
          { date: "12/31/2025", amounts: { box1: 590.2 } },
        ],
      },
    };
    const daily = [decision(FOREIGN_INCOME_RATE_METHOD_KEY, "daily")];
    // 590.20 × 1.1758 = 693.96; 590.20 × 1.1736 = 692.66.
    expect((convert(twice, daily) as InterestFactValue).box1).toBe(1386.62);
  });

  it("takes the yearly average for the tax under the accrual election", () => {
    const accrued = row("foreign", FOREIGN_TAX_CREDIT_KEYS.claimAccrued, true);
    const [, converted] = incomeInDollars([accrued, income(EURO_KEY, euroInterest)]).facts;
    expect((converted!.value as InterestFactValue).box6).toBe(133.46); // 118.04 × 1.1306 = 133.456
  });

  it("flows in dollars to Schedule B, Form 1040 and the credit", () => {
    const { value } = evaluate([income(EURO_KEY, euroInterest)]);
    expect(value("schedule-b", "0.line.1_amount_2")).toBe(1335);
    expect(value("schedule-b", "0.line.2_total_interest")).toBe(2115); // 780 + 1,334.56
    expect(value("form-1040", "line.2b")).toBe(2115);
    expect(value("schedule-3", "0.line.1")).toBe(288); // 118.40 + 31.20 + 138.53 = 288.13
  });
});

describe("dividends", () => {
  it("take the rate of the day paid, the last earlier day on a weekend", () => {
    const saturday: DividendFactValue = {
      payerName: "Exemplo Energia SA",
      box1a: 100,
      foreignCurrency: { code: "EUR", byDate: [{ date: "12/27/2025", amounts: { box1a: 100 } }] },
    };
    // Saturday 27 December: Friday's 1.1766.
    expect((convert(saturday, [], DIVIDEND_KEY) as DividendFactValue).box1a).toBe(117.66);
  });
});

describe("a sale", () => {
  it("takes the rates of the settlement dates of the sale and the purchase", () => {
    const { value } = evaluate([income(SALE_KEY, euroSale)], SALE_DECISIONS);
    // 9,000 × 1.1606 = 10,445.40; 7,500 × 1.0419 = 7,814.25.
    expect(value("form-8949", "0.part1.row1_proceeds")).toBe(10445);
    expect(value("form-8949", "0.part1.row1_cost_basis")).toBe(7814);
    expect(value("form-8949", "0.part1.row1_gain_loss")).toBe(2631);
    expect(value("schedule-d", "0.line.3_gain_loss")).toBe(2631);
  });
});

describe("a missing date", () => {
  it("is a pending input, and the interest lines and the credit wait", () => {
    const noDate = { ...euroInterest, foreignCurrency: { code: "EUR" } };
    const { value, field, unsupported, pending } = evaluate([income(EURO_KEY, noDate)]);
    expect(pending).toEqual([EURO_KEY]);
    expect(value("schedule-b", "0.line.1_payer_name_2")).toBe("Banco Ribeira de Teste S.A.");
    for (const [formId, id] of [
      ["schedule-b", "0.line.1_amount_2"],
      ["schedule-b", "0.line.2_total_interest"],
      ["form-1040", "line.2b"],
      ["schedule-3", "0.line.1"],
    ] as const) {
      expect(field(formId, id)?.ok, `${formId} ${id}`).toBe(false);
      expect(unsupported(formId, id), `${formId} ${id}`).toBe(false);
    }
  });

  it("waits when the dated amounts do not add up to the box", () => {
    const short = {
      ...euroInterest,
      foreignCurrency: { code: "EUR", byDate: [{ date: "12/31/2025", amounts: { box6: 100 } }] },
    };
    expect(incomeInDollars([income(EURO_KEY, short)]).waitingForRate).toEqual([EURO_KEY]);
  });

  it("is a pending input for a sale, and its row and Schedule D line wait", () => {
    const noDate = { ...euroSale, foreignCurrency: { code: "EUR", saleSettled: "10/08/2025" } };
    const { value, pending } = evaluate([income(SALE_KEY, noDate)], SALE_DECISIONS);
    expect(pending).toEqual([SALE_KEY]);
    expect(value("form-8949", "0.part1.row1_proceeds")).toBeUndefined();
    expect(value("form-8949", "0.part1.totals_proceeds")).toBeUndefined();
    expect(value("schedule-d", "0.line.3_proceeds")).toBeUndefined();
  });
});

describe("a currency outside the H.10 release", () => {
  const peso = { ...euroInterest, foreignCurrency: { code: "ARS" } };

  it("is unsupported with its reason, and not a pending input", () => {
    expect(exchangeRateGap(convert(peso))).toContain("ARS");
    const { unsupported, pending } = evaluate([income(EURO_KEY, peso)]);
    expect(pending).toEqual([]);
    expect(unsupported("schedule-b", "0.line.1_amount_2")).toBe(true);
    expect(unsupported("schedule-b", "0.line.2_total_interest")).toBe(true);
    expect(unsupported("schedule-3", "0.line.1")).toBe(true);
  });

  it("makes a sale's row and Schedule D line unsupported", () => {
    const sale = { ...euroSale, foreignCurrency: { code: "ARS" } };
    const { unsupported } = evaluate([income(SALE_KEY, sale)], SALE_DECISIONS);
    expect(unsupported("form-8949", "0.part1.row1_proceeds")).toBe(true);
    expect(unsupported("schedule-d", "0.line.3_proceeds")).toBe(true);
  });
});

describe("the method decision", () => {
  it("is a gap when it is neither method", () => {
    const monthly = [decision(FOREIGN_INCOME_RATE_METHOD_KEY, "monthly")];
    expect(exchangeRateGap(convert(euroInterest, monthly))).toContain(
      FOREIGN_INCOME_RATE_METHOD_KEY,
    );
  });
});

describe("rounding", () => {
  const unitsPerDollar = (rate: number) => rate as UnitsPerDollar;

  it("rounds a converted amount to the cent, the half cent up", () => {
    expect(dollarsFromForeign(1.005, unitsPerDollar(1))).toBe(1.01);
    expect(dollarsFromForeign(0.125, unitsPerDollar(1))).toBe(0.13);
    expect(dollarsFromForeign(-0.125, unitsPerDollar(1))).toBe(-0.13);
    // 12.50 × 1.1004 = 13.755 exactly: half a cent, up, also through 1 / 1.1004.
    expect(dollarsFromForeign(12.5, unitsPerDollar(1 / 1.1004))).toBe(13.76);
  });

  it("keeps the cents to the line, which rounds the half dollar up", () => {
    // 884.93 × 1.1306 = 1,000.50: Schedule B rounds the row to 1,001.
    const half = {
      ...euroInterest,
      box1: 884.93,
      box6: undefined,
      foreignCurrency: { code: "EUR" },
    };
    expect((convert(half) as InterestFactValue).box1).toBe(1000.5);
    const { value } = evaluate([income(EURO_KEY, half)]);
    expect(value("schedule-b", "0.line.1_amount_2")).toBe(1001);
    expect(value("schedule-b", "0.line.2_total_interest")).toBe(1781); // 780 + 1,000.50
  });
});
