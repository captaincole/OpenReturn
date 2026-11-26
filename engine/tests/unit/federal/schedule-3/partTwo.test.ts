/*
 * Schedule 3 Part II on a whole return: lines 10, 11 and 15, who files, and
 * Form 1040 line 31, which takes line 15. The synthetic nacelle scenario is
 * the base: two employers, $970 of excess social security tax and $2,000 paid
 * with Form 4868.
 */

import { describe, expect, it } from "vitest";
import {
  ESTIMATED_TAX_KEYS,
  makeW2FactKey,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { RAILROAD_W2_GAP } from "../../../../src/federal/schedule-3/excessSocialSecurity.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { nacelleScenario as base } from "../../../scenarios/synthetic/nacelle/index.js";

const FIRST_W2 = makeW2FactKey("truckee-meadows");
const SECOND_W2 = makeW2FactKey("washoe-valley");
const SPOUSE_SSN = "400-00-3012";

const valueOf = (key: string) => base.facts.find((fact) => fact.key === key)!.value as W2FactValue;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

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

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "schedule-3-part-two-test", taxYear: base.taxYear },
    facts,
    decisions,
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
  const partTwo = () => [
    value("schedule-3", "0.line.10"),
    value("schedule-3", "0.line.11"),
    value("schedule-3", "0.line.15"),
    value("form-1040", "line.31"),
  ];
  return { files, field, value, partTwo };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

describe("nacelle: lines 10, 11 and 15, and Form 1040 line 31", () => {
  it("line 10 $2,000, line 11 $970 (11,888.50 − 10,918.20 = 970.30), line 15 and line 31 $2,970", () => {
    const run = evaluate(base.facts);
    expect(run.files("schedule-3")).toBe(true);
    expect(run.partTwo()).toEqual([2000, 970, 2970, 2970]);
  });

  it("the extension payment alone files Schedule 3", () => {
    const run = evaluate(factsWith({ [SECOND_W2]: undefined }));
    expect(run.files("schedule-3")).toBe(true);
    expect(run.partTwo()).toEqual([2000, undefined, 2000, 2000]);
  });

  it("the excess social security tax alone files Schedule 3", () => {
    const run = evaluate(factsWith({ [ESTIMATED_TAX_KEYS.extensionPayment]: undefined }));
    expect(run.files("schedule-3")).toBe(true);
    expect(run.partTwo()).toEqual([undefined, 970, 970, 970]);
  });

  it("with neither, Schedule 3 does not file and line 31 is blank, not a gap", () => {
    const run = evaluate(
      factsWith({ [SECOND_W2]: undefined, [ESTIMATED_TAX_KEYS.extensionPayment]: undefined }),
    );
    expect(run.files("schedule-3")).toBe(false);
    expect(isGap(run.field("form-1040", "line.31"))).toBe(false);
    expect(run.value("form-1040", "line.31")).toBeUndefined();
  });
});

describe("line 11 is figured for each person", () => {
  const joint = [
    ...base.decisions.filter((each) => each.decisionKey !== "decisions.scope.filing_status"),
    decision("decisions.scope.filing_status", "married_filing_jointly"),
  ];
  const spouseW2 = (box4: number): W2FactValue => ({
    ...valueOf(SECOND_W2),
    owner: "spouse",
    employerEin: "00-0031103",
    employee: { firstName: "Corin", lastName: "Varrow", ssn: SPOUSE_SSN },
    box4,
  });

  it("a joint return never adds one spouse's tax to the other's", () => {
    // Taxpayer one employer (6,971.90); spouse one employer (4,916.60): no excess for either.
    const run = evaluate(factsWith({ [SECOND_W2]: spouseW2(4916.6) }), joint);
    expect(run.value("schedule-3", "0.line.11")).toBeUndefined();
  });

  it("each spouse's excess is added on line 11", () => {
    // Taxpayer 970.30; spouse 6,000 + 6,000 − 10,918.20 = 1,081.80; together 2,052.10 → 2,052.
    const spouseSecond = { ...spouseW2(6000), employerEin: "00-0031104" };
    const run = evaluate(
      factsWith({}, [
        row("wages", makeW2FactKey("spouse-first"), spouseW2(6000)),
        row("wages", makeW2FactKey("spouse-second"), spouseSecond),
      ]),
      joint,
    );
    expect(run.value("schedule-3", "0.line.11")).toBe(2052);
  });
});

describe("the gaps", () => {
  it("a railroad W-2 with another employer makes lines 11 and 15 and Form 1040 line 31 gaps", () => {
    const railroad = {
      ...valueOf(SECOND_W2),
      box4: 0,
      box14: [{ label: "Tier 1 tax", amount: 4916.6 }],
    };
    const run = evaluate(factsWith({ [SECOND_W2]: railroad }));
    expect(run.files("schedule-3")).toBe(true);
    expect(run.field("schedule-3", "0.line.11")).toMatchObject({ reason: RAILROAD_W2_GAP });
    expect(isGap(run.field("schedule-3", "0.line.15"))).toBe(true);
    expect(isGap(run.field("form-1040", "line.31"))).toBe(true);
  });

  it("one employer that withheld too much: no line 11, the employer refunds it", () => {
    const one = { ...valueOf(FIRST_W2), box4: 11500 };
    const run = evaluate(
      factsWith({
        [FIRST_W2]: one,
        [SECOND_W2]: undefined,
        [ESTIMATED_TAX_KEYS.extensionPayment]: undefined,
      }),
    );
    expect(run.files("schedule-3")).toBe(false);
  });
});
