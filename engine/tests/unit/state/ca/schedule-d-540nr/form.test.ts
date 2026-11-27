/*
 * Schedule D (540NR) on a whole return: who files, line 6's question, the
 * lines it sends to Schedule CA (540NR) line 7a, the gaps, and "no facts,
 * nothing changes". The synthetic nildra scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_CAPITAL_LOSS_CARRYOVER_KEY,
  CA_RESIDENCY_FACT_KEYS,
  SECTION_1231_KEYS,
  caCaliforniaAmountKey,
  makeSection1256StatementFactKey,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { K1_GAP } from "../../../../../src/state/ca/schedule-d-540nr/sources.js";
import { SECTION_1231_ROW } from "../../../../../src/state/ca/schedule-d-ca/lines.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { nildraScenario as base } from "../../../../scenarios/synthetic/nildra/index.js";
import { tylinScenario as tylin } from "../../../../scenarios/synthetic/tylin/index.js";

const CALIFORNIA_SALE_FIELDS = [
  "californiaCostOrOtherBasis",
  "californiaDepreciationAllowed",
  "californiaAdditionalDepreciationAfter1976",
  "californiaAdditionalDepreciation1971To1976",
  "californiaSection1254Costs",
  "californiaPriorDeductions",
  "californiaRecomputedDepreciation",
];

/* Tylin's Form 4797 facts with every California amount taken out: California equals federal. */
const withoutCaliforniaAmounts = (facts: TaxFactRow[]) =>
  facts
    .filter((fact) => fact.key !== SECTION_1231_KEYS.californiaNonrecapturedLosses)
    .map((fact) => {
      const sale =
        fact.key.startsWith("business_property_sale.") ||
        fact.key.startsWith("section_179_recapture.");
      if (!sale || typeof fact.value !== "object") return fact;
      const value = { ...(fact.value as Record<string, unknown>) };
      for (const field of CALIFORNIA_SALE_FIELDS) delete value[field];
      return { ...fact, value };
    });

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const numberFact = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0],
  id: `f-${key}`,
  category,
  key,
  value,
});

/* The same answers on a full-year resident's Form 540. */
const AS_RESIDENT = [
  decision("decisions.scope.ca_residency", "full_year"),
  decision("decisions.scope.must_file_540nr", false),
  decision("decisions.scope.must_file_ca_540", true),
];

