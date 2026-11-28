/*
 * One facility on Form 8835 and on Form 7211: a facility cannot take the
 * section 45 credit and the section 45Y credit
 * (irs-7211-inst-2025::sec::how-to-claim-the-credit::b01). When the facts show
 * the same facility on both (same address, coordinates or registration
 * number), each form's credit is a gap, on its own line and on Form 3800. The
 * synthetic wit scenario (Form 8835) is the base, with tad's facility (Form
 * 7211) added.
 */

import { describe, expect, it } from "vitest";
import {
  makeCleanElectricityFacilityFactKey,
  makeRenewableElectricityFacilityFactKey,
  type CleanElectricityFacilityFactValue,
  type RenewableElectricityFacilityFactValue,
} from "../../../src/facts/index.js";
import type { TaxFactRow } from "../../../src/facts/rows.js";
import { BOTH_PRODUCTION_CREDITS_GAP } from "../../../src/federal/electricityFacilities.js";
import { evaluateScenario } from "../../../src/index.js";
import { CAPROCK_SOLAR } from "../../scenarios/synthetic/tad/facts.js";
import { CAPROCK } from "../../scenarios/synthetic/wit/facts.js";
import { witScenario as wit } from "../../scenarios/synthetic/wit/index.js";

const RENEWABLE_KEY = makeRenewableElectricityFacilityFactKey("caprock-ridge");
const CLEAN_KEY = makeCleanElectricityFacilityFactKey("caprock-solar");
const FORM_8835_LINE_15 = "form-8835.2.part2.15_add_lines_13_14";
const FORM_7211_LINE_11 = "form-7211.1.part2.11_add_lines_9_10";
const FORM_3800_4E = "form-3800.3.part3.4e_form_8835_part_ii_col_e";
const FORM_3800_1GG = "form-3800.2.part3.1gg_form_7211_part_ii_col_e";

/* A wind facility begun in 2024 and placed in service in 2025: it fits both forms. */
const RENEWABLE: RenewableElectricityFacilityFactValue = {
  ...CAPROCK,
  constructionBegan: "2024-09-16",
  placedInService: "2025-03-10",
};

const row = (key: string, value: unknown): TaxFactRow => ({
  ...wit.facts[0]!,
  id: `f-${key}`,
  category: "other",
  key,
  value,
});

function run(
  clean: CleanElectricityFacilityFactValue,
  renewable: RenewableElectricityFacilityFactValue = RENEWABLE,
) {
  const facts = [
    ...wit.facts.filter((fact) => !fact.key.startsWith("renewable_electricity.")),
    row(RENEWABLE_KEY, renewable),
    row(CLEAN_KEY, clean),
  ];
  const result = evaluateScenario({
    filing: { id: "electricity-facilities-test", taxYear: 2025 },
    facts,
    decisions: wit.decisions,
    authEmail: null,
  });
  return (formId: string, fieldId: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId)?.result;
}

const reasonOf = (result: unknown) => {
  const found = result as { unsupported?: boolean; reason?: string } | undefined;
  return found?.unsupported === true ? found.reason : undefined;
};

describe("one facility on Form 8835 and Form 7211 (how-to-claim-the-credit::b01)", () => {
  it("the same address: both credits are gaps, on each form and on Form 3800", () => {
    const field = run({ ...CAPROCK_SOLAR, address: RENEWABLE.address!, coordinates: undefined });
    for (const [formId, fieldId] of [
      ["form-8835", FORM_8835_LINE_15],
      ["form-7211", FORM_7211_LINE_11],
      ["form-3800", FORM_3800_4E],
      ["form-3800", FORM_3800_1GG],
    ] as const) {
      expect(reasonOf(field(formId, fieldId))).toContain("how-to-claim-the-credit::b01");
    }
    expect(reasonOf(field("form-8835", FORM_8835_LINE_15))).toBe(BOTH_PRODUCTION_CREDITS_GAP);
  });

  it("the same coordinates at a differently written address: both are gaps", () => {
    const field = run({ ...CAPROCK_SOLAR, coordinates: RENEWABLE.coordinates });
    expect(reasonOf(field("form-8835", FORM_8835_LINE_15))).toBe(BOTH_PRODUCTION_CREDITS_GAP);
    expect(reasonOf(field("form-7211", FORM_7211_LINE_11))).toBe(BOTH_PRODUCTION_CREDITS_GAP);
  });

  it("the same transfer registration number at another place: both are gaps", () => {
    const transfer = { direction: "sold" as const, amount: 1_000, registrationNumber: "R-45" };
    const field = run({ ...CAPROCK_SOLAR, transfer }, { ...RENEWABLE, transfer });
    expect(reasonOf(field("form-8835", FORM_8835_LINE_15))).toBe(BOTH_PRODUCTION_CREDITS_GAP);
    expect(reasonOf(field("form-7211", FORM_7211_LINE_11))).toBe(BOTH_PRODUCTION_CREDITS_GAP);
  });

  it("another place: each form figures its own credit", () => {
    const field = run(CAPROCK_SOLAR);
    expect(reasonOf(field("form-8835", FORM_8835_LINE_15))).toBeUndefined();
    expect(reasonOf(field("form-7211", FORM_7211_LINE_11))).toBeUndefined();
    expect(field("form-7211", FORM_7211_LINE_11)).toMatchObject({ ok: true });
  });
});
