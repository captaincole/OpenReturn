/*
 * Form 1040 line 1h (irs-1040-inst-2025::sec::line-1h::b01, b02, b03): the
 * elective-deferral limit by age and plan, and corrective distributions.
 * tcb-us-010 (born 1975, a disability pension on line 1h) with one change each.
 */

import { describe, expect, it } from "vitest";
import {
  makeRetirementDistributionFactKey,
  type RetirementDistributionFactValue,
  type W2Box12Entry,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { line1hGap } from "../../../../src/federal/1040/line1hGaps.js";
import { evaluateScenario } from "../../../../src/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { tcbUs010Scenario as base } from "../../../scenarios/tcb-us-010/index.js";

const withBox12 = (box12: W2Box12Entry[], dob: string) =>
  base.facts.map((fact) => {
    if (fact.key === "employer.employer") {
      return { ...fact, value: { ...(fact.value as object), box12 } };
    }
    return fact.key === "identity.dob" ? { ...fact, value: dob } : fact;
  });

const gap = (facts: TaxFactRow[]) =>
  line1hGap(makeResolverInputs({ facts, decisions: base.decisions }));

describe("excess elective deferrals", () => {
  it.each([
    ["under 50: $23,500", "06/01/1985", [{ code: "D", amount: 23500 }], false],
    ["under 50: one dollar over", "06/01/1985", [{ code: "D", amount: 23501 }], true],
    ["50 to 59: $7,500 catch-up", "06/01/1970", [{ code: "D", amount: 31000 }], false],
    ["50 to 59: one dollar over", "06/01/1970", [{ code: "D", amount: 31001 }], true],
    ["60 to 63: $11,250 catch-up", "06/01/1964", [{ code: "D", amount: 34750 }], false],
    ["60 to 63: one dollar over", "06/01/1964", [{ code: "D", amount: 34751 }], true],
    ["64: back to $7,500", "06/01/1961", [{ code: "D", amount: 31001 }], true],
    ["403(b): the 15-year rule's $3,000", "06/01/1985", [{ code: "E", amount: 26500 }], false],
    ["SIMPLE only: $17,600", "06/01/1985", [{ code: "S", amount: 17600 }], false],
    ["SIMPLE only: one dollar over", "06/01/1985", [{ code: "S", amount: 17601 }], true],
    [
      "designated Roth contributions count toward the limit",
      "06/01/1985",
      [
        { code: "D", amount: 20000 },
        { code: "AA", amount: 5000 },
      ],
      true,
    ],
    ["457(b) has its own limit", "06/01/1985", [{ code: "G", amount: 30000 }], false],
  ] as Array<[string, string, W2Box12Entry[], boolean]>)("%s", (_, dob, box12, isGap) => {
    expect(gap(withBox12(box12, dob)) !== undefined).toBe(isGap);
  });
});

const PAYER_KEY = makeRetirementDistributionFactKey("plan", "code-8");
const withCorrective = (box7: string) => [
  ...base.facts,
  {
    ...base.facts[0],
    id: "f-corrective",
    category: "retirement",
    key: PAYER_KEY,
    value: {
      payerName: "Plan",
      box1: 500,
      box2a: 500,
      box7,
      box7IraSepSimple: false,
    } satisfies RetirementDistributionFactValue,
  },
];

function form1040(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "line-1h-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const form = result.forms.get("form-1040")!;
  return (id: string) => {
    const field = form.fields.find((each) => each.fieldId === `form-1040.${id}`)!;
    return field.result.ok
      ? field.result.value
      : field.result.unsupported
        ? "unsupported"
        : undefined;
  };
}

describe("corrective distributions", () => {
  it("code 8 goes on line 1h, not line 5a", () => {
    const line = form1040(withCorrective("8"));
    expect(line("line.1h_amount")).toBe(11500);
    expect(line("line.5a")).toBeUndefined();
  });

  it("code P or a designated Roth excess (B) is unsupported on line 1h", () => {
    expect(form1040(withCorrective("P"))("line.1h_amount")).toBe("unsupported");
    expect(form1040(withCorrective("B8"))("line.1h_amount")).toBe("unsupported");
  });
});
