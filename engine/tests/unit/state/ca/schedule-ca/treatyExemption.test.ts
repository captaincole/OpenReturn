/*
 * Schedule CA (540) line 8z column C adds back a federal treaty exemption:
 * "If a tax treaty exemption is claimed on federal Schedule 1 (Form 1040) ...
 * line 8z, enter that amount on Schedule CA (540), Part I ... line 8z, column C
 * as a positive number" (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-12::b04).
 * The base is the synthetic irella return moved to California: $31,400 of
 * wages and a $5,000 treaty exemption (-5,000 on Schedule 1 line 8z).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { OTHER_INCOME_KEYS } from "../../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../../src/index.js";
import { treatyExemptionAddBack } from "../../../../../src/state/ca/schedule-ca/treatyExemption.js";
import { decisionRow, identityFact } from "../../../../helpers/fixtureBuilders.js";
import { irellaScenario as base } from "../../../../scenarios/synthetic/irella/index.js";

/* Each case evaluates a whole return synchronously; yield so the worker can report. */
beforeEach(() => new Promise<void>((resolve) => setImmediate(resolve)));

const decisions = [
  ...base.decisions.filter(
    (row) =>
      row.decisionKey !== "decisions.scope.must_file_ca_540" &&
      row.decisionKey !== "decisions.scope.ca_residency",
  ),
  ...[
    ["decisions.scope.must_file_ca_540", true],
    ["decisions.scope.ca_residency", "full_year"],
  ].map(([key, decision]) =>
    decisionRow({
      userId: base.userId,
      taxYear: base.taxYear,
      key: key as string,
      decision,
      rationale: "test",
    }),
  ),
];

const californiaFacts = base.facts.map((row) =>
  row.key.endsWith("address.state")
    ? identityFact({
        userId: base.userId,
        taxYear: base.taxYear,
        suffix: "address.state",
        value: "CA",
      })
    : row,
);

const withLine8z = (items: Array<{ description: string; amount: number }>): TaxFactRow[] =>
  californiaFacts.map((row) =>
    row.key === OTHER_INCOME_KEYS.otherItems ? { ...row, value: items } : row,
  );

function fields(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "treaty-ca", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const read = (formId: string, fieldId: string) =>
    result.forms.get(formId)?.fields.find((field) => field.fieldId === `${formId}.${fieldId}`)
      ?.result;
  return { read };
}

describe("Schedule CA (540) line 8z column C: a treaty exemption", () => {
  it("adds the exemption back, so California AGI keeps the exempt wages", () => {
    const { read } = fields(californiaFacts);
    expect(read("schedule-ca", "1.line.b8z_federal")).toMatchObject({ ok: true, value: -5000 });
    expect(read("schedule-ca", "1.line.b8z_additions")).toMatchObject({ ok: true, value: 5000 });
    expect(read("schedule-ca", "2.line.b9a_additions")).toMatchObject({ ok: true, value: 5000 });
    expect(read("schedule-ca", "3.line.c27_additions")).toMatchObject({ ok: true, value: 5000 });
    expect(read("form-540", "line.13_federal_agi")).toMatchObject({ ok: true, value: 26400 });
    expect(read("form-540", "line.16_ca_adjustments_additions")).toMatchObject({
      ok: true,
      value: 5000,
    });
    expect(read("form-540", "line.17_ca_agi")).toMatchObject({ ok: true, value: 31400 });
    expect(read("form-540", "line.19_taxable_income")).toMatchObject({ ok: true, value: 25694 });
  });

  it("another line 8z item next to the exemption: column C is a gap", () => {
    const { read } = fields(
      withLine8z([
        { description: "Exempt income, treaty", amount: -5000 },
        { description: "Prize from a contest", amount: 700 },
      ]),
    );
    const columnC = read("schedule-ca", "1.line.b8z_additions");
    expect(columnC).toMatchObject({ ok: false, unsupported: true });
    expect(JSON.stringify(columnC)).toContain("treaty exemption");
  });

  it("no item below 0: the add-back is absent and column C keeps its earlier rule", () => {
    expect(treatyExemptionAddBack({ otherIncomeItems: [{ description: "x", amount: 700 }] })).toBe(
      undefined,
    );
    expect(treatyExemptionAddBack({ otherIncomeItems: undefined })).toBe(undefined);
    const { read } = fields(withLine8z([{ description: "Prize from a contest", amount: 700 }]));
    expect(read("schedule-ca", "1.line.b8z_additions")).toMatchObject({
      ok: false,
      unsupported: true,
    });
    expect(JSON.stringify(read("schedule-ca", "1.line.b8z_additions"))).not.toContain("treaty");
  });

  it("two exempt items add up as one positive amount", () => {
    expect(
      treatyExemptionAddBack({
        otherIncomeItems: [
          { description: "a", amount: -5000 },
          { description: "b", amount: -1200.4 },
        ],
      }),
    ).toBe(6200);
  });
});
