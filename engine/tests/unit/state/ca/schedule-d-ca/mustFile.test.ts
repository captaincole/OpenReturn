/*
 * Who files Schedule D (540): "only if there is a difference between your
 * California and federal capital gains and losses"
 * (ca-540-sched-d-inst-2025::sec::purpose::b01). And what the engine prints
 * when it files: line 1 rows past 22, a sale with a federal adjustment, and
 * Schedule CA line 7a with no Schedule D (540). Built on the rosalind facts.
 */

import { describe, expect, it } from "vitest";
import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_CAPITAL_LOSS_CARRYOVER_KEY,
  makeCaliforniaBasisFactKey,
  makeTradeFactKey,
  type TradeFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { makeResolverInputs } from "../../../../../src/resolverInputs.js";
import {
  ADJUSTED_SALE_GAP,
  MORE_ROWS_GAP,
} from "../../../../../src/state/ca/schedule-d-ca/lines.js";
import { resolveScheduleDCaInfo } from "../../../../../src/state/ca/schedule-d-ca/resolveInfo.js";
import { rosalindScenario as base } from "../../../../scenarios/synthetic/rosalind/index.js";

const BROKER = "summit-brokerage";
const withoutCarryover = base.facts.filter((fact) => fact.key !== CA_CAPITAL_LOSS_CARRYOVER_KEY);

const numberFact = (key: string, value: number): TaxFactRow => ({
  ...base.facts[0],
  id: `f-${key}`,
  category: "capital_gains",
  key,
  value,
});

const tradeFact = (trade: TradeFactValue): TaxFactRow => ({
  ...base.facts[0],
  id: `f-${trade.tradeId}`,
  category: "investment_income",
  key: makeTradeFactKey(BROKER, trade.tradeId),
  value: trade,
});

function resolve(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  return resolveScheduleDCaInfo(
    makeResolverInputs({
      facts: facts.map(({ key, value, category }) => ({ key, value, category })),
      decisions: decisions.map(({ decisionKey, decision }) => ({ decisionKey, decision })),
    }),
  );
}

const files = (facts: TaxFactRow[], decisions?: AIDecisionRow[]) =>
  resolve(facts, decisions).mustFile?.["schedule-d-ca"]?.value;

function evaluate(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "schedule-d-ca-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  return (formId: string, fieldId: string) => {
    const form = result.forms.get(formId);
    if (form?.mustFile.ok && form.mustFile.value === false) return "not filed";
    const field = form?.fields.find((each) => each.fieldId === fieldId);
    if (!field) return "missing";
    if (field.result.ok) return field.result.value;
    return field.result.unsupported ? `unsupported: ${field.result.reason}` : undefined;
  };
}

