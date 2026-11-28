/*
 * Form 8835 on a whole return: who files, the copies, Part I's boxes, Form
 * 3800 lines 4e and 1f, the K-1 copy, the waits and the gaps, and "no facts,
 * nothing changes". The synthetic wit scenario (two wind facilities) is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeGeneralBusinessCreditFactKey,
  makeInvestmentCreditPropertyFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeRenewableElectricityFacilityFactKey,
  type InvestmentCreditPropertyFactValue,
  type PartnershipK1FactValue,
  type RenewableElectricityFacilityFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { form8835Bindings } from "../../../../src/federal/8835/bindings.js";
import catalogJson from "../../../../src/federal/8835/catalog.json";
import { PASS_THROUGH_COPY } from "../../../../src/federal/8835/copies.js";
import { resolve8835Info } from "../../../../src/federal/8835/resolveInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { CAPROCK, GARZA } from "../../../scenarios/synthetic/wit/facts.js";
import { witScenario as wit } from "../../../scenarios/synthetic/wit/index.js";

const CAPROCK_KEY = makeRenewableElectricityFacilityFactKey("caprock-ridge");
const GARZA_KEY = makeRenewableElectricityFacilityFactKey("garza-flats");
const isFacility = (fact: TaxFactRow) => fact.key.startsWith("renewable_electricity.");

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...wit.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});
const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({ userId: wit.userId, taxYear: 2025, key, decision: value, rationale: "test" });

const withFacility = (key: string, value: RenewableElectricityFacilityFactValue) =>
  wit.facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));
const only = (value: RenewableElectricityFacilityFactValue) => [
  ...wit.facts.filter((fact) => !isFacility(fact)),
  row("other", CAPROCK_KEY, value),
];

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = wit.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8835-test", taxYear: 2025 },
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

const copiesOf = (facts: TaxFactRow[], decisions = wit.decisions) =>
  resolve8835Info(makeResolverInputs({ facts, decisions })).form8835Copies ?? [];
const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_15 = "2.part2.15_add_lines_13_14";
const FORM_3800_4E = "3.part3.4e_form_8835_part_ii_col_e";
const FORM_3800_1F = "2.part3.1f_form_8835_part_ii_col_e";

const k1 = (amount: number): PartnershipK1FactValue => ({
  form: "1065",
  entityName: "Blanco Canyon Wind Partners LLC",
  entityEin: "74-5558835",
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 5,
  lossPercent: 5,
  capitalPercent: 5,
  boxes: [{ box: "15", code: "AB", amount }],
});
const K1_KEY = makePartnershipK1FactKey("blanco-canyon");
const k1Facts = (amount: number) => [
  row("k1", K1_KEY, k1(amount)),
  row("k1", makeK1HoldingFactKey("blanco-canyon"), {
    owner: "taxpayer",
    materiallyParticipated: true,
    allInvestmentAtRisk: true,
    partnershipBasisAtStart: 50_000,
  }),
];

describe("Form 8835 bindings", () => {
  it("give every catalog field one rule", () => {
    const bound = Object.keys(form8835Bindings()).sort();
    const fields = catalogJson.fields.map((each) => each.fieldId.slice("form-8835.".length)).sort();
    expect(bound).toEqual(fields);
  });

  it("a Yes/No pair never prints both boxes", () => {
    for (const copy of copiesOf(wit.facts)) {
      const yes = Object.keys(copy.cells).filter((key) => key.endsWith("_yes"));
      for (const key of yes) expect(copy.cells[key.replace("_yes", "_no")]).toBeUndefined();
    }
  });
});

describe("who files Form 8835 (general-instructions::b01)", () => {
  it("no facility fact: no Form 8835, and Form 3800 and Schedule 3 do not file", () => {
    const run = evaluate(wit.facts.filter((fact) => !isFacility(fact)));
    expect(run.files("form-8835")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
    expect(run.value("schedule-3", "0.line.6a")).toBeUndefined();
  });

  it("each facility is one copy; Form 3800 takes copy 1 on line 4e and copy 2 on line 1f", () => {
    const copies = copiesOf(wit.facts);
    expect(copies.map((copy) => copy.key)).toEqual([CAPROCK_KEY, GARZA_KEY]);
    const run = evaluate(wit.facts);
    expect(run.value("form-8835", LINE_15)).toBe(16_560);
    expect(run.value("form-3800", FORM_3800_4E)).toBe(16_560);
    expect(run.value("form-3800", FORM_3800_1F)).toBe(3_600);
    const second = { ...resolve8835Info(makeResolverInputs(wit)), form8835CopyIndex: 1 };
    const bindings = form8835Bindings();
    expect(bindings["1.part2.7c_wind_began_2018_2020_2021"]!({}, second)).toBe(6_000);
    expect(bindings["1.part2.7d_line7c_times_40_percent"]!({}, second)).toBe(2_400);
    expect(bindings[LINE_15]!({}, second)).toBe(3_600);
  });

  it("the explicit decision false files no Form 8835 and gives Form 3800 nothing from it", () => {
    const run = evaluate(wit.facts, [
      ...wit.decisions,
      decision("decisions.scope.must_file_8835", false),
    ]);
    expect(run.files("form-8835")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
  });

  it("a facility with a section 1603 grant files no Form 8835", () => {
    const facts = only({ ...CAPROCK, section1603Grant: true });
    expect(evaluate(facts).files("form-8835")).toBe(false);
  });

  it("a K-1 credit alone files no Form 8835; Form 3800 line 1f takes it (the DECISION in resolveInfo.ts)", () => {
    const facts = [...wit.facts.filter((fact) => !isFacility(fact)), ...k1Facts(1_250)];
    const run = evaluate(facts);
    expect(run.files("form-8835")).toBe(false);
    expect(run.value("form-3800", FORM_3800_1F)).toBe(1_250);
  });

  it("with a facility, the K-1 credit prints on a separate copy's line 14, and is not counted twice", () => {
    const facts = [...wit.facts, ...k1Facts(1_250)];
    const copies = copiesOf(facts);
    expect(copies.map((copy) => copy.key)).toEqual([CAPROCK_KEY, GARZA_KEY, PASS_THROUGH_COPY]);
    const last = copies[2]!;
    expect(last.cells["0.part1.2a_facility_type"]).toBe("Credits From Pass-Through Entities");
    expect(last.cells["2.part2.14_credit_from_pass_through_entities"]).toBe(1_250);
    expect(last.cells[LINE_15]).toBe(1_250);
    expect(last.cells["1.part2.2_total_column_c"]).toBeUndefined();
    expect(evaluate(facts).value("form-3800", "2.part3.2_add_lines_1a_1zz_col_e")).toBe(4_850);
  });
});

describe("Part I boxes", () => {
  it("a pre-2022 facility leaves line 8 blank, checks 9b and 10c, and line 6 No", () => {
    const cells = copiesOf(wit.facts)[1]!.cells;
    expect(cells["0.part1.8b_construction_before_2023_01_29"]).toBeUndefined();
    expect(cells["0.part1.8d_not_qualified_facility"]).toBeUndefined();
    expect(cells["0.part1.9b_domestic_content_bonus_no"]).toBe(true);
    expect(cells["0.part1.10c_energy_community_not_applicable"]).toBe(true);
    expect(cells["0.part1.6_biomass_expansion_no"]).toBe(true);
    expect(cells["1.part2.9_increased_credit_amount"]).toBe(3_600);
  });

  it("an energy community answer of yes on a pre-2022 facility adds no bonus (the DECISION in partI.ts)", () => {
    const cells = copiesOf(withFacility(GARZA_KEY, { ...GARZA, energyCommunity: "yes" }))[1]!.cells;
    expect(cells["1.part2.11_energy_community_bonus"]).toBe(0);
  });

  it("construction on or after January 29, 2023: 8a, 8c or 8d by the answers", () => {
    const late = { ...CAPROCK, constructionBegan: "2023-02-01", taxExemptBondFinancing: undefined };
    const under1Mw = copiesOf(only({ ...late, netOutputUnder1Mw: true }))[0]!.cells;
    expect(under1Mw["0.part1.8a_output_under_1_megawatt"]).toBe(true);
    expect(under1Mw["1.part2.9_increased_credit_amount"]).toBe(15_000);
    const pwa = only({
      ...late,
      netOutputUnder1Mw: false,
      meetsPrevailingWageAndApprenticeship: true,
    });
    expect(copiesOf(pwa)[0]!.cells["0.part1.8c_meets_wage_apprenticeship"]).toBe(true);
    const none = only({
      ...late,
      netOutputUnder1Mw: false,
      meetsPrevailingWageAndApprenticeship: false,
    });
    const cells = copiesOf(none)[0]!.cells;
    expect(cells["0.part1.8d_not_qualified_facility"]).toBe(true);
    expect(cells["1.part2.9_increased_credit_amount"]).toBe(3_000);
  });

  it("domestic content is only for a facility placed in service after 2022 (domestic-content::b01)", () => {
    const in2022 = { ...CAPROCK, placedInService: "2022-12-20", constructionBegan: "2022-09-12" };
    const cells = copiesOf(only(in2022))[0]!.cells;
    expect(cells["0.part1.9b_domestic_content_bonus_no"]).toBe(true);
    expect(cells["1.part2.10_domestic_content_bonus"]).toBe(0);
  });

  it("a transfer prints its registration number on line 1 and travels with the Form 3800 source", () => {
    const transfer = {
      direction: "sold" as const,
      amount: 5_000,
      registrationNumber: "R8835-TEST-01",
    };
    const facts = only({ ...CAPROCK, transfer });
    expect(copiesOf(facts)[0]!.cells["0.part1.1_irs_registration_number"]).toBe("R8835-TEST-01");
    expect(evaluate(facts).value("form-3800", "3.part3.4e_form_8835_part_ii_col_f")).toBe(-5_000);
  });

  it("capacity lines: the stated kW, or the Not applicable boxes", () => {
    const solar = {
      ...CAPROCK,
      resource: "solar" as const,
      capacity: { solarDcKw: 1_200, solarAcKw: 950 },
    };
    const cells = copiesOf(only(solar))[0]!.cells;
    expect(cells["0.part1.11a_solar_dc_capacity_kw"]).toBe("1200");
    expect(cells["0.part1.12a_solar_ac_capacity_kw"]).toBe("950");
    expect(cells["0.part1.12b_wind_ac_capacity_checkbox"]).toBeUndefined();
    const bare = copiesOf(only({ ...CAPROCK, capacity: undefined }))[0]!.cells;
    expect(bare["0.part1.11b_dc_capacity_not_applicable"]).toBe(true);
    expect(bare["0.part1.12d_ac_capacity_not_applicable"]).toBe(true);
  });
});

describe("waits and gaps", () => {
  it("a facility missing an answer its lines read waits, on Form 8835 and Form 3800", () => {
    const late = { ...CAPROCK, constructionBegan: "2023-02-01", taxExemptBondFinancing: undefined };
    const run = evaluate(only(late));
    expect(run.missing("form-8835")).toContain(CAPROCK_KEY);
    expect(run.missing("form-3800")).toContain(CAPROCK_KEY);
    expect(run.value("form-8835", LINE_15)).toBeUndefined();
  });

  it("a biomass facility waits for line 6", () => {
    const biomass = { ...CAPROCK, resource: "open_loop_biomass" as const };
    expect(evaluate(only(biomass)).missing("form-8835")).toContain(CAPROCK_KEY);
    const answered = copiesOf(only({ ...biomass, biomassExpansion: true }))[0]!.cells;
    expect(answered["0.part1.6_biomass_expansion_yes"]).toBe(true);
    expect(answered["1.part2.1f_open_loop_biomass_credit_col_c"]).toBe(1_500);
  });

  it("a 2021 facility splits line 15 between Form 3800 lines 4e and 1f by kilowatt-hours", () => {
    const split = { ...GARZA, constructionBegan: "2020-05-01", placedInService: "2021-07-01" };
    expect(evaluate(only(split)).missing("form-8835")).toContain(CAPROCK_KEY);
    const run = evaluate(only({ ...split, kilowattHoursSoldInFirstFourYears: 100_000 }));
    // 200,000 kWh × $0.03 = 6,000; less 40% (begun 2020) = 3,600; half in the first four years.
    expect(run.value("form-8835", LINE_15)).toBe(3_600);
    expect(run.value("form-3800", FORM_3800_4E)).toBe(1_800);
    expect(run.value("form-3800", FORM_3800_1F)).toBe(1_800);
  });

  it("construction begun in 2025 is a gap that reaches Form 3800 (Form 7211's facility)", () => {
    const run = evaluate(
      only({ ...CAPROCK, constructionBegan: "2025-02-01", placedInService: "2025-11-01" }),
    );
    expect(isGap(run.field("form-8835", LINE_15))).toBe(true);
    expect(isGap(run.field("form-3800", FORM_3800_4E))).toBe(true);
  });

  it("a Form 3468 qualified investment credit facility at the same address is a gap", () => {
    const elected: InvestmentCreditPropertyFactValue = {
      facility: {
        propertyType: "Wind",
        address: CAPROCK.address,
        constructionBegan: CAPROCK.constructionBegan,
        placedInService: "2025-03-01",
      },
      credit: {
        part: "energy",
        investment: {
          property: { section: "investment_credit_facility", basis: 400_000, windFacility: true },
        },
      },
      passive: false,
    };
    const facts = [
      ...only(CAPROCK),
      row("other", makeInvestmentCreditPropertyFactKey("ridge"), elected),
    ];
    expect(isGap(copiesOf(facts)[0]!.cells[LINE_15])).toBe(true);
    const elsewhere = { ...elected, facility: { ...elected.facility, address: "Elsewhere" } };
    const apart = [
      ...only(CAPROCK),
      row("other", makeInvestmentCreditPropertyFactKey("ridge"), elsewhere),
    ];
    expect(copiesOf(apart)[0]!.cells[LINE_15]).toBe(16_560);
  });

  it("a stated line 4e credit from Form 8835 with no entity next to a facility is a gap", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("ridge"), {
      sourceForm: "8835 Part II",
      line: "4e",
      amount: 16_560,
      passive: false,
    });
    const run = evaluate([...only(CAPROCK), stated]);
    expect(isGap(run.field("form-3800", FORM_3800_4E))).toBe(true);
  });

  it("a purchased transfer on a facility fact is a gap on its Form 3800 line", () => {
    const transfer = { direction: "purchased" as const, amount: 5_000, registrationNumber: "R-1" };
    const run = evaluate(only({ ...CAPROCK, transfer }));
    expect(isGap(run.field("form-3800", FORM_3800_4E))).toBe(true);
  });
});