function evaluate(facts: TaxFactRow[], extraDecisions: AIDecisionRow[] = []) {
  const overridden = new Set(extraDecisions.map((each) => each.decisionKey));
  const result = evaluateScenario({
    filing: { id: "schedule-d-540nr-test", taxYear: base.taxYear },
    facts,
    decisions: [
      ...base.decisions.filter((each) => !overridden.has(each.decisionKey)),
      ...extraDecisions,
    ],
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
  /* A blank line: no value and no gap. */
  const blank = (formId: string, id: string) => {
    const found = field(formId, id);
    return found !== undefined && (found.ok ? found.value === undefined : !found.unsupported);
  };
  return { files, field, value, blank, pending: pendingInputs(result) };
}

const SD = "schedule-d-540nr";
const CA = "schedule-ca-540nr";
const LINES = ["1a.gain", "1b.loss", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12a"];

describe("Schedule D (540NR) on the nildra return", () => {
  const run = evaluate(base.facts);

  it("files with Form 540NR, and line 12a goes to Schedule CA (540NR) line 7a column B", () => {
    expect(run.files(SD)).toBe(true);
    expect(run.value(SD, "0.line.12a")).toBe(3700);
    expect(run.value(SD, "0.line.12b")).toBeUndefined();
    expect(run.value(CA, "0.line.7a_subtractions")).toBe(3700);
    expect(run.value(CA, "0.line.7a_additions")).toBeUndefined();
    expect(run.value(CA, "0.line.7a_total_ca_law")).toBe(-3000);
    expect(run.value("form-540nr", "1.line.14_ca_adjustments_subtractions")).toBe(3700);
  });

  it("prints line 2 blank: no Schedule K-1 on the return", () => {
    expect(run.blank(SD, "0.line.2.gain")).toBe(true);
    expect(run.blank(SD, "0.line.2.loss")).toBe(true);
  });

  it("has the same lines 1 to 12a as Schedule D (540) for the same facts on Form 540", () => {
    const resident = evaluate(base.facts, AS_RESIDENT);
    expect(resident.files(SD)).toBe(false);
    expect(resident.files("schedule-d-ca")).toBe(true);
    // Schedule D (540) prints rows a to f of line 1 on page 0 and lines 2 to 12b on page 3.
    const residentField = (line: string) =>
      resident.value("schedule-d-ca", line.includes(".") ? `0.line.${line}` : `3.line.${line}`);
    expect(LINES.map(residentField)).toEqual(LINES.map((line) => run.value(SD, `0.line.${line}`)));
  });
});

describe("Schedule D (540NR) must-file", () => {
  it("files for a capital gain with no California difference; lines 12a and 12b stay blank", () => {
    const plain = base.facts.filter(
      (fact) => fact.category !== "capital_gains" || fact.key.startsWith("capital_gains.short"),
    );
    const run = evaluate([
      ...plain,
      numberFact("capital_gains", CA_CAPITAL_LOSS_CARRYOVER_KEY, 2000),
    ]);
    expect(run.files(SD)).toBe(true);
    expect(run.value(SD, "0.line.11")).toBe(run.value(SD, "0.line.10"));
    expect(run.value(SD, "0.line.12a")).toBeUndefined();
    expect(run.value(SD, "0.line.12b")).toBeUndefined();
    expect(run.blank(CA, "0.line.7a_subtractions")).toBe(true);
    expect(run.blank(CA, "0.line.7a_additions")).toBe(true);
  });

  it("files for a California carryover alone, with no federal capital gain", () => {
    const facts = base.facts.filter(
      (fact) =>
        fact.category === "wages" ||
        fact.category === "identity" ||
        fact.key === CA_CAPITAL_LOSS_CARRYOVER_KEY ||
        fact.key === CA_RESIDENCY_FACT_KEYS.taxpayer ||
        fact.key === caCaliforniaAmountKey("1a"),
    );
    const run = evaluate(facts, [decision("decisions.scope.has_reportable_sales", false)]);
    expect(run.files("schedule-d")).toBe(false);
    expect(run.files(SD)).toBe(true);
    expect(run.value(SD, "0.line.10")).toBe(0);
    expect(run.value(SD, "0.line.11")).toBe(-3000);
    expect(run.value(CA, "0.line.7a_subtractions")).toBe(3000);
  });

  it("files nothing without Form 540NR, and nothing with no capital gain or loss", () => {
    expect(evaluate(base.facts, AS_RESIDENT).files(SD)).toBe(false);
    const wagesOnly = base.facts.filter(
      (fact) => fact.category !== "capital_gains" && fact.category !== "investment_income",
    );
    const run = evaluate(wagesOnly, [decision("decisions.scope.has_reportable_sales", false)]);
    expect(run.files(SD)).toBe(false);
  });

  it("an explicit false wins; Schedule CA (540NR) line 7a is then a named gap", () => {
    const run = evaluate(base.facts, [
      decision("decisions.scope.must_file_schedule_d_540nr", false),
    ]);
    expect(run.files(SD)).toBe(false);
    expect(run.field(CA, "0.line.7a_subtractions")).toMatchObject({ ok: false, unsupported: true });
  });

  it("asks for the California carryover when the federal return carries a loss over", () => {
    const facts = base.facts.filter((fact) => fact.key !== CA_CAPITAL_LOSS_CARRYOVER_KEY);
    const run = evaluate(facts);
    expect(run.pending.pendingFacts).toContain(CA_CAPITAL_LOSS_CARRYOVER_KEY);
    expect(run.value(SD, "0.line.4")).toBe(11500);
    expect(run.value(SD, "0.line.7")).toBeUndefined();
    expect(run.value(SD, "0.line.12a")).toBeUndefined();
  });

  it("does not ask with no federal carryover", () => {
    const facts = base.facts.filter(
      (fact) =>
        fact.key !== CA_CAPITAL_LOSS_CARRYOVER_KEY &&
        fact.key !== CAPITAL_LOSS_CARRYOVER_KEYS.shortTerm,
    );
    const run = evaluate(facts);
    expect(run.pending.pendingFacts).not.toContain(CA_CAPITAL_LOSS_CARRYOVER_KEY);
    expect(run.value(SD, "0.line.6")).toBeUndefined();
  });
});

describe("Schedule D (540NR) gaps", () => {
  it("a Form 6781 section 1256 gain: every total and Schedule CA (540NR) line 7a are gaps", () => {
    const statement = numberFact("capital_gains", makeSection1256StatementFactKey("harbor-light"), {
      brokerName: "Harbor Light Brokerage",
      box11: 2000,
    });
    const run = evaluate([...base.facts, statement]);
    for (const line of ["4", "5", "7", "8", "9", "11", "12a", "12b"]) {
      expect(run.field(SD, `0.line.${line}`)).toMatchObject({ ok: false, unsupported: true });
    }
    expect(run.value(SD, "0.line.1a.gain")).toBe(10000);
    expect(run.field(CA, "0.line.7a_subtractions")).toMatchObject({ ok: false, unsupported: true });
    expect(run.field(CA, "0.line.7a_additions")).toMatchObject({ ok: false, unsupported: true });
  });

  it("a Form 4797 section 1231 gain: Schedule D-1's row as a resident, or a gap when that return needs Schedule D-1", () => {
    const AS_PART_YEAR = [
      decision("decisions.scope.ca_residency", "part_year"),
      decision("decisions.scope.must_file_540nr", true),
      decision("decisions.scope.must_file_ca_540", false),
    ];
    const run = (facts: TaxFactRow[]) => {
      const result = evaluateScenario({
        filing: { id: "schedule-d-540nr-4797", taxYear: tylin.taxYear },
        facts,
        decisions: [
          ...tylin.decisions.filter(
            (each) => !AS_PART_YEAR.some((answer) => answer.decisionKey === each.decisionKey),
          ),
          ...AS_PART_YEAR,
        ],
        authEmail: null,
      });
      return (id: string) =>
        result.forms.get(SD)?.fields.find((each) => each.fieldId === `${SD}.${id}`)?.result;
    };
    const differs = run(tylin.facts);
    expect(differs("0.line.4")).toMatchObject({ ok: false, unsupported: true });
    expect(String((differs("0.line.12a") as { reason?: string }).reason)).toContain("Schedule D-1");
    const same = run(withoutCaliforniaAmounts(tylin.facts));
    expect(same("0.line.1a.description")).toMatchObject({ ok: true, value: SECTION_1231_ROW });
    const gain = same("0.line.1a.gain");
    expect(gain).toMatchObject({ ok: true });
    expect(same("0.line.10")).toMatchObject({ ok: true });
  });

  it("names the California Schedule K-1 on line 2", () => {
    expect(K1_GAP).toContain("California Schedule(s) K-1");
  });
});

describe("Schedule D (540NR), no facts, nothing changes", () => {
  it("a full-year resident's return files no Schedule D (540NR) and keeps Schedule D (540)", () => {
    const resident = evaluate(base.facts, AS_RESIDENT);
    expect(resident.files(SD)).toBe(false);
    expect(resident.value("schedule-d-ca", "3.line.12a")).toBe(3700);
    expect(resident.value("schedule-ca", "0.line.7a_subtractions")).toBe(3700);
  });
});