describe("Schedule D (540) must-file", () => {
  it("files when the California carryover is not the federal one", () => {
    expect(files(base.facts)).toBe(true);
  });

  it("files nothing for a return with only capital gains and no difference", () => {
    expect(files(withoutCarryover)).toBe(false);
    expect(resolve(withoutCarryover).scheduleDCaFigures).toBeUndefined();
  });

  it("files nothing when the California carryover equals the federal carryovers", () => {
    const facts = [
      ...base.facts.filter((fact) => fact.key !== CA_CAPITAL_LOSS_CARRYOVER_KEY),
      numberFact(CAPITAL_LOSS_CARRYOVER_KEYS.shortTerm, 1000),
      numberFact(CAPITAL_LOSS_CARRYOVER_KEYS.longTerm, 1500),
      numberFact(CA_CAPITAL_LOSS_CARRYOVER_KEY, 2500),
    ];
    expect(files(facts)).toBe(false);
  });

  it("files for a sale whose California basis differs, and not for an equal one", () => {
    const differs = numberFact(makeCaliforniaBasisFactKey(BROKER, "smt-d-01"), 7000);
    const equal = numberFact(makeCaliforniaBasisFactKey(BROKER, "smt-d-01"), 8000);
    expect(files([...withoutCarryover, differs])).toBe(true);
    expect(files([...withoutCarryover, equal])).toBe(false);
    const row = resolve([...withoutCarryover, differs]).scheduleDCaFigures?.line1[0];
    expect(row).toMatchObject({ basis: 7000, gain: 5000 });
  });

  it("files nothing without Form 540, and an explicit false wins", () => {
    const no540 = base.decisions.filter(
      (decision) => decision.decisionKey !== "decisions.scope.must_file_ca_540",
    );
    expect(files(base.facts, no540)).toBe(false);
    const optOut = {
      ...base.decisions[0],
      decisionKey: "decisions.scope.must_file_schedule_d_ca",
      decision: false,
    };
    expect(files(base.facts, [...base.decisions, optOut])).toBe(false);
  });

  it("asks for the California carryover when it files with a federal carryover and no California amount", () => {
    const facts = [
      ...withoutCarryover,
      numberFact(CAPITAL_LOSS_CARRYOVER_KEYS.longTerm, 1500),
      numberFact(makeCaliforniaBasisFactKey(BROKER, "smt-d-01"), 7000),
    ];
    const info = resolve(facts);
    expect(info.missingInputs?.["schedule-d-ca"]).toEqual([CA_CAPITAL_LOSS_CARRYOVER_KEY]);
    expect(info.scheduleDCaFigures?.line7).toBeUndefined();
  });
});

describe("Schedule D (540) when it files", () => {
  it("prints no row past 22 sales, and still totals every sale", () => {
    const extra = Array.from({ length: 21 }, (_, index) =>
      tradeFact({
        tradeId: `smt-x-${index}`,
        description: "DELTA CO",
        quantity: 1,
        dateAcquired: "01/02/20",
        dateSold: "03/03/25",
        proceeds: 200,
        costBasis: 100,
      }),
    );
    const line = evaluate([...base.facts, ...extra]);
    expect(line("schedule-d-ca", "schedule-d-ca.0.line.1a.gain")).toBe(
      `unsupported: ${MORE_ROWS_GAP}`,
    );
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.1v.description")).toBe(
      `unsupported: ${MORE_ROWS_GAP}`,
    );
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.4")).toBe(5800 + 21 * 100);
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.12a")).toBe(2500);
  });

  it("is unsupported past line 3 for a sale with a federal adjustment", () => {
    const adjusted = tradeFact({
      tradeId: "smt-w-01",
      description: "EPSILON INC",
      quantity: 10,
      dateAcquired: "01/02/24",
      dateSold: "03/03/25",
      proceeds: 900,
      costBasis: 1000,
      adjustmentCode: "W",
      adjustmentAmount: 100,
    });
    const line = evaluate([...base.facts, adjusted]);
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.3")).toBe(800);
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.8")).toBe(
      `unsupported: ${ADJUSTED_SALE_GAP}`,
    );
    expect(line("schedule-ca", "schedule-ca.0.line.7a_subtractions")).toBe(
      `unsupported: ${ADJUSTED_SALE_GAP}`,
    );
  });

  it("leaves Schedule CA line 7a columns B and C unsupported with no Schedule D (540)", () => {
    const line = evaluate(withoutCarryover);
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.10")).toBe("not filed");
    expect(String(line("schedule-ca", "schedule-ca.0.line.7a_subtractions"))).toMatch(
      /^unsupported: /,
    );
    expect(String(line("schedule-ca", "schedule-ca.0.line.7a_additions"))).toMatch(
      /^unsupported: /,
    );
  });

  it("takes line 10 as 0 when the federal return has no capital gain or loss", () => {
    const noSales = base.facts.filter(
      (fact) => !fact.key.includes(".trades.") && !fact.key.endsWith(".dividends"),
    );
    const line = evaluate(noSales);
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.10")).toBe(0);
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.11")).toBe(-2500);
    expect(line("schedule-d-ca", "schedule-d-ca.3.line.12a")).toBe(2500);
  });
});
