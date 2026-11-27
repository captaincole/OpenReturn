/*
 * Form 8332 on a whole return: who files, one copy for each child, and what
 * the release moves. "If conditions (1) through (4) apply, only the
 * noncustodial parent can claim the child for purposes of the child tax credit
 * and credit for other dependents" (irs-1040-inst-2025::sec::definitions-and-special-rules::b02),
 * and "this doesn't allow the noncustodial parent to claim head of household
 * filing status, the credit for child and dependent care expenses, the
 * exclusion for dependent care benefits, or the earned income credit" (::b03).
 * The synthetic ellorien scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  HEAD_OF_HOUSEHOLD_KEYS,
  makeDependentCareQualifyingPersonFactKey,
  makeDependentFactKey,
  makeForm8332FactKey,
  type DependentFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { qualifyingPersonRows } from "../../../../src/federal/2441/resolveInfo.js";
import type { Form8332FilingInfo } from "../../../../src/federal/8332/filingInfo.js";
import { noReleaseForYear } from "../../../../src/federal/8332/lines.js";
import type { Form8962FilingInfo } from "../../../../src/federal/8962/filingInfo.js";
import type { Schedule8812FilingInfo } from "../../../../src/federal/schedule-8812/filingInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ellorienDecisions } from "../../../scenarios/synthetic/ellorien/decisions.js";
import {
  ELLORIEN_TAX_YEAR,
  ELLORIEN_USER_ID,
  MIRA,
  SENNA,
  SENNA_REVOCATION,
  TOBIN,
  ellorienFacts,
} from "../../../scenarios/synthetic/ellorien/facts.js";

const MIRA_KEY = makeDependentFactKey("mira-tarvale");
const TOBIN_KEY = makeDependentFactKey("tobin-tarvale");
const SENNA_KEY = makeDependentFactKey("senna-tarvale");
const RELEASE_KEY = makeForm8332FactKey("release", "tobin-tarvale");
const REVOCATION_KEY = makeForm8332FactKey("revocation", "senna-tarvale");
const FORM_8332_KEYS = [RELEASE_KEY, REVOCATION_KEY];

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  id: `f-test-${key}`,
  userId: ELLORIEN_USER_ID,
  taxYear: ELLORIEN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote: "test",
  createdAt: "2026-11-26T00:00:00Z",
});

/* The fact replaced in its place (the order of the dependents stays), or added at the end. */
const withFact = (facts: TaxFactRow[], category: string, key: string, value: unknown) =>
  facts.some((fact) => fact.key === key)
    ? facts.map((fact) => (fact.key === key ? row(category, key, value) : fact))
    : [...facts, row(category, key, value)];
const withDependent = (facts: TaxFactRow[], key: string, value: DependentFactValue) =>
  withFact(facts, "dependents", key, value);
const without = (facts: TaxFactRow[], ...keys: string[]) =>
  facts.filter((fact) => !keys.includes(fact.key));

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: ELLORIEN_USER_ID,
    taxYear: ELLORIEN_TAX_YEAR,
    key,
    decision: value,
    rationale: "test",
  });

