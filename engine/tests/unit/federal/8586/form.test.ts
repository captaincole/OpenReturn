/*
 * Form 8586 on a whole return: who files, lines 1 to 7, the Form 3800 line
 * 4d sources and their passive answer, the gaps, and "no facts, nothing
 * changes". The synthetic alar scenario (a building and a partnership K-1) is
 * the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makeLowIncomeHousingBuildingFactKey,
  makePartnershipK1FactKey,
  makeTrustK1FactKey,
  RENTAL_KEYS,
  type GeneralBusinessCreditFactValue,
  type LowIncomeHousingBuildingFactValue,
  type TrustK1FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { JUNIPER_ID, juniperK1, SAGEBRUSH } from "../../../scenarios/synthetic/alar/facts.js";
import { alarScenario as alar } from "../../../scenarios/synthetic/alar/index.js";

const BUILDING_KEY = makeLowIncomeHousingBuildingFactKey("sagebrush-terrace");
const isBuilding = (fact: TaxFactRow) => fact.key.startsWith("low_income_housing_building.");
const isK1 = (fact: TaxFactRow) => fact.category === "k1";
const isProfessional = (fact: TaxFactRow) => fact.key === RENTAL_KEYS.realEstateProfessional;

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: alar.userId,
    taxYear: alar.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...alar.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const replaced = (facts: TaxFactRow[], key: string, value: unknown) =>
  facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));

const building = (patch: Partial<LowIncomeHousingBuildingFactValue>) =>
  replaced(alar.facts, BUILDING_KEY, { ...SAGEBRUSH, ...patch });

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = alar.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8586-test", taxYear: alar.taxYear },
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
  return { files, field, value, line: (id: string) => value("form-8586", id), missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_1 = "0.line.1_forms_8609a_attached";
const LINE_2_YES = "0.line.2_yes";
const LINE_2_NO = "0.line.2_no";
const BIN_I = "0.line.2_i_decreased_basis_bin";
const BIN_IV = "0.line.2_iv_decreased_basis_bin";
const LINE_3 = "0.line.3_current_year_credit_8609a";
const LINE_4 = "0.line.4_credit_from_pass_through";
const LINE_5 = "0.line.5_add_lines";
const LINE_6 = "0.line.6_allocated_to_beneficiaries";
const LINE_7 = "0.line.7_subtract_6_from_5";
const ROW_4D = "3.part3.4d_form_8586_col_d";
const ROW_4D_ALLOWED = "3.part3.4d_form_8586_col_g";

describe("Form 8586 who files", () => {
  it("a Form 8609-A files it; lines 1 to 5 reach Form 3800 line 4d and Schedule 3 line 6a", () => {
    const run = evaluate(alar.facts);
    expect(run.files("form-8586")).toBe(true);
    expect(run.line(LINE_1)).toBe(1);
    expect(run.line(LINE_2_YES)).toBe(true);
    expect(run.line(LINE_2_NO)).toBeUndefined();
    expect(run.line(BIN_I)).toBe("NV-19-00412");
    expect(run.line(LINE_3)).toBe(64_800);
    expect(run.line(LINE_4)).toBe(4_350);
    expect(run.line(LINE_5)).toBe(69_150);
    expect(run.line(LINE_6)).toBeUndefined();
    expect(run.line(LINE_7)).toBeUndefined();
    expect(run.value("form-3800", ROW_4D)).toBe(69_150);
    expect(run.value("schedule-3", "0.line.6a")).toBe(7_356);
  });

  it("a K-1 credit alone does not file it: the credit goes directly on Form 3800 (purpose-of-form::b01, row A102)", () => {
    const run = evaluate(alar.facts.filter((fact) => !isBuilding(fact)));
    expect(run.files("form-8586")).toBe(false);
    expect(run.value("form-3800", ROW_4D)).toBe(4_350);
  });

  it("the decision files it for a K-1 credit alone: line 1 is 0 and Form 3800 does not count the K-1 twice", () => {
    const on = [...alar.decisions, decision("decisions.scope.must_file_8586", true)];
    const run = evaluate(
      alar.facts.filter((fact) => !isBuilding(fact)),
      on,
    );
    expect(run.files("form-8586")).toBe(true);
    expect(run.line(LINE_1)).toBe(0);
    expect(run.line(LINE_2_NO)).toBe(true);
    expect(run.line(LINE_3)).toBeUndefined();
    expect(run.line(LINE_5)).toBe(4_350);
    expect(run.value("form-3800", ROW_4D)).toBe(4_350);
  });

  it("the decision turns it off: the building's credit is not claimed", () => {
    const off = [...alar.decisions, decision("decisions.scope.must_file_8586", false)];
    const run = evaluate(alar.facts, off);
    expect(run.files("form-8586")).toBe(false);
    expect(run.value("form-3800", ROW_4D)).toBe(4_350);
  });

  it("files with a credit of 0, in a year after the credit period (line-3::b01: attach each Form 8609-A)", () => {
    const run = evaluate(building({ form8609: { ...SAGEBRUSH.form8609, firstCreditYear: 2013 } }));
    expect(run.files("form-8586")).toBe(true);
    expect(run.line(LINE_3)).toBe(0);
    expect(run.line(LINE_5)).toBe(4_350);
    expect(run.value("form-3800", ROW_4D)).toBe(4_350);
  });
});

describe("Form 8586 and Form 8582-CR: the building's credit is passive", () => {
  it("both credits are passive: Form 8582-CR allows the tax on $25,000 (Part IV)", () => {
    const run = evaluate(alar.facts);
    expect(run.value("form-8582-cr", "0.line.3a_low_income_post_1989_credits")).toBe(69_150);
    expect(run.value("form-8582-cr", "1.line.37_passive_activity_credit_allowed")).toBe(7_356);
    expect(run.value("form-3800", ROW_4D_ALLOWED)).toBe(7_356);
  });

  it("waits on the real estate professional answer; Form 8586 itself does not", () => {
    const run = evaluate(alar.facts.filter((fact) => !isProfessional(fact)));
    expect(run.line(LINE_3)).toBe(64_800);
    expect(run.missing("form-3800")).toContain(RENTAL_KEYS.realEstateProfessional);
    expect(run.missing("form-8586")).toEqual([]);
  });

  it("a real estate professional's building is a gap on line 4d (activities-that-aren-t-passive::b01)", () => {
    const run = evaluate(replaced(alar.facts, RENTAL_KEYS.realEstateProfessional, true));
    expect(run.line(LINE_5)).toBe(69_150);
    expect(isGap(run.field("form-3800", ROW_4D_ALLOWED))).toBe(true);
    expect(isGap(run.field("schedule-3", "0.line.6a"))).toBe(true);
  });
});

describe("Form 8586 line 4: credits from pass-through entities", () => {
  it("a stated line 4d credit that names its entity adds to line 4", () => {
    const stated: GeneralBusinessCreditFactValue = {
      sourceForm: "8586",
      line: "4d",
      amount: 1_200.4,
      passive: true,
      passiveActivity: { name: "Basin Housing Fund", rentalRealEstate: true, before1990: false },
      passThroughEin: "00-0008588",
    };
    const facts = [...alar.facts, row("other", makeGeneralBusinessCreditFactKey("basin"), stated)];
    const run = evaluate(facts);
    expect(run.line(LINE_4)).toBe(5_550);
    expect(run.line(LINE_5)).toBe(70_350);
    expect(run.value("form-3800", ROW_4D)).toBe(70_350);
  });

  it("two K-1s with cents round each, then add, as Form 3800 Part V lists them (row A96)", () => {
    const withCents = { ...juniperK1, boxes: [{ box: "15", code: "D", amount: 1_200.4 }] };
    const second = {
      ...juniperK1,
      entityName: "Basalt Housing Partners LP",
      entityEin: "00-0008590",
      boxes: [{ box: "15", code: "D", amount: 600.4 }],
    };
    const holding = row("k1", makeK1HoldingFactKey("basalt-housing"), {
      owner: "taxpayer",
      materiallyParticipated: false,
      allInvestmentAtRisk: true,
      partnershipBasisAtStart: 60_000,
    });
    const facts = [
      ...replaced(alar.facts, makePartnershipK1FactKey(JUNIPER_ID), withCents),
      row("k1", makePartnershipK1FactKey("basalt-housing"), second),
      holding,
    ];
    const run = evaluate(facts);
    expect(run.line(LINE_4)).toBe(1_800);
    expect(run.line(LINE_5)).toBe(66_600);
    expect(run.value("form-3800", ROW_4D)).toBe(66_600);
  });

  it("a stated line 4d credit with no entity next to a Form 8609-A is a gap: the same credit twice", () => {
    const stated: GeneralBusinessCreditFactValue = {
      sourceForm: "8586",
      line: "4d",
      amount: 64_800,
      passive: true,
      passiveActivity: { name: "Sagebrush Terrace", rentalRealEstate: true, before1990: false },
    };
    const facts = [...alar.facts, row("other", makeGeneralBusinessCreditFactKey("own"), stated)];
    const run = evaluate(facts);
    expect(isGap(run.field("form-3800", ROW_4D_ALLOWED))).toBe(true);
  });

  it("a K-1 code D with no amount is a gap on line 4 and line 5", () => {
    const noAmount = { ...juniperK1, boxes: [{ box: "15", code: "D" }] };
    const run = evaluate(replaced(alar.facts, "k1.partnership.juniper-flats-housing", noAmount));
    expect(isGap(run.field("form-8586", LINE_4))).toBe(true);
    expect(isGap(run.field("form-8586", LINE_5))).toBe(true);
  });

  it("an estate or trust K-1 code C is a gap on line 4 (the trust table has no route for it)", () => {
    const trust: TrustK1FactValue = {
      form: "1041",
      entityName: "Pinenut Family Trust",
      entityEin: "00-0008589",
      finalK1: false,
      amendedK1: false,
      isEstate: false,
      boxes: [{ box: "13", code: "C", amount: 900 }],
    };
    const facts = [...alar.facts, row("k1", makeTrustK1FactKey("pinenut-family-trust"), trust)];
    const run = evaluate(facts);
    const line4 = run.field("form-8586", LINE_4);
    expect(isGap(line4)).toBe(true);
    expect((line4 as { reason?: string }).reason).toContain("Pinenut Family Trust");
  });

  it("with no K-1 credit line 4 is blank and line 5 is line 3", () => {
    const run = evaluate(alar.facts.filter((fact) => !isK1(fact)));
    expect(run.line(LINE_4)).toBeUndefined();
    expect(run.line(LINE_5)).toBe(64_800);
    expect(run.value("form-3800", ROW_4D)).toBe(64_800);
  });
});

describe("Form 8586 waits and gaps from the Forms 8609-A", () => {
  it("a copy that waits leaves lines 3 and 5 blank and both forms ask for its fact", () => {
    // The 11th year needs the first year's percentages (line 17); this copy has none.
    const run = evaluate(building({ form8609: { ...SAGEBRUSH.form8609, firstCreditYear: 2015 } }));
    expect(run.line(LINE_3)).toBeUndefined();
    expect(run.line(LINE_5)).toBeUndefined();
    expect(run.missing("form-8586")).toContain(BUILDING_KEY);
    expect(run.missing("form-3800")).toContain(BUILDING_KEY);
  });

  it("a copy that is a gap makes lines 3 and 5 and Form 3800 line 4d a gap (section 42(k) at-risk)", () => {
    const run = evaluate(building({ atRiskFinancing: true }));
    expect(isGap(run.field("form-8586", LINE_3))).toBe(true);
    expect(isGap(run.field("form-8586", LINE_5))).toBe(true);
    expect(isGap(run.field("form-3800", ROW_4D_ALLOWED))).toBe(true);
  });

  it("five buildings with a decreased basis: rows (i) to (iii) print and row (iv) names the schedule's gap", () => {
    const more = ["a", "b", "c", "d"].map((slug, index) =>
      row("rental", makeLowIncomeHousingBuildingFactKey(`more-${slug}`), {
        ...SAGEBRUSH,
        form8609: { ...SAGEBRUSH.form8609, buildingIdentificationNumber: `NV-19-0050${index}` },
      }),
    );
    const run = evaluate([...alar.facts, ...more]);
    expect(run.line(LINE_1)).toBe(5);
    expect(run.line(BIN_I)).toBe("NV-19-00412");
    expect(run.line("0.line.2_iii_decreased_basis_bin")).toBe("NV-19-00501");
    expect(isGap(run.field("form-8586", BIN_IV))).toBe(true);
    expect(run.line(LINE_3)).toBe(5 * 64_800);
  });
});

describe("Form 8586: no facts, nothing changes", () => {
  it("with no building and no K-1 neither Form 8586 nor Form 3800 files, and the tax has no credit", () => {
    const run = evaluate(alar.facts.filter((fact) => !isBuilding(fact) && !isK1(fact)));
    expect(run.files("form-8586")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
    expect(run.value("form-1040", "line.22")).toBe(45_623);
  });
});
