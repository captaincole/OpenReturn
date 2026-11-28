/*
 * Form 7211 on a whole return: who files, the copies, Form 3800 line 1gg, the
 * K-1 credits on the separate form, the waits and the gaps. The synthetic tad
 * scenario (one facility) is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeCleanElectricityFacilityFactKey,
  makeGeneralBusinessCreditFactKey,
  makeInvestmentCreditPropertyFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type CleanElectricityFacilityFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { form7211Bindings } from "../../../../src/federal/7211/bindings.js";
import catalogJson from "../../../../src/federal/7211/catalog.json";
import { PASS_THROUGH_OWNER } from "../../../../src/federal/7211/partI.js";
import { resolve7211Info } from "../../../../src/federal/7211/resolveInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { SOLAR } from "../../../scenarios/synthetic/aram/facts.js";
import { CAPROCK_SOLAR } from "../../../scenarios/synthetic/tad/facts.js";
import { tadScenario as tad } from "../../../scenarios/synthetic/tad/index.js";

const FACILITY_KEY = makeCleanElectricityFacilityFactKey("caprock-solar");
const PARTNERSHIP = "mesa-wind-partners";
const K1_KEY = makePartnershipK1FactKey(PARTNERSHIP);
const LINE_1GG = "2.part3.1gg_form_7211_part_ii";

const base = tad.facts[0]!;
const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base,
  id: `f-${key}`,
  category,
  key,
  value,
});
const isFacility = (fact: TaxFactRow) => fact.key === FACILITY_KEY;
const withFacility = (value: Partial<CleanElectricityFacilityFactValue>) =>
  tad.facts.map((fact) =>
    isFacility(fact) ? { ...fact, value: { ...CAPROCK_SOLAR, ...value } } : fact,
  );

/* A wind partnership the taxpayer works in, with a box 15 code W credit. */
const windK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Mesa Wind Partners LLC",
  entityEin: "00-0007212",
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "general",
  profitPercent: 10,
  lossPercent: 10,
  capitalPercent: 10,
  boxes: [
    { box: "1", amount: 6000 },
    { box: "15", code: "W", amount: 2500 },
  ],
};
const windFacts = [
  row("k1", K1_KEY, windK1),
  row("k1", makeK1HoldingFactKey(PARTNERSHIP), {
    owner: "taxpayer",
    materiallyParticipated: true,
    allInvestmentAtRisk: true,
    partnershipBasisAtStart: 40000,
  }),
];

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = tad.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-7211-test", taxYear: 2025 },
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
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;
const infoOf = (facts: TaxFactRow[]) =>
  resolve7211Info(makeResolverInputs({ facts, decisions: tad.decisions }));

describe("Form 7211 bindings", () => {
  it("give every catalog field one rule", () => {
    const bound = Object.keys(form7211Bindings()).sort();
    const fields = catalogJson.fields.map((each) => each.fieldId.slice("form-7211.".length));
    expect(bound).toEqual(fields.sort());
  });
});