/* The base return with none of this form's facts: no release flags, no Form 8332 facts. */
const noForm8332Facts = withDependent(
  withDependent(without(ellorienFacts, ...FORM_8332_KEYS), MIRA_KEY, {
    ...MIRA,
    releasedToNoncustodialParent: undefined,
  }),
  TOBIN_KEY,
  { ...TOBIN, form8332Release: undefined },
);

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = ellorienDecisions) {
  const result = evaluateScenario({
    filing: { id: "form-8332-test", taxYear: ELLORIEN_TAX_YEAR },
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
  const info = result.filingInfo as Form8332FilingInfo &
    Schedule8812FilingInfo &
    Form8962FilingInfo & { hohChildNotDependentName?: string };
  return { files, field, value, info };
}

describe("Form 8332 who files", () => {
  it("one copy for each child: Tobin's release, then Senna's revocation", () => {
    const run = evaluate(ellorienFacts);
    expect(run.files("form-8332")).toBe(true);
    expect(run.info.form8332Copies?.map((copy) => [copy.kind, copy.dependentKey])).toEqual([
      ["release", TOBIN_KEY],
      ["revocation", SENNA_KEY],
    ]);
    expect(run.info.missingInputs?.["form-8332"]).toEqual([]);
  });

  it("a custodial parent who released the claim files no Form 8332: she gives it to the other parent", () => {
    const run = evaluate(without(ellorienFacts, RELEASE_KEY, REVOCATION_KEY, TOBIN_KEY));
    expect(run.files("form-8332")).toBe(false);
  });

  it("a revocation given in 2025 is not effective for 2025, so no copy is attached", () => {
    const facts = withFact(ellorienFacts, "dependents", REVOCATION_KEY, {
      ...SENNA_REVOCATION,
      givenYear: 2025,
    });
    expect(evaluate(facts).info.form8332Copies?.map((copy) => copy.kind)).toEqual(["release"]);
  });

  it("a noncustodial parent with no release fact yet files the form and waits for it", () => {
    const run = evaluate(without(ellorienFacts, RELEASE_KEY));
    expect(run.files("form-8332")).toBe(true);
    expect(run.info.missingInputs?.["form-8332"]).toEqual([RELEASE_KEY]);
    expect(run.value("form-8332", "0.part1.child_name")).toBe("Tobin Tarvale");
    expect(run.value("form-8332", "0.part1.tax_year")).toBe("25");
    expect(run.value("form-8332", "0.part1.custodial_parent_ssn")).toBeUndefined();
  });

  it("a revocation fact missing an answer files the form and waits for it", () => {
    const facts = withFact(ellorienFacts, "dependents", REVOCATION_KEY, { givenYear: 2024 });
    expect(evaluate(facts).info.missingInputs?.["form-8332"]).toEqual([REVOCATION_KEY]);
  });

  it("a release that does not name 2025 makes every field of that copy a gap", () => {
    const facts = withFact(ellorienFacts, "dependents", RELEASE_KEY, {
      custodialParentSsn: "400-00-8333",
      currentYear: 2024,
    });
    const field = evaluate(facts).field("form-8332", "0.part1.child_name");
    expect(field).toMatchObject({
      ok: false,
      unsupported: true,
      reason: noReleaseForYear("Tobin Tarvale"),
    });
  });

  it("the spouse named as the parent on a return that is not joint is a gap", () => {
    const facts = withFact(ellorienFacts, "dependents", RELEASE_KEY, {
      custodialParentSsn: "400-00-8333",
      parent: "spouse",
    });
    expect(evaluate(facts).field("form-8332", "0.header.noncustodial_parent_name")).toMatchObject({
      ok: false,
      unsupported: true,
    });
  });

  it("the decision still wins", () => {
    const decisions = [...ellorienDecisions, decision("decisions.scope.must_file_8332", false)];
    expect(evaluate(ellorienFacts, decisions).files("form-8332")).toBe(false);
  });
});

describe("what the release moves", () => {
  it("the released child is not on the Dependents table and earns no child tax credit", () => {
    const run = evaluate(ellorienFacts);
    expect(run.info.dependents?.map((each) => each.factKey)).toEqual([TOBIN_KEY, SENNA_KEY]);
    expect(run.value("schedule-8812", "0.line.4_qualifying_children_under_17")).toBe(2);
    expect(run.value("form-1040", "dependents.dep1_first_name")).toBe("Tobin");
  });

  it("the released child stays the custodial parent's EIC child", () => {
    const run = evaluate(ellorienFacts);
    expect(run.value("schedule-eic", "0.line.1_name_child_1")).toBe("Mira Tarvale");
    expect(run.value("schedule-eic", "0.line.1_name_child_2")).toBe("Senna Tarvale");
  });

  it("the noncustodial parent with the release claims the child tax credit, and without it does not", () => {
    const withRelease = evaluate(ellorienFacts);
    const tobin = withRelease.info.dependents?.find((each) => each.factKey === TOBIN_KEY);
    expect(tobin?.credit).toBe("child_tax_credit");
    const noRelease = evaluate(
      withDependent(ellorienFacts, TOBIN_KEY, { ...TOBIN, form8332Release: false }),
    );
    expect(noRelease.value("schedule-8812", "0.line.4_qualifying_children_under_17")).toBe(1);
    // Without the release Tobin is the other parent's qualifying child: no dependent here, no ODC.
    expect(noRelease.info.dependents?.some((each) => each.factKey === TOBIN_KEY)).toBe(false);
    expect(noRelease.value("schedule-8812", "0.line.6_other_dependents")).toBe(0);
    expect(noRelease.info.form8332Copies?.map((copy) => copy.kind)).toEqual(["revocation"]);
  });

  it("the released child stays a dependent care qualifying person (irs-2441-inst-2025::sec::qualifying-person-s::b03)", () => {
    const personKey = makeDependentCareQualifyingPersonFactKey("mira-tarvale");
    const facts = withFact(ellorienFacts, "dependents", personKey, {
      dependentSlug: "mira-tarvale",
      expensesPaid: 2400,
    });
    const rows = qualifyingPersonRows(makeResolverInputs({ facts, decisions: ellorienDecisions }));
    expect(rows.map(({ row: person }) => [person.firstName, person.ssn])).toEqual([
      ["Mira", MIRA.ssn],
    ]);
  });

  /*
   * ca-540-inst-2025::sec::line-10-dependent-exemptions::b01: "The persons you
   * list as dependents must be the same persons you listed as dependents on
   * your federal income tax return." Ellorien as a California resident.
   */
  it("Form 540 line 10 lists the same dependents: the released child leaves it", () => {
    const california = [
      ...ellorienDecisions.filter(
        (each) =>
          each.decisionKey !== "decisions.scope.must_file_ca_540" &&
          each.decisionKey !== "decisions.scope.ca_residency",
      ),
      decision("decisions.scope.must_file_ca_540", true),
      decision("decisions.scope.ca_residency", "full_year"),
    ];
    const run = evaluate(ellorienFacts, california);
    expect(run.files("form-540")).toBe(true);
    expect(run.value("form-540", "dependents.dep1_first_name")).toBe("Tobin");
    expect(run.value("form-540", "dependents.dep2_first_name")).toBe("Senna");
    expect(run.value("form-540", "dependents.dep3_first_name")).toBeUndefined();
    expect(run.value("form-540", "line.10_dependent_exemption_count")).toBe(2);
    expect(run.value("form-540", "line.10_dependent_exemption_amount")).toBe(950);
    const noRelease = evaluate(
      withDependent(ellorienFacts, TOBIN_KEY, { ...TOBIN, form8332Release: false }),
      california,
    );
    expect(noRelease.value("form-540", "line.10_dependent_exemption_count")).toBe(1);
    expect(noRelease.value("form-540", "line.10_dependent_exemption_amount")).toBe(475);
    const unreleased = evaluate(noForm8332Facts, california);
    expect(unreleased.value("form-540", "line.10_dependent_exemption_count")).toBe(3);
    expect(unreleased.value("form-540", "line.10_dependent_exemption_amount")).toBe(1425);
  });

  it("Form 8962's tax family leaves the released child out", () => {
    expect(evaluate(ellorienFacts).info.dependentCount).toBe(2);
    expect(evaluate(noForm8332Facts).info.dependentCount).toBe(3);
  });
});

describe("Form 1040, the head of household child's name (irs-1040-inst-2025::sec::head-of-household::b03)", () => {
  it("names the released child the answer names as the qualifying person", () => {
    expect(evaluate(ellorienFacts).value("form-1040", "header.hoh_qss_qualifying_child_name")).toBe(
      "Mira Tarvale",
    );
  });

  it("asks which child when a released child and a claimed child at home can both qualify", () => {
    const run = evaluate(without(ellorienFacts, HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson));
    expect(run.info.missingInputs?.["form-1040"]).toContain(
      HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson,
    );
    expect(run.value("form-1040", "header.hoh_qss_qualifying_child_name")).toBeUndefined();
  });

  it("names the released child with no answer when no claimed dependent lived at home", () => {
    const facts = without(
      ellorienFacts,
      HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson,
      SENNA_KEY,
      REVOCATION_KEY,
    );
    expect(evaluate(facts).value("form-1040", "header.hoh_qss_qualifying_child_name")).toBe(
      "Mira Tarvale",
    );
  });

  it("is blank when the qualifying person is a dependent, or the status is not head of household", () => {
    const senna = withFact(
      ellorienFacts,
      "filing_status",
      HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson,
      "senna-tarvale",
    );
    expect(
      evaluate(senna).value("form-1040", "header.hoh_qss_qualifying_child_name"),
    ).toBeUndefined();
    const single = [
      ...ellorienDecisions.filter((each) => each.decisionKey !== "decisions.scope.filing_status"),
      decision("decisions.scope.filing_status", "single"),
    ];
    expect(
      evaluate(ellorienFacts, single).value("form-1040", "header.hoh_qss_qualifying_child_name"),
    ).toBeUndefined();
  });
});

describe("no Form 8332 facts, nothing changes", () => {
  it("every dependent fact is a claimed dependent, and the form does not file", () => {
    const run = evaluate(noForm8332Facts);
    expect(run.files("form-8332")).toBe(false);
    expect(run.info.dependents?.map((each) => each.factKey)).toEqual([
      MIRA_KEY,
      TOBIN_KEY,
      SENNA_KEY,
    ]);
    expect(run.info.hohChildNotDependentName).toBeUndefined();
    expect(run.info.missingInputs?.["form-1040"]).not.toContain(
      HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson,
    );
  });

  it("a revocation fact for a child the parent does not claim, or not in 2025, files nothing", () => {
    const facts = withFact(
      without(ellorienFacts, RELEASE_KEY, TOBIN_KEY),
      "dependents",
      REVOCATION_KEY,
      { ...SENNA_REVOCATION, revokedYears: [2026] },
    );
    expect(evaluate(facts).files("form-8332")).toBe(false);
    expect(SENNA.releasedToNoncustodialParent).toBeUndefined();
  });
});
