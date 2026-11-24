import { describe, expect, it } from "vitest";
import { evaluateScenario } from "../../src";
import {
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  type K1HoldingFactValue,
  type SCorporationK1FactValue,
} from "../../src/facts";
import type { TaxFactRow } from "../../src/facts/rows";
import { cadsuaneScenario } from "../scenarios/synthetic/cadsuane";

/*
 * Form 8582 Part I combines every passive activity
 * (irs-8582-inst-2025::sec::specific-instructions::b01). A passive S corporation
 * K-1 has no Form 8582 row in the engine yet, so next to it Form 8582's amounts,
 * and the partnership's allowed passive loss, are a gap that names it: never a
 * computed 0 that leaves its $50,000 of passive income out.
 */

const fact = (key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: "form8582-other-k1s",
  taxYear: 2025,
  category: "k1",
  key,
  value,
  sourceNote: "made up for this test",
  createdAt: "2026-11-23T00:00:00Z",
});

const sCorporationK1: SCorporationK1FactValue = {
  form: "1120-S",
  entityName: "Shienar Outfitters, Inc.",
  entityEin: "00-0007120",
  sharesAtStart: 100,
  sharesAtEnd: 100,
  boxes: [{ box: "1", amount: 50000 }],
};

const sCorporationHolding: K1HoldingFactValue = {
  owner: "taxpayer",
  materiallyParticipated: false,
  allInvestmentAtRisk: true,
  stockBasisAtStart: 20000,
};

function run(holding: K1HoldingFactValue, box1 = 50000, keep = ["tar-valon-boatworks"]) {
  const k1Ids = ["tar-valon-boatworks", "caemlyn-apartments"];
  const own = cadsuaneScenario.facts.filter(
    (row) => !k1Ids.some((id) => row.key.endsWith(id) && !keep.includes(id)),
  );
  const facts = [
    ...own,
    fact(makeSCorporationK1FactKey("shienar-outfitters"), {
      ...sCorporationK1,
      boxes: [{ box: "1", amount: box1 }],
    }),
    fact(makeK1HoldingFactKey("shienar-outfitters"), holding),
  ];
  const result = evaluateScenario({
    filing: { id: "form8582-other-k1s", taxYear: 2025 },
    facts,
    decisions: cadsuaneScenario.decisions,
    authEmail: null,
  });
  const field = (fieldId: string) =>
    result.forms.get(fieldId.split(".")[0])?.fields.find((entry) => entry.fieldId === fieldId)
      ?.result;
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return { field, files };
}

const gapNaming = (result: ReturnType<ReturnType<typeof run>["field"]>, name: string) =>
  result !== undefined && !result.ok && (result.reason ?? "").includes(name);

describe("Form 8582 next to a passive S corporation K-1 it cannot take", () => {
  const passive = run(sCorporationHolding);

  it("files Form 8582 and makes its lines a gap that names the S corporation", () => {
    expect(passive.files("form-8582")).toBe(true);
    for (const fieldId of [
      "form-8582.0.line.2b_other_net_loss",
      "form-8582.0.line.3_combined",
      "form-8582.1.part5.row_1_col_b_net_loss",
      "form-8582.1.part8.row_1_col_c_allowed_loss",
    ]) {
      expect(gapNaming(passive.field(fieldId), "Shienar Outfitters, Inc."), fieldId).toBe(true);
    }
    expect(gapNaming(passive.field("form-8582.0.header.name"), "Shienar")).toBe(false);
  });

  it("makes the partnership's allowed passive loss a gap, not a computed amount", () => {
    const column = passive.field("schedule-e.1.line.28_row_a_col_g_passive_loss_allowed");
    expect(column?.ok).toBe(false);
    expect(gapNaming(column, "Shienar Outfitters, Inc.")).toBe(true);
    const line32 = passive.field("schedule-e.1.line.32_total_partnership_s_corp_income");
    expect(line32?.ok).toBe(false);
  });

  it("waits, rather than computes, while the S corporation's participation answer is missing", () => {
    const open = run({ ...sCorporationHolding, materiallyParticipated: undefined });
    const line3 = open.field("form-8582.0.line.3_combined");
    expect(line3?.ok === true && line3.value !== undefined).toBe(false);
    expect(open.field("schedule-e.1.line.28_row_a_col_g_passive_loss_allowed")).not.toMatchObject({
      ok: true,
      value: 0,
    });
  });

  it("files Form 8582 for a passive S corporation loss alone, its lines the gap", () => {
    const loss = run(sCorporationHolding, -10000, []);
    expect(loss.files("form-8582")).toBe(true);
    expect(gapNaming(loss.field("form-8582.0.line.3_combined"), "Shienar")).toBe(true);
  });

  it("leaves Form 8582 unfiled for passive S corporation income alone", () => {
    expect(run(sCorporationHolding, 50000, []).files("form-8582")).toBe(false);
  });
});