describe("who files Form 7211", () => {
  it("no facility fact: no Form 7211, no Form 3800, and Form 1040 line 20 is blank", () => {
    const run = evaluate(tad.facts.filter((fact) => !isFacility(fact)));
    expect(run.files("form-7211")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
    expect(run.value("form-1040", "line.20")).toBeUndefined();
    expect(run.value("form-1040", "line.22")).toBe(41_784);
  });

  it("a facility files it, and Form 3800 line 1gg takes line 11", () => {
    const run = evaluate(tad.facts);
    expect(run.files("form-7211")).toBe(true);
    expect(run.value("form-7211", "1.part2.11_add_lines_9_10")).toBe(40_462);
    expect(run.value("form-3800", `${LINE_1GG}_col_e`)).toBe(40_462);
    expect(run.value("schedule-3", "0.line.6a")).toBe(8_009);
  });

  it("the explicit decision wins: false files no Form 7211 and gives Form 3800 nothing from it", () => {
    const decisions = [
      ...tad.decisions,
      decisionRow({
        userId: tad.userId,
        taxYear: tad.taxYear,
        key: "decisions.scope.must_file_7211",
        decision: false,
        rationale: "test",
      }),
    ];
    const run = evaluate(tad.facts, decisions);
    expect(run.files("form-7211")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
  });

  it("a K-1 credit alone files no Form 7211: it goes directly on Form 3800 line 1gg", () => {
    const facts = [...tad.facts.filter((fact) => !isFacility(fact)), ...windFacts];
    const run = evaluate(facts);
    expect(run.files("form-7211")).toBe(false);
    expect(run.value("form-3800", `${LINE_1GG}_col_e`)).toBe(2_500);
  });
});

describe("the copies", () => {
  it("a facility and a K-1 credit: the separate form prints line 10, and Form 3800 counts each once", () => {
    const facts = [...tad.facts, ...windFacts];
    const copies = infoOf(facts).form7211Copies ?? [];
    expect(copies.map((copy) => copy.key)).toEqual([FACILITY_KEY, "pass_through_credits"]);
    const bindings = form7211Bindings();
    const second = { ...infoOf(facts), form7211CopyIndex: 1 };
    expect(bindings["0.part1.2a_i_owner_name"]!({}, second)).toBe(PASS_THROUGH_OWNER);
    expect(bindings["1.part2.10_passthrough_credit"]!({}, second)).toBe(2_500);
    expect(bindings["1.part2.11_add_lines_9_10"]!({}, second)).toBe(2_500);
    expect(bindings["0.part2.1_kwh_col_a"]!({}, second)).toBeUndefined();
    const run = evaluate(facts);
    expect(run.value("form-7211", "1.part2.10_passthrough_credit")).toBeUndefined();
    expect(run.value("form-7211", "1.part2.11_add_lines_9_10")).toBe(40_462);
    expect(run.value("form-3800", "2.part3.2_add_lines_1a_1zz_col_e")).toBe(42_962);
  });

  it("two facilities: two copies, and line 1gg adds both", () => {
    const second = row("other", makeCleanElectricityFacilityFactKey("barn-roof"), {
      ...CAPROCK_SOLAR,
      address: "18 Barn Lane, Snyder, TX 79549",
      coordinates: undefined,
      kilowattHours: 100_000,
      energyCommunity: false,
      domesticContent: false,
      financing: undefined,
    });
    const facts = [...tad.facts, second];
    expect(infoOf(facts).form7211Copies?.length).toBe(2);
    expect(evaluate(facts).value("form-3800", "2.part3.2_add_lines_1a_1zz_col_e")).toBe(43_462);
  });
});

describe("Part I answers", () => {
  it("the base amount with 7d; no bonus checks both No boxes", () => {
    const facts = withFacility({
      netOutputUnder1Mw: false,
      energyCommunity: false,
      domesticContent: false,
      financing: undefined,
    });
    const run = evaluate(facts);
    expect(run.value("form-7211", "0.part1.7d_alt_amount_no")).toBe(true);
    expect(run.value("form-7211", "0.part1.8_energy_community_bonus_no")).toBe(true);
    expect(run.value("form-7211", "0.part1.9_domestic_content_bonus_no")).toBe(true);
    expect(run.value("form-7211", "0.part2.1_applicable_amount_col_b")).toBe(0.006);
    expect(run.value("form-7211", "0.part2.1_credit_amount_col_c")).toBe(7_707);
    expect(run.value("form-7211", "1.part2.6a_tax_exempt_bond_ratio")).toBeUndefined();
  });

  it("a petition prints lines 5 and 6; an early start checks 7b; PWA checks 7c", () => {
    const facts = withFacility({
      constructionBegan: "2023-01-10",
      prevailingWageAndApprenticeship: true,
      provisionalEmissionsRate: { valueFromDoe: true, lcaModel: false, doeControlNumber: "DOE-1" },
    });
    const run = evaluate(facts);
    expect(run.value("form-7211", "0.part1.5_i_per_doe_emissions_value")).toBe(true);
    expect(run.value("form-7211", "0.part1.5_ii_per_designated_lca_model")).toBeUndefined();
    expect(run.value("form-7211", "0.part1.6_doe_control_number")).toBe("DOE-1");
    for (const box of [
      "7a_alt_amount_under_1_megawatt",
      "7b_alt_amount_construction_before_2023",
      "7c_alt_amount_wage_apprenticeship",
    ]) {
      expect(run.value("form-7211", `0.part1.${box}`)).toBe(true);
    }
    expect(run.value("form-7211", "0.part1.7d_alt_amount_no")).toBeUndefined();
  });

  it("a transfer prints its registration number on line 1 and reaches Form 3800 column (b)", () => {
    const transfer = {
      direction: "sold" as const,
      amount: 10_000,
      registrationNumber: "REG-7211-01",
    };
    const run = evaluate(
      withFacility({ transfer, owner: { name: "Caprock Solar LLC", tin: "00-0007213" } }),
    );
    expect(run.value("form-7211", "0.part1.1_irs_registration_number")).toBe("REG-7211-01");
    expect(run.value("form-7211", "0.part1.2a_i_owner_name")).toBe("Caprock Solar LLC");
    expect(run.value("form-7211", "0.part1.2a_ii_owner_tin")).toBe("00-0007213");
    expect(run.value("form-3800", `${LINE_1GG}_col_b`)).toBe("REG-7211-01");
  });
});

describe("waits and gaps", () => {
  it("a missing answer: the facility waits, and Form 7211 and Form 3800 list it", () => {
    const facts = withFacility({ energyCommunity: undefined as unknown as boolean });
    const run = evaluate(facts);
    expect(run.missing("form-7211")).toEqual([FACILITY_KEY]);
    expect(run.missing("form-3800")).toContain(FACILITY_KEY);
  });

  it("placed in service before 2025: line 11 is a gap, and so is line 1gg", () => {
    const run = evaluate(withFacility({ placedInService: "2024-12-20" }));
    expect(isGap(run.field("form-7211", "1.part2.11_add_lines_9_10"))).toBe(true);
    expect(isGap(run.field("form-3800", `${LINE_1GG}_col_e`))).toBe(true);
  });

  it("another credit claimed for the facility: line 11 is a gap", () => {
    const run = evaluate(withFacility({ otherCreditClaimed: true }));
    expect(isGap(run.field("form-7211", "1.part2.11_add_lines_9_10"))).toBe(true);
  });

  it("a Form 3468 property at the same address: line 11 is a gap", () => {
    const property = { ...SOLAR, facility: { ...SOLAR.facility, address: CAPROCK_SOLAR.address } };
    const facts = [
      ...tad.facts,
      row("other", makeInvestmentCreditPropertyFactKey("same"), property),
    ];
    const run = evaluate(facts);
    expect(isGap(run.field("form-7211", "1.part2.11_add_lines_9_10"))).toBe(true);
  });

  it("an elective payment: line 9 is a gap, since an individual cannot make it", () => {
    const electivePayment = { amount: 40_462, registrationNumber: "REG-7211-02" };
    const run = evaluate(withFacility({ electivePayment }));
    expect(isGap(run.field("form-7211", "1.part2.9_elective_payment_phaseout"))).toBe(true);
    expect(isGap(run.field("form-7211", "1.part2.11_add_lines_9_10"))).toBe(true);
    expect(run.value("form-7211", "0.part1.1_irs_registration_number")).toBe("REG-7211-02");
  });

  it("a stated line 1gg credit with no entity next to a facility: the engine cannot tell them apart", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("own-1gg"), {
      line: "1gg",
      sourceForm: "7211 Part II",
      amount: 40_462,
      passive: false,
    });
    const run = evaluate([...tad.facts, stated]);
    expect(isGap(run.field("form-3800", `${LINE_1GG}_col_e`))).toBe(true);
  });
});
