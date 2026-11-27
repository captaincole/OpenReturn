/*
 * Form 7218 on a whole return: who files, the copies, the rows that earn no
 * credit, the answers it waits on, the gaps, and Form 3800 Part III line 1q.
 * The synthetic abell scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeCleanFuelFacilityFactKey,
  makeGeneralBusinessCreditFactKey,
  type CleanFuelFacilityFactValue,
  type CleanFuelSale,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { resolve3800Info } from "../../../../src/federal/3800/resolveInfo.js";
import { PASS_THROUGH_COPY } from "../../../../src/federal/7218/copies.js";
import { resolve7218Info } from "../../../../src/federal/7218/resolveInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  BIOREFINERY_KEY,
  DIGESTER_KEY,
  biorefinery,
  digester,
} from "../../../scenarios/synthetic/abell/facts.js";
import { abellScenario as base } from "../../../scenarios/synthetic/abell/index.js";

const LINE_1 = "0.part2.1_amount_from_part3_line25h";
const LINE_2 = "0.part2.2_credit_from_pass_through";
const LINE_3 = "0.part2.3_add_lines_1_and_2";
const LINE_25 = "1.part3.25_total_of_column_h";
const PART_III_1Q_E = "2.part3.1q_form_7218_part_ii_col_e";
const PART_III_1Q_F = "2.part3.1q_form_7218_part_ii_col_f";
const K1_PREFIX = "k1.";

const isGap = (value: unknown) => (value as { unsupported?: boolean })?.unsupported === true;

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

/* The scenario's facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const withoutFacilities = () =>
  factsWith({ [BIOREFINERY_KEY]: undefined, [DIGESTER_KEY]: undefined });
const withoutK1 = (facts: TaxFactRow[]) => facts.filter((fact) => !fact.key.startsWith(K1_PREFIX));

const info = (facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) =>
  resolve7218Info(makeResolverInputs({ facts, decisions }));

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-7218-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const value = (formId: string, id: string) => {
    const found = result.forms
      .get(formId)
      ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
    return found?.ok ? found.value : undefined;
  };
  return { files, value };
}

const cellsOf = (facts: TaxFactRow[], key: string) =>
  info(facts).form7218Copies?.find((copy) => copy.key === key)?.cells ?? {};

const withSales = (sales: CleanFuelSale[]): CleanFuelFacilityFactValue => ({
  ...biorefinery,
  sales,
});

describe("Form 7218 who files (how-to-claim-the-credit::b02, part-ii-clean-aviation-and::b01)", () => {
  it("files one copy for each facility and one for the pass-through credits", () => {
    const copies = info(base.facts).form7218Copies ?? [];
    expect(copies.map((copy) => copy.key)).toEqual([
      BIOREFINERY_KEY,
      DIGESTER_KEY,
      PASS_THROUGH_COPY,
    ]);
    expect(copies.map((copy) => copy.cells[LINE_3])).toEqual([51678, 10080, 3200]);
  });

  it("files no Form 7218 for a K-1 credit alone: Form 3800 line 1q takes it directly", () => {
    const run = evaluate(withoutFacilities());
    expect(run.files("form-7218")).toBe(false);
    expect(run.value("form-3800", PART_III_1Q_E)).toBe(3200);
  });

  it("with no clean fuel fact, neither Form 7218 nor Form 3800 files", () => {
    const run = evaluate(withoutK1(withoutFacilities()));
    expect([run.files("form-7218"), run.files("form-3800")]).toEqual([false, false]);
  });

  it("a facility with a section 45V, 45Q or 48(a)(15) credit is not a qualified facility (qualified-facility::b01)", () => {
    const facts = factsWith({
      [BIOREFINERY_KEY]: { ...biorefinery, otherFacilityCreditAllowed: true },
    });
    const copies = info(facts).form7218Copies ?? [];
    expect(copies.map((copy) => copy.key)).toEqual([DIGESTER_KEY, PASS_THROUGH_COPY]);
  });

  it("an explicit decision false wins; Form 3800 keeps the K-1 credit only", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_7218", false),
    ]);
    expect(run.files("form-7218")).toBe(false);
    expect(run.value("form-3800", PART_III_1Q_E)).toBe(3200);
  });

  it("an explicit decision true with only a K-1 prints the pass-through form alone", () => {
    const facts = withoutFacilities();
    const decisions = [...base.decisions, decision("decisions.scope.must_file_7218", true)];
    const copies = info(facts, decisions).form7218Copies ?? [];
    expect(copies.map((copy) => copy.key)).toEqual([PASS_THROUGH_COPY]);
    expect(evaluate(facts, decisions).value("form-3800", PART_III_1Q_E)).toBe(3200);
  });
});

describe("Form 7218 lines of a facility", () => {
  it("prints Part II lines 1 and 3 and leaves line 2 and the cooperative lines blank", () => {
    const run = evaluate(base.facts);
    expect([LINE_1, LINE_2, LINE_3, LINE_25].map((id) => run.value("form-7218", id))).toEqual([
      51678,
      undefined,
      51678,
      51678,
    ]);
    expect(run.value("form-7218", "0.part2.4_allocated_to_patrons_beneficiaries")).toBeUndefined();
    expect(run.value("form-7218", "0.part2.5_cooperatives_estates_trusts_credit")).toBeUndefined();
  });

  it("an uncertified SAF row and a fuel above 50 kg take no row", () => {
    const cells = cellsOf(base.facts, BIOREFINERY_KEY);
    expect(cells["1.part3.row4_col_b_type_of_feedstock"]).toBe("Camelina oil");
    expect(cells["1.part3.row5_col_a_type_of_fuel"]).toBeUndefined();
  });

  it("a fuel produced wholly before the registration letter takes no row (line-5b::b01)", () => {
    const [first, second] = biorefinery.sales;
    const sales = [{ ...first!, gallonsProducedBeforeRegistration: first!.gallons }, second!];
    const cells = cellsOf(factsWith({ [BIOREFINERY_KEY]: withSales(sales) }), BIOREFINERY_KEY);
    expect(cells["1.part3.row1_col_b_type_of_feedstock"]).toBe("Soybean oil");
    expect(cells["1.part3.row2_col_a_type_of_fuel"]).toBeUndefined();
  });

  it("a letter dated after 2025 leaves no row, and the facility files no Form 7218 (how-to-claim-the-credit::b02)", () => {
    const late = { ...biorefinery, registration: { number: "CN-1", approvalDate: "2026-02-01" } };
    const copies = info(factsWith({ [BIOREFINERY_KEY]: late })).form7218Copies ?? [];
    expect(copies.map((copy) => copy.key)).toEqual([DIGESTER_KEY, PASS_THROUGH_COPY]);
    const alone = withoutK1(factsWith({ [BIOREFINERY_KEY]: late, [DIGESTER_KEY]: undefined }));
    expect(evaluate(alone).files("form-7218")).toBe(false);
  });

  it("line 7 No takes the base amount; a sold transfer prints its registration number on line 1", () => {
    const cells = cellsOf(base.facts, DIGESTER_KEY);
    expect(cells["1.part3.row1_col_g_applicable_amount"]).toBe("0.21");
    expect(cells["0.part1.7_prevailing_wage_apprenticeship_no"]).toBe(true);
    expect(cells["0.part1.7_prevailing_wage_apprenticeship_yes"]).toBeUndefined();
    expect(cells["0.part1.1_facility_registration_number"]).toBe("R-2025-0007219");
  });

  it("more than 24 rows: line 25 and line 3 are gaps", () => {
    const sales = Array.from({ length: 25 }, (_, index) => ({
      ...biorefinery.sales[1]!,
      feedstock: `Soybean oil lot ${index + 1}`,
    }));
    const cells = cellsOf(factsWith({ [BIOREFINERY_KEY]: withSales(sales) }), BIOREFINERY_KEY);
    expect(isGap(cells[LINE_25])).toBe(true);
    expect(isGap(cells[LINE_3])).toBe(true);
  });
});

describe("Form 7218 waits on an answer (missingInputs)", () => {
  it("lists the facility while a row lacks its gallons before a 2025 registration letter", () => {
    const sales = [{ ...biorefinery.sales[0]!, gallonsProducedBeforeRegistration: undefined }];
    const facts = factsWith({ [BIOREFINERY_KEY]: withSales(sales) });
    expect(info(facts).missingInputs?.["form-7218"]).toEqual([BIOREFINERY_KEY]);
    expect(cellsOf(facts, BIOREFINERY_KEY)[LINE_25]).toBeUndefined();
    const form3800 = resolve3800Info(makeResolverInputs({ facts, decisions: base.decisions }));
    expect(form3800.missingInputs?.["form-3800"]).toContain(BIOREFINERY_KEY);
  });

  it("lists the facility while a SAF row lacks its certification answer", () => {
    const sales = [{ ...biorefinery.sales[2]!, unrelatedPartyCertification: undefined }];
    const facts = factsWith({ [BIOREFINERY_KEY]: withSales(sales) });
    expect(info(facts).missingInputs?.["form-7218"]).toEqual([BIOREFINERY_KEY]);
  });
});

describe("Form 7218 on Form 3800 Part III line 1q", () => {
  it("adds each facility's line 3 to the K-1 credit, with the transfer in column (f)", () => {
    const run = evaluate(base.facts);
    expect(run.value("form-3800", PART_III_1Q_E)).toBe(51678 + 10080 + 3200);
    expect(run.value("form-3800", PART_III_1Q_F)).toBe(-4000);
  });

  it("a stated line 1q credit with no entity becomes a gap next to a facility", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("fuel"), {
      sourceForm: "7218 Part II",
      line: "1q",
      amount: 5000,
      passive: false,
    });
    const inputs = makeResolverInputs({
      facts: factsWith({}, [stated]),
      decisions: base.decisions,
    });
    const source = resolve3800Info(inputs).form3800Sources?.current.find(
      (each) => each.credit.key === stated.key,
    );
    expect(isGap(source?.credit.amount)).toBe(true);
  });

  it("a stated line 1q credit that names a cooperative adds to the pass-through form's line 2", () => {
    const cooperative = row("other", makeGeneralBusinessCreditFactKey("coop"), {
      sourceForm: "7218 Part II",
      line: "1q",
      amount: 812.6,
      passive: false,
      passThroughEin: "00-0007221",
    });
    const cells = cellsOf(factsWith({}, [cooperative]), PASS_THROUGH_COPY);
    expect(cells[LINE_2]).toBe(3200 + 813);
    expect(cells["0.part1.2a_facility_description"]).toBe("Credits from Pass-Through Entities");
  });

  it("a purchased transfer on a facility is a gap", () => {
    const transfer = { direction: "purchased" as const, amount: 100, registrationNumber: "R-1" };
    const facts = factsWith({ [DIGESTER_KEY]: { ...digester, transfer } });
    const inputs = makeResolverInputs({ facts, decisions: base.decisions });
    const source = resolve3800Info(inputs).form3800Sources?.current.find(
      (each) => each.credit.key === DIGESTER_KEY,
    );
    expect(isGap(source?.credit.amount)).toBe(true);
  });

  it("a sale above the facility's line 3 is a gap (usc-26-2025::sec::s6418::a)", () => {
    const transfer = { direction: "sold" as const, amount: 10081, registrationNumber: "R-1" };
    const source = (amount: number) => {
      const facts = factsWith({
        [DIGESTER_KEY]: { ...digester, transfer: { ...transfer, amount } },
      });
      const inputs = makeResolverInputs({ facts, decisions: base.decisions });
      return resolve3800Info(inputs).form3800Sources?.current.find(
        (each) => each.credit.key === DIGESTER_KEY,
      );
    };
    expect(isGap(source(10081)?.credit.amount)).toBe(true);
    expect(source(10080)?.credit.amount).toBe(10080);
  });

  it("a second facility fact key is its own copy and its own source", () => {
    const extra = row("other", makeCleanFuelFacilityFactKey("third"), digester);
    const inputs = makeResolverInputs({ facts: factsWith({}, [extra]), decisions: base.decisions });
    const keys = resolve3800Info(inputs).form3800Sources?.current.map((each) => each.credit.key);
    expect(keys).toContain(extra.key);
  });
});
