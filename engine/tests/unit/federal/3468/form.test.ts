/*
 * Form 3468 on a whole return: who files, the copies, Form 3800 Part III, the
 * K-1 codes E and P to U, the cooperatives' form, the waits and the gaps. The
 * synthetic aram scenario (two properties) and renald (K-1s) are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeCooperativeInvestmentCreditFactKey,
  makeInvestmentCreditPropertyFactKey,
  makePartnershipK1FactKey,
  type InvestmentCreditPropertyFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { cellOf, form3468Bindings, sharedLines } from "../../../../src/federal/3468/bindings.js";
import catalogJson from "../../../../src/federal/3468/catalog.json";
import { resolve3468Info } from "../../../../src/federal/3468/resolveInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { MILL, SOLAR } from "../../../scenarios/synthetic/aram/facts.js";
import { aramScenario as aram } from "../../../scenarios/synthetic/aram/index.js";
import { WORKS_ID, worksK1 } from "../../../scenarios/synthetic/renald/facts.js";
import { renaldScenario as renald } from "../../../scenarios/synthetic/renald/index.js";
import { COVERAGE_PROPERTIES } from "./coverage.js";

const SOLAR_KEY = makeInvestmentCreditPropertyFactKey("mill-solar");
const MILL_KEY = makeInvestmentCreditPropertyFactKey("mill-rehabilitation");
const WORKS = makePartnershipK1FactKey(WORKS_ID);

const row = (base: TaxFactRow, category: string, key: string, value: unknown): TaxFactRow => ({
  ...base,
  id: `f-${key}`,
  category,
  key,
  value,
});
const isInvestment = (fact: TaxFactRow) => fact.key.startsWith("investment_credit.");

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = aram.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3468-test", taxYear: 2025 },
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
const withProperty = (key: string, value: InvestmentCreditPropertyFactValue) =>
  aram.facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));

describe("Form 3468 bindings", () => {
  it("give every catalog field one rule", () => {
    const bound = Object.keys(form3468Bindings()).sort();
    const fields = catalogJson.fields
      .map((field) => field.fieldId.slice("form-3468.".length))
      .sort();
    expect(bound).toEqual(fields);
  });

  it("every field outside the header prints on some copy, and a Yes/No pair never prints both", () => {
    const inputs = makeResolverInputs({ facts: COVERAGE_PROPERTIES, decisions: [] });
    const copies = resolve3468Info(inputs).form3468Copies ?? [];
    const shared = sharedLines();
    const unfilled = catalogJson.fields
      .map((field) => field.fieldId.slice("form-3468.".length))
      .filter((key) => !key.includes(".header."))
      .filter((key) => copies.every((copy) => cellOf(copy, key, shared) === undefined));
    expect(unfilled).toEqual([]);
    for (const copy of copies) {
      const yes = Object.keys(copy.cells).filter((key) => key.endsWith("_yes"));
      for (const key of yes) expect(copy.cells[key.replace("_yes", "_no")]).toBeUndefined();
    }
  });
});

describe("who files Form 3468", () => {
  it("no investment fact: no Form 3468, and Form 3800 and Schedule 3 do not file", () => {
    const run = evaluate(aram.facts.filter((fact) => !isInvestment(fact)));
    expect(run.files("form-3468")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
    expect(run.value("form-1040", "line.20")).toBeUndefined();
  });

  it("each property is one copy; Form 3800 takes Part VI line 32 on line 4a and Part VII line 3 on line 4k", () => {
    const info = resolve3468Info(
      makeResolverInputs({ facts: aram.facts, decisions: aram.decisions }),
    );
    expect(info.form3468Copies?.map((copy) => copy.key)).toEqual([SOLAR_KEY, MILL_KEY]);
    const run = evaluate(aram.facts);
    expect(run.files("form-3468")).toBe(true);
    expect(run.value("form-3468", "10.part6.32_total_energy_credit")).toBe(60_375);
    expect(run.value("form-3800", "3.part3.4a_form_3468_part_vi_col_e")).toBe(60_375);
    expect(run.value("form-3800", "3.part3.4k_form_3468_part_vii_col_e")).toBe(10_000);
    const bindings = form3468Bindings();
    const second = { ...info, form3468CopyIndex: 1 };
    expect(bindings["11.part7.1j_multiply_1g_by_4_percent"]!({}, second)).toBe(10_000);
    expect(bindings["4.part6.3a_basis_solar_property"]!({}, second)).toBeUndefined();
    expect(bindings["4.part6.3a_basis_solar_property"]!({}, info)).toBe(120_000);
  });

  it("the explicit decision wins: false files no Form 3468 and gives Form 3800 nothing from it", () => {
    const decisions = [
      ...aram.decisions,
      decisionRow({
        userId: aram.userId,
        taxYear: 2025,
        key: "decisions.scope.must_file_3468",
        decision: false,
        rationale: "test",
      }),
    ];
    const run = evaluate(aram.facts, decisions);
    expect(run.files("form-3468")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
  });

  it("a property missing a Part I answer waits: both forms list the fact", () => {
    const solar = { ...SOLAR, facility: { ...SOLAR.facility, energyCommunity: undefined } };
    const run = evaluate(withProperty(SOLAR_KEY, solar));
    expect(run.missing("form-3468")).toContain(SOLAR_KEY);
    expect(run.missing("form-3800")).toContain(SOLAR_KEY);
    expect(run.value("form-3468", "4.part6.3c_multiply_3a_by_3b")).toBeUndefined();
  });

  it("a passive property goes to column (d)", () => {
    const passive = {
      ...MILL,
      passive: true,
      passiveActivity: { name: "Mill lease", rentalRealEstate: true },
    };
    const run = evaluate(withProperty(MILL_KEY, passive));
    expect(run.value("form-3800", "3.part3.4k_form_3468_part_vii_col_d")).toBe(10_000);
    expect(run.files("form-8582-cr")).toBe(true);
  });

  it("a transfer of a rehabilitation credit is a gap on line 4k, never a dropped credit", () => {
    const transfer = { direction: "sold" as const, amount: 5_000, registrationNumber: "REG-1" };
    const facts = withProperty(MILL_KEY, { ...MILL, transfer });
    const info = resolve3468Info(makeResolverInputs({ facts, decisions: aram.decisions }));
    expect(isGap(info.form3468Copies?.[1]?.cells["part7.3"])).toBe(true);
    const run = evaluate(facts);
    expect(isGap(run.field("form-3800", "3.part3.4k_form_3468_part_vii_col_e"))).toBe(true);
  });
});

describe("cooperatives and K-1s", () => {
  it("a stated cooperative credit: the separate form's line 3a, the part's cooperative line, Form 3800 with the EIN", () => {
    const cooperative = row(
      aram.facts[0]!,
      "other",
      makeCooperativeInvestmentCreditFactKey("brazos-coop"),
      {
        cooperativeName: "Brazos Valley Growers Cooperative",
        cooperativeEin: "00-0003469",
        credits: { rehabilitation: 1_250, advancedCoalGasification: 400 },
        passive: false,
      },
    );
    const run = evaluate([...aram.facts.filter((fact) => !isInvestment(fact)), cooperative]);
    expect(run.value("form-3468", "0.part1.3a_property_type")).toBe(
      "Unused Investment Credit from Cooperatives",
    );
    expect(run.value("form-3468", "11.part7.2_cooperatives_unused_credit")).toBe(1_250);
    expect(run.value("form-3468", "11.part7.3_add_lines")).toBe(1_250);
    expect(run.value("form-3468", "1.part2.7_total_add_lines")).toBe(400);
    expect(run.value("form-3800", "3.part3.4k_form_3468_part_vii_col_e")).toBe(1_250);
    expect(run.value("form-3800", "2.part3.1a_form_3468_part_ii_col_c")).toBe("00-0003469");
  });

  it("a K-1 code E that a property names is figured on Form 3468, not a gap", () => {
    const k1 = { ...worksK1, boxes: [...worksK1.boxes, { box: "15", code: "E", amount: 250_000 }] };
    const property = row(renald.facts[0]!, "other", MILL_KEY, {
      ...MILL,
      passive: true,
      passiveActivity: { name: "Works mill", rentalRealEstate: true },
      k1Key: WORKS,
    });
    const facts = [
      ...renald.facts.map((fact) => (fact.key === WORKS ? { ...fact, value: k1 } : fact)),
      property,
    ];
    const run = evaluate(facts, renald.decisions);
    expect(run.value("form-3800", "3.part3.4k_form_3468_part_vii_col_d")).toBe(10_000);
  });
});
