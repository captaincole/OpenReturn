/*
 * Schedule F on a whole return: who files, the answers it waits on, copies,
 * the lines that receive line 34 (Schedule 1 line 6, Schedule SE lines 1a
 * and 1b, Form 461 line 6, Form 6198, the QBI forms, Form 8960 line 4b, EIC
 * Worksheet B Part 2, Form 2441), and that a return with no farm is unchanged.
 * The synthetic daise (cash, a profit) and edarra (accrual, a loss) are the bases.
 */

import { describe, expect, it } from "vitest";
import { makeFarmFactKey, type FarmFactValue } from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { FARM_ID, ranch } from "../../../scenarios/synthetic/daise/facts.js";
import { daiseScenario as daise } from "../../../scenarios/synthetic/daise/index.js";
import { edarraScenario as edarra } from "../../../scenarios/synthetic/edarra/index.js";

const FARM_KEY = makeFarmFactKey(FARM_ID);

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = daise.decisions) {
  const result = evaluateScenario({
    filing: { id: "schedule-f-test", taxYear: 2025 },
    facts,
    decisions,
  });
  const field = (fieldId: string) =>
    result.forms.get(fieldId.split(".")[0])?.fields.find((entry) => entry.fieldId === fieldId)
      ?.result;
  const value = (fieldId: string) => {
    const found = field(fieldId);
    return found?.ok ? found.value : undefined;
  };
  const reason = (fieldId: string) => {
    const found = field(fieldId) as { unsupported?: boolean; reason?: string } | undefined;
    return found?.unsupported ? found.reason : undefined;
  };
  const files = (formId: string) => result.forms.get(formId)?.mustFile;
  return { result, value, reason, files };
}

const withRanch = (fields: Partial<FarmFactValue>) =>
  daise.facts.map((fact) =>
    fact.key === FARM_KEY ? { ...fact, value: { ...ranch, ...fields } } : fact,
  );
const withoutFarm = (facts: TaxFactRow[]) => facts.filter((fact) => !fact.key.startsWith("farm."));

describe("who files", () => {
  it("files for a farm fact", () => {
    expect(evaluate(daise.facts).files("schedule-f")).toMatchObject({ ok: true, value: true });
  });

  it("does not file with no farm fact", () => {
    expect(evaluate(withoutFarm(daise.facts)).files("schedule-f")).toMatchObject({ value: false });
  });

  it("the explicit decision still wins", () => {
    const decline = decisionRow({
      userId: daise.userId,
      taxYear: 2025,
      key: "decisions.scope.must_file_schedule_f",
      decision: false,
      rationale: "test",
    });
    const run = evaluate(daise.facts, [...daise.decisions, decline]);
    expect(run.files("schedule-f")).toMatchObject({ value: false });
  });

  it("a fact that cannot be read leaves the question open and is asked again", () => {
    const facts = daise.facts.map((fact) =>
      fact.key === FARM_KEY ? { ...fact, value: { activity: "Cattle", productSales: -5 } } : fact,
    );
    const run = evaluate(facts);
    expect(run.files("schedule-f")).toMatchObject({ ok: false });
    expect(pendingInputs(run.result).pendingDecisions).toContain(
      "decisions.scope.must_file_schedule_f",
    );
  });

  it("a spouse's farm is not on a single return", () => {
    const run = evaluate(withRanch({ owner: "spouse" }));
    expect(run.files("schedule-f")).toMatchObject({ value: false });
  });
});

describe("the answers it waits on", () => {
  it.each([
    ["line C", { accountingMethod: undefined }],
    ["line E", { materiallyParticipated: undefined }],
    ["line F", { paymentsRequire1099: undefined }],
    ["line G after a Yes", { filedRequired1099: undefined }],
    ["the CCC loan election", { cccLoanElection: undefined }],
    ["whether line 14 needs Form 4562", { newDepreciableProperty: undefined }],
  ])("asks again for %s", (_, fields) => {
    const run = evaluate(withRanch(fields as Partial<FarmFactValue>));
    expect(pendingInputs(run.result).pendingFacts).toContain(FARM_KEY);
  });

  it("asks for box 36 with a loss, not with a profit", () => {
    const loss = withRanch({ productSales: 10000, allInvestmentAtRisk: undefined });
    expect(pendingInputs(evaluate(loss).result).pendingFacts).toContain(FARM_KEY);
    expect(pendingInputs(evaluate(daise.facts).result).pendingFacts).not.toContain(FARM_KEY);
  });
});

