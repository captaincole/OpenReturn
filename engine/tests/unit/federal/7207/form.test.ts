/*
 * Form 7207 on a whole return: the bindings, who files, the copies, Form 3800
 * line 1b, line 7 from K-1s, and "no facts, nothing changes". The synthetic
 * bran scenario (one plant) and renald (K-1s) are the bases.
 */

import { describe, expect, it } from "vitest";
import { makePartnershipK1FactKey } from "../../../../src/facts/index.js";
import { form7207Bindings } from "../../../../src/federal/7207/bindings.js";
import catalogJson from "../../../../src/federal/7207/catalog.json";
import { resolve7207Info } from "../../../../src/federal/7207/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { WORKS_ID, worksK1 } from "../../../scenarios/synthetic/renald/facts.js";
import { renaldScenario as renald } from "../../../scenarios/synthetic/renald/index.js";
import {
  COVERAGE,
  COVERAGE_OTHER_BOXES,
  PLANT,
  PLANT_KEY,
  bran,
  decision,
  evaluate,
  facilityRow,
  isFacility,
  isGap,
  row,
  withPlant,
} from "./fixtures.js";

const WORKS = makePartnershipK1FactKey(WORKS_ID);
const K1_CREDIT = 4_200;
const withCodeV = (amount: number | undefined) =>
  renald.facts.map((fact) =>
    fact.key === WORKS
      ? {
          ...fact,
          value: { ...worksK1, boxes: [...worksK1.boxes, { box: "15", code: "V", amount }] },
        }
      : fact,
  );

/* Fields no facility fills by design: line 6b (a tax year that began before July 5, 2025), 8b and 8c (estates and trusts). */
const NEVER_FILLED = [
  "1.line.6b_metallurgical_coal_col_d",
  "1.line.6b_metallurgical_coal_col_e",
  "1.line.8b_allocated_to_beneficiaries",
  "1.line.8c_estate_trust_credit",
];

describe("Form 7207 bindings", () => {
  it("give every catalog field one rule", () => {
    const bound = Object.keys(form7207Bindings()).sort();
    const fields = catalogJson.fields
      .map((field) => field.fieldId.slice("form-7207.".length))
      .sort();
    expect(bound).toEqual(fields);
  });

  it("every other field prints on some copy, and a Yes/No pair never prints both", () => {
    const facts = [
      ...withCodeV(K1_CREDIT).filter((fact) => !isFacility(fact)),
      facilityRow("coverage", COVERAGE),
      facilityRow("coverage-other", COVERAGE_OTHER_BOXES),
    ];
    const info = resolve7207Info(makeResolverInputs({ facts, decisions: renald.decisions }));
    const copies = info.form7207Copies ?? [];
    expect(copies).toHaveLength(3);
    const unfilled = catalogJson.fields
      .map((field) => field.fieldId.slice("form-7207.".length))
      .filter((key) => !key.includes(".header.") && !NEVER_FILLED.includes(key))
      .filter((key) => copies.every((copy) => copy.cells[key] === undefined));
    expect(unfilled).toEqual([]);
    for (const copy of copies) {
      for (const key of Object.keys(copy.cells).filter((each) => each.endsWith("_yes"))) {
        expect(copy.cells[key.replace("_yes", "_no")]).toBeUndefined();
      }
    }
  });

  it("the header prints on each copy", () => {
    const info = resolve7207Info(
      makeResolverInputs({ facts: bran.facts, decisions: bran.decisions }),
    );
    const bindings = form7207Bindings();
    const header = bindings["0.header.taxpayer_name"]!;
    expect(header({}, { ...info, taxpayerFirstName: "Bran", taxpayerLastName: "Tolliver" })).toBe(
      "Bran Tolliver",
    );
  });
});

