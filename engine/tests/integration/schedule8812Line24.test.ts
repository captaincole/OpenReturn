import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import {
  EIC_KEYS,
  makeDependentFactKey,
  makeForm8949BoxDecisionKey,
  makeTradeFactKey,
  type TradeFactValue,
} from "../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../src/facts/rows";
import { decisionRow } from "../helpers/fixtureBuilders.js";
import { tcbUs002Scenario as base } from "../scenarios/tcb-us-002/index.js";

/*
 * Schedule 8812 line 24 adds Form 1040 line 27a, which is blank when the filer
 * takes no EIC. The tcb-us-002 filer (head of household, $32,000 of wages, one
 * nephew) gets three nephews here, so line 16b is $5,100 and Part II-B applies.
 */
const NEPHEW_KEY = makeDependentFactKey("kiddo-ben");
const EIC_ANSWER_KEYS: string[] = Object.values(EIC_KEYS);

/* A long-term sale at a $9,000 loss: line 7a is -3,000, so AGI falls under the wages. */
const LOSS_TRADE_ID = "xyz-1";
const lossSale: TradeFactValue = {
  tradeId: LOSS_TRADE_ID,
  description: "XYZ stock",
  dateAcquired: "01/02/2024",
  dateSold: "06/02/2025",
  proceeds: 1000,
  costBasis: 10000,
};
const lossDecisions: AIDecisionRow[] = [
  ["decisions.scope.has_reportable_sales", true],
  ["decisions.scope.must_file_schedule_d", true],
  ["decisions.scope.must_file_8949", true],
  [makeForm8949BoxDecisionKey(LOSS_TRADE_ID), "partII.boxD"],
].map(([key, decision]) =>
  decisionRow({
    userId: "t",
    taxYear: base.taxYear,
    key: key as string,
    decision,
    rationale: "test",
  }),
);

type Opts = {
  nephews: number;
  eic: "barred" | "unanswered" | "allowed" | "not_asked";
  wages?: number;
  capitalLoss?: boolean;
};

function withWages(fact: TaxFactRow, wages: number | undefined): TaxFactRow {
  if (wages === undefined || fact.category !== "wages") return fact;
  const w2 = fact.value as Record<string, unknown>;
  return { ...fact, value: { ...w2, box1: wages, box3: wages, box5: wages, box16: wages } };
}

function evaluate(opts: Opts) {
  const facts = base.facts.flatMap((fact): TaxFactRow[] => {
    if (opts.eic === "not_asked" && EIC_ANSWER_KEYS.includes(fact.key)) return [];
    if (fact.key === EIC_KEYS.barredByIrs) {
      if (opts.eic === "unanswered") return [];
      return [{ ...fact, value: opts.eic === "barred" }];
    }
    if (fact.key !== NEPHEW_KEY) return [withWages(fact, opts.wages)];
    const nephew = fact.value as Record<string, unknown>;
    return Array.from({ length: opts.nephews }, (_, index) =>
      index === 0
        ? fact
        : {
            ...fact,
            id: `${fact.id}-${index}`,
            key: makeDependentFactKey(`kiddo-ben-${index}`),
            value: { ...nephew, firstName: `Kiddo${index}`, ssn: `900-45-678${index}` },
          },
    );
  });
  const sale: TaxFactRow = {
    ...base.facts[0]!,
    id: "f-loss-sale",
    category: "investment_income",
    key: makeTradeFactKey("broker", LOSS_TRADE_ID),
    value: lossSale,
  };
  const scenario = evaluateScenario({
    filing: { id: "schedule-8812-line-24-test", taxYear: base.taxYear },
    facts: opts.capitalLoss ? [...facts, sale] : facts,
    decisions: opts.capitalLoss ? [...base.decisions, ...lossDecisions] : base.decisions,
    authEmail: null,
  });
  const value = (formId: string, fieldId: string) => {
    const field = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
    return field?.result.ok ? field.result.value : undefined;
  };
  return {
    schedule8812: (line: string) => value("schedule-8812", `schedule-8812.${line}`),
    form1040: (line: string) => value("form-1040", `form-1040.${line}`),
  };
}

describe("Schedule 8812 line 24", () => {
  it("keeps tcb-us-002's EIC with one nephew", () => {
    const result = evaluate({ nephews: 1, eic: "allowed" });
    expect(result.form1040("line.27a")).toBe(2678);
    expect(result.schedule8812("1.line.24_eic_and_schedule_3_line_11")).toBeUndefined();
  });

  it("counts no EIC as 0, so lines 25–27 and 1040 line 28 compute", () => {
    const result = evaluate({ nephews: 3, eic: "barred" });
    expect(result.schedule8812("1.line.20_line16b_at_least_5100_yes")).toBe(true);
    expect(result.form1040("line.27a")).toBeUndefined();
    expect(result.schedule8812("1.line.24_eic_and_schedule_3_line_11")).toBe(0);
    const line27 = result.schedule8812("1.line.27_additional_child_tax_credit");
    expect(line27).toBeTypeOf("number");
    expect(result.form1040("line.28")).toBe(line27);
  });

  it("adds the EIC when there is one", () => {
    const result = evaluate({ nephews: 3, eic: "allowed" });
    const line27a = result.form1040("line.27a");
    expect(line27a).toBeTypeOf("number");
    expect(result.schedule8812("1.line.24_eic_and_schedule_3_line_11")).toBe(line27a);
  });

  /*
   * Head of household, six nephews (so line 20 is under line 17 and Part II-B
   * applies): wages of $62,000 are over the $61,555 limit, so the EIC answers are
   * never asked; the capital loss puts AGI at $60,650, under it.
   */
  it("counts no EIC as 0 when earned income is over the limit and AGI is under it", () => {
    const result = evaluate({ nephews: 6, eic: "not_asked", wages: 62_000, capitalLoss: true });
    expect(result.form1040("line.1z")).toBe(62_000);
    expect(result.form1040("line.11b")).toBe(60_650);
    expect(result.form1040("line.27a")).toBeUndefined();
    // Step 5, question 3 stops the credit without the line 27c box.
    expect(result.form1040("line.27c_no_eic_claim")).toBeUndefined();
    expect(result.schedule8812("1.line.24_eic_and_schedule_3_line_11")).toBe(0);
    const line27 = result.schedule8812("1.line.27_additional_child_tax_credit");
    expect(line27).toBeTypeOf("number");
    expect(result.form1040("line.28")).toBe(line27);
  });

  it("waits while an EIC answer is missing", () => {
    const result = evaluate({ nephews: 3, eic: "unanswered" });
    expect(result.schedule8812("1.line.24_eic_and_schedule_3_line_11")).toBeUndefined();
    expect(result.schedule8812("1.line.27_additional_child_tax_credit")).toBeUndefined();
  });
});