describe("the lines that receive line 34", () => {
  it("daise: Schedule 1 line 6 and Schedule SE lines 1a and 1b", () => {
    const run = evaluate(daise.facts);
    expect(run.value("schedule-1.0.line.6")).toBe(117875);
    expect(run.value("schedule-se.0.line.1a")).toBe(117875);
    expect(run.value("schedule-se.0.line.1b")).toBe(12000);
    expect(run.value("schedule-se.0.line.3")).toBe(105875);
  });

  it("daise: Form 8960 takes the nonpassive farm out on line 4b", () => {
    const run = evaluate(daise.facts);
    expect(run.value("form-8960.0.line.4a")).toBe(117875);
    expect(run.value("form-8960.0.line.4b")).toBe(-117875);
  });

  it("daise: the farm is the QBI business, less half of SE tax", () => {
    expect(evaluate(daise.facts).value("form-8995-a.0.line.2_a")).toBe(117875 - 7480);
  });

  it("edarra: Form 6198 limits the loss; Form 461 line 6 takes it", () => {
    const run = evaluate(edarra.facts, edarra.decisions);
    expect(run.value("form-6198.0.line.21_deductible_loss")).toBe(340000);
    expect(run.value("schedule-f.0.line.34_net_farm_profit_loss")).toBe(-340000);
    expect(run.value("form-461.0.line.6_schedule_1_line_6")).toBe(-340000);
    expect(run.value("schedule-1.0.line.8p")).toBe(27000);
    expect(run.value("schedule-ca.0.line.b6_federal")).toBe(-340000);
    expect(run.value("form-3461.0.line.6_schedule_ca_section_b_line_6")).toBe(-340000);
  });

  it("a passive farm (line E No) is a gap on line 34 and Schedule 1 lines 6 and 10; Schedule SE is asked", () => {
    const run = evaluate(withRanch({ materiallyParticipated: false }));
    expect(run.reason("schedule-f.0.line.34_net_farm_profit_loss")).toContain("passive");
    expect(run.reason("schedule-1.0.line.6")).toContain("passive");
    expect(run.reason("schedule-1.0.line.10")).toContain("passive");
    expect(pendingInputs(run.result).pendingDecisions).toContain(
      "decisions.scope.must_file_schedule_se",
    );
  });

  it("Schedule CA line 6 columns B and C are a gap when the farm deducts depreciation", () => {
    const facts = edarra.facts.map((fact) =>
      fact.key.startsWith("farm.")
        ? {
            ...fact,
            value: {
              ...(fact.value as FarmFactValue),
              expenses: { ...(fact.value as FarmFactValue).expenses, depreciation: 1000 },
              newDepreciableProperty: false,
            },
          }
        : fact,
    );
    const run = evaluate(facts, edarra.decisions);
    expect(run.reason("schedule-ca.0.line.b6_subtractions")).toContain("depreciation");
    expect(run.reason("schedule-ca.0.line.b6_additions")).toContain("depreciation");
  });

  const smallFarm = (fields: Partial<FarmFactValue>): TaxFactRow[] => [
    ...withoutFarm(daise.facts),
    {
      ...daise.facts.find((fact) => fact.key === FARM_KEY)!,
      value: {
        activity: "Eggs",
        accountingMethod: "cash",
        materiallyParticipated: true,
        paymentsRequire1099: false,
        expenses: { feed: 3000 },
        ...fields,
      },
    },
  ];

  it("a small farm profit reaches Schedule 1 line 6 with no Schedule SE (4a under $400)", () => {
    const run = evaluate(smallFarm({ productSales: 3400 }));
    expect(run.value("schedule-1.0.line.6")).toBe(400);
    expect(run.files("schedule-se")).toMatchObject({ value: false });
  });

  it("the line 1b rule: lines 1a and 2 of $434 or more file Schedule SE through line 4c", () => {
    const run = evaluate(
      smallFarm({
        productSales: 3300,
        agriculturalProgramPayments: 600,
        crpPaymentsWhileReceivingSocialSecurity: 600,
      }),
    );
    expect(run.files("schedule-se")).toMatchObject({ value: true });
    expect(run.value("schedule-se.0.line.1a")).toBe(900);
    expect(run.value("schedule-se.0.line.1b")).toBe(600);
    expect(run.value("schedule-se.0.line.4c")).toBe(277);
    expect(run.value("schedule-se.0.line.6")).toBeUndefined();
  });

  it("under $434 with line 1b, no Schedule SE", () => {
    const run = evaluate(
      smallFarm({
        productSales: 2800,
        agriculturalProgramPayments: 600,
        crpPaymentsWhileReceivingSocialSecurity: 600,
      }),
    );
    expect(run.files("schedule-se")).toMatchObject({ value: false });
  });
});

describe("no farm, nothing changes", () => {
  it("Schedule 1 line 6 is blank and Schedule SE line 1a is blank", () => {
    const run = evaluate(withoutFarm(daise.facts));
    expect(run.value("schedule-1.0.line.6")).toBeUndefined();
    expect(run.reason("schedule-1.0.line.6")).toBeUndefined();
  });

  it("Form 461 line 6 is blank without a farm (edarra's wages only)", () => {
    const run = evaluate(withoutFarm(edarra.facts), edarra.decisions);
    expect(run.files("form-461")).toMatchObject({ value: false });
    expect(run.files("form-6198")).toMatchObject({ value: false });
  });
});