describe("who files Form 7207", () => {
  it("no facility fact: no Form 7207, and Form 3800 and Schedule 3 line 6a do not file", () => {
    const run = evaluate(bran.facts.filter((fact) => !isFacility(fact)));
    expect(run.files("form-7207")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
    expect(run.value("form-1040", "line.20")).toBeUndefined();
  });

  it("a facility files it; Form 3800 line 1b takes line 8a", () => {
    const run = evaluate(bran.facts);
    expect(run.files("form-7207")).toBe(true);
    expect(run.value("form-7207", "1.line.8a_total_credit")).toBe(203_365);
    expect(run.value("form-3800", "2.part3.1b_form_7207_col_e")).toBe(203_365);
    expect(run.value("form-3800", "2.part3.1b_form_7207_col_f")).toBe(-50_000);
    expect(run.value("form-3800", "2.part3.1b_form_7207_col_b")).toBe("AMP-25-0007207");
  });

  it("the explicit decision wins: false files no Form 7207 and gives Form 3800 nothing", () => {
    const run = evaluate(bran.facts, [
      ...bran.decisions,
      decision("decisions.scope.must_file_7207", false),
    ]);
    expect(run.files("form-7207")).toBe(false);
    expect(run.files("form-3800")).toBe(false);
  });

  it("a malformed facility fact is listed again", () => {
    const broken = { ...PLANT, relatedPersonElection: "no" } as unknown as typeof PLANT;
    const facts = [...bran.facts, facilityRow("broken", broken)];
    expect(evaluate(facts).missing("form-7207")).toContain(
      "advanced_manufacturing_facility.broken",
    );
  });

  it("a malformed facility fact alone still files the form, and the form waits for it", () => {
    const { passive: _dropped, ...broken } = PLANT;
    const facts = withPlant(broken as unknown as typeof PLANT);
    const run = evaluate(facts);
    expect(run.files("form-7207")).toBe(true);
    expect(run.missing("form-7207")).toEqual([PLANT_KEY]);
    expect(run.value("form-7207", "1.line.8a_total_credit")).toBeUndefined();
  });
});

describe("a stated line 1b credit with no entity next to a facility", () => {
  it("is not counted twice: Form 3800 line 1b is a gap", () => {
    const stated = row("other", "general_business_credit.current.amp-own", {
      sourceForm: "7207",
      line: "1b",
      amount: 203_365,
      passive: false,
    });
    const run = evaluate([...bran.facts, stated]);
    expect(run.value("form-7207", "1.line.8a_total_credit")).toBe(203_365);
    expect(isGap(run.field("form-3800", "2.part3.1b_form_7207_col_e"))).toBe(true);
  });
});

describe("credits from pass-through entities (line 7)", () => {
  it("a K-1 alone files no Form 7207: Form 3800 line 1b takes it directly", () => {
    const run = evaluate(withCodeV(K1_CREDIT), renald.decisions);
    expect(run.files("form-7207")).toBe(false);
    expect(run.value("form-3800", "2.part3.1b_form_7207_col_e")).toBe(K1_CREDIT);
  });

  it("with a facility, the K-1 credit goes on a separate copy, and Form 3800 counts it once", () => {
    const facts = [
      ...withCodeV(K1_CREDIT),
      facilityRow("plant", { ...PLANT, transfer: undefined }),
    ];
    const info = resolve7207Info(makeResolverInputs({ facts, decisions: renald.decisions }));
    const copies = info.form7207Copies ?? [];
    expect(copies.map((copy) => copy.key)).toEqual([
      "advanced_manufacturing_facility.plant",
      "pass-through",
    ]);
    const separate = copies[1]!;
    expect(separate.cells["0.part1.2_facility_placed_in_service_date"]).toBe(
      "Credits From Pass-Through Entities",
    );
    expect(separate.cells["1.line.7_credit_from_other_entities"]).toBe(K1_CREDIT);
    expect(separate.cells["1.line.8a_total_credit"]).toBe(K1_CREDIT);
    expect(copies[0]!.cells["1.line.7_credit_from_other_entities"]).toBeUndefined();
    const run = evaluate(facts, renald.decisions);
    // Part V breaks line 1b down: the plant's 203,365 and the K-1's 4,200.
    expect(run.value("form-3800", "2.part3.1b_form_7207_col_e")).toBe(203_365 + K1_CREDIT);
  });

  it("the decision files the separate form alone", () => {
    const decisions = [...renald.decisions, decision("decisions.scope.must_file_7207", true)];
    const info = resolve7207Info(makeResolverInputs({ facts: withCodeV(K1_CREDIT), decisions }));
    expect(info.form7207Copies?.map((copy) => copy.key)).toEqual(["pass-through"]);
  });

  it("a K-1 code V printed STMT is a gap on line 7", () => {
    const facts = [...withCodeV(undefined), facilityRow("plant", PLANT)];
    const info = resolve7207Info(makeResolverInputs({ facts, decisions: renald.decisions }));
    expect(isGap(info.form7207Copies?.[1]?.cells["1.line.7_credit_from_other_entities"])).toBe(
      true,
    );
  });

  it("a stated line 1b credit that names its entity counts on line 7", () => {
    const stated = row("other", "general_business_credit.current.amp-k1", {
      sourceForm: "7207",
      line: "1b",
      amount: 1_234.6,
      passive: false,
      passThroughEin: "00-0007208",
    });
    const facts = [...bran.facts, stated];
    const info = resolve7207Info(makeResolverInputs({ facts, decisions: bran.decisions }));
    expect(info.form7207Copies?.[1]?.cells["1.line.7_credit_from_other_entities"]).toBe(1_235);
  });
});

describe("no facts, nothing changes", () => {
  it("bran without the plant gives every form the values it has with no Form 7207", () => {
    const without = evaluate(bran.facts.filter((fact) => fact.key !== PLANT_KEY));
    expect(without.value("form-1040", "line.16")).toBe(299_570);
    expect(without.value("form-1040", "line.24")).toBe(361_718);
    expect(without.files("schedule-3")).not.toBe(true);
  });
});
