/*
 * Form 4970 on a whole return: who files, what waits, the cases the engine
 * does not print, and Schedule 2 line 17l. The synthetic seaine scenario is
 * the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeEarlierYearReturnFactKey,
  makeTrustAccumulationDistributionFactKey,
  SPOUSE_KEYS,
  type EarlierYearReturnFactValue,
  type TrustAccumulationDistributionFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { seaineScenario as base } from "../../../scenarios/synthetic/seaine/index.js";

const isTrust = (fact: TaxFactRow) => fact.key.startsWith("trust_accumulation_distribution.");
const isEarlierYear = (fact: TaxFactRow) => fact.key.startsWith("earlier_year_return.");
const template = base.facts.find(isTrust)!;
const baseTrust = template.value as TrustAccumulationDistributionFactValue;
const otherFacts = base.facts.filter((fact) => !isTrust(fact));

const trust = (slug: string, value: Partial<TrustAccumulationDistributionFactValue> = {}) => ({
  ...template,
  id: `f-${slug}`,
  key: makeTrustAccumulationDistributionFactKey(slug),
  value: { ...baseTrust, ...value },
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const LINE_17L = "1.line.17l_tax_accumulation_distribution_trusts";
const LINE_28 = "0.line.28_partial_tax_on_accumulation_distribution";

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-4970-test", taxYear: base.taxYear },
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
  const isGap = (formId: string, id: string) => {
    const found = field(formId, id);
    return found !== undefined && !found.ok && found.unsupported === true;
  };
  return { files, value, isGap, pending: pendingInputs(result).pendingFacts };
}

const withTrust = (...extra: TaxFactRow[]) => evaluate([...otherFacts, ...extra]);
const replaceYear = (year: number, value: Partial<EarlierYearReturnFactValue>) =>
  base.facts.map((fact) =>
    fact.key === makeEarlierYearReturnFactKey(year)
      ? { ...fact, value: { ...(fact.value as object), ...value } }
      : fact,
  );

describe("Form 4970 who files", () => {
  it("files, with Schedule 2, for a domestic trust created before March 1, 1984", () => {
    const run = evaluate(base.facts);
    expect([run.files("form-4970"), run.files("schedule-2")]).toEqual([true, true]);
    expect(run.value("schedule-2", LINE_17L)).toBe(1512);
  });

  it("does not file for a domestic trust created later; line 17l is blank", () => {
    const run = withTrust(trust("later", { createdBeforeMarch1984: false }));
    expect([run.files("form-4970"), run.files("schedule-2")]).toEqual([false, false]);
  });

  it("a foreign trust files no Form 4970; line 17l is a gap (Form 3520)", () => {
    const run = withTrust(trust("abroad", { trustType: "foreign" }));
    expect([run.files("form-4970"), run.files("schedule-2")]).toEqual([false, true]);
    expect(run.isGap("schedule-2", LINE_17L)).toBe(true);
  });

  it("an explicit decision false wins; a decision true with no fact is a gap", () => {
    const off = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_4970", false),
    ]);
    expect([off.files("form-4970"), off.files("schedule-2")]).toEqual([false, false]);
    const on = evaluate(otherFacts, [
      ...base.decisions,
      decision("decisions.scope.must_file_4970", true),
    ]);
    expect(on.files("form-4970")).toBe(true);
    expect([
      on.isGap("form-4970", "0.line.1_current_distribution_earlier_years"),
      on.isGap("schedule-2", LINE_17L),
    ]).toEqual([true, true]);
  });
});

describe("California: FTB 5870A on Form 540 line 34", () => {
  const caDecisions = (more: AIDecisionRow[] = []) => [
    ...base.decisions.filter(
      (entry) =>
        entry.decisionKey !== "decisions.scope.must_file_ca_540" &&
        entry.decisionKey !== "decisions.scope.ca_residency",
    ),
    decision("decisions.scope.must_file_ca_540", true),
    decision("decisions.scope.ca_residency", "full_year"),
    ...more,
  ];

  it("a resident with the trust fact files FTB 5870A; line 34 is a gap, not a blank", () => {
    const run = evaluate(base.facts, caDecisions());
    expect([run.files("form-4970"), run.files("form-5870a")]).toEqual([true, true]);
    expect(run.isGap("form-540", "line.34_tax_amount")).toBe(true);
  });

  it("a foreign trust files FTB 5870A too", () => {
    const run = evaluate([...otherFacts, trust("abroad", { trustType: "foreign" })], caDecisions());
    expect(run.files("form-5870a")).toBe(true);
  });

  it("no Form 540, no trust fact, or a decision false: FTB 5870A does not file", () => {
    expect(evaluate(base.facts).files("form-5870a")).toBe(false);
    expect(evaluate(otherFacts, caDecisions()).files("form-5870a")).toBe(false);
    const off = evaluate(
      base.facts,
      caDecisions([decision("decisions.scope.must_file_5870a", false)]),
    );
    expect(off.files("form-5870a")).toBe(false);
  });
});

describe("No trust fact: nothing changes", () => {
  it("Form 4970 and Schedule 2 do not file; Form 1040 line 23 stays blank", () => {
    const run = evaluate(otherFacts.filter((fact) => !isEarlierYear(fact)));
    expect([run.files("form-4970"), run.files("schedule-2")]).toEqual([false, false]);
    expect(run.value("form-1040", "line.23")).toBeUndefined();
    expect(run.value("form-1040", "line.24")).toBe(12575);
  });

  it("Schedule 2 filed for another reason leaves line 17l blank, not a gap", () => {
    const run = evaluate(otherFacts, [
      ...base.decisions,
      decision("decisions.scope.must_file_schedule_2", true),
    ]);
    expect(run.value("schedule-2", LINE_17L)).toBeUndefined();
    expect(run.isGap("schedule-2", LINE_17L)).toBe(false);
  });
});

describe("Form 4970 waits for answers", () => {
  it("a missing earlier year is asked for, and the lines stay blank", () => {
    const run = evaluate(
      base.facts.filter((fact) => fact.key !== makeEarlierYearReturnFactKey(2022)),
    );
    expect(run.pending).toContain(makeEarlierYearReturnFactKey(2022));
    expect(
      run.value("form-4970", "0.line.13_taxable_income_before_distribution_col_a"),
    ).toBeUndefined();
    expect(run.value("schedule-2", LINE_17L)).toBeUndefined();
  });

  it("a computation year without its tax before credits is asked for; an eliminated one is not", () => {
    const kept = evaluate(replaceYear(2023, { taxBeforeCredits: undefined }));
    expect(kept.pending).toContain(makeEarlierYearReturnFactKey(2023));
    const dropped = evaluate(
      replaceYear(2024, { taxBeforeCredits: undefined, filingStatus: undefined }),
    );
    expect(dropped.value("form-4970", LINE_28)).toBe(1512);
  });

  it("the beneficiary's date of birth is asked for", () => {
    const run = evaluate(base.facts.filter((fact) => fact.key !== "identity.dob"));
    expect(run.pending).toContain("identity.dob");
    expect(run.value("form-4970", "0.line.2_income_accumulated_before_21")).toBeUndefined();
  });
});

describe("Cases the engine does not print", () => {
  it("two trusts: the printed lines and line 17l are gaps", () => {
    const run = withTrust(trust("first"), trust("second"));
    expect(run.value("form-4970", "0.header.g_number_of_trusts")).toBe(2);
    expect(run.isGap("form-4970", LINE_28)).toBe(true);
    expect(run.isGap("schedule-2", LINE_17L)).toBe(true);
  });

  it("estate tax on the distribution: line 28 and line 17l are gaps, line 27 is not", () => {
    const run = withTrust(trust("estate", { estateOrGenerationSkippingTax: true }));
    expect(run.value("form-4970", "0.line.27_amount_from_line_4")).toBe(14700);
    expect([run.isGap("form-4970", LINE_28), run.isGap("schedule-2", LINE_17L)]).toEqual([
      true,
      true,
    ]);
  });

  it("a computation year taxed by the Schedule D Tax Worksheet: its line 17 and lines 24 to 28", () => {
    const run = evaluate(replaceYear(2022, { otherTaxMethod: "schedule_d_tax_worksheet" }));
    expect(run.isGap("form-4970", "0.line.17_income_tax_on_line_16_col_b")).toBe(true);
    expect(run.value("form-4970", "0.line.17_income_tax_on_line_16_col_a")).toBe(18760);
    expect(run.value("form-4970", "0.line.18_income_tax_before_credits_col_b")).toBe(9038);
    expect(run.isGap("form-4970", "0.line.24_add_line_23_columns")).toBe(true);
    expect(run.isGap("schedule-2", LINE_17L)).toBe(true);
  });

  it("a throwback year in which the beneficiary reached 21 is a gap", () => {
    const rows = [...baseTrust.throwbackYears, { year: 2016, amount: 1000, taxes: 200 }];
    const run = withTrust(trust("split", { throwbackYears: rows }));
    expect(run.isGap("form-4970", "0.line.2_income_accumulated_before_21")).toBe(true);
  });

  it("a year before 21 under the multiple trust rule is a gap; a later year is not", () => {
    const [first, ...rest] = baseTrust.throwbackYears;
    const early = withTrust(
      trust("early", { throwbackYears: [{ ...first, otherTrustsCounted: 2 }, ...rest] }),
    );
    expect(early.isGap("form-4970", "0.line.2_income_accumulated_before_21")).toBe(true);
    const later = rest.map((entry) =>
      entry.year === 2019 ? { ...entry, otherTrustsCounted: 2 } : entry,
    );
    const run = withTrust(trust("later", { throwbackYears: [first, ...later] }));
    expect(run.value("form-4970", "0.line.4_taxes_imposed_on_trust")).toBe(9900);
  });

  it("a domestic trust that used to be foreign is a gap (Rev. Rul. 91-6)", () => {
    const run = withTrust(
      trust("formerly", { createdBeforeMarch1984: false, formerlyForeign: true }),
    );
    expect(run.files("form-4970")).toBe(true);
    expect(run.isGap("form-4970", "0.line.1_current_distribution_earlier_years")).toBe(true);
  });
});

describe("The spouse as beneficiary", () => {
  it("the header takes the spouse's number and date of birth", () => {
    const spouse = (key: string, value: string): TaxFactRow => ({
      ...template,
      id: `f-${key}`,
      category: "identity",
      key,
      value,
    });
    const run = evaluate(
      [
        ...otherFacts,
        trust("spouse", { beneficiary: "spouse" }),
        spouse(SPOUSE_KEYS.firstName, "Rand"),
        spouse(SPOUSE_KEYS.lastName, "Corvell"),
        spouse(SPOUSE_KEYS.occupation, "Teacher"),
        spouse(SPOUSE_KEYS.ssn, "400-00-4971"),
        spouse(SPOUSE_KEYS.dob, "07/04/1990"),
      ],
      [
        ...base.decisions.filter((entry) => entry.decisionKey !== "decisions.scope.filing_status"),
        decision("decisions.scope.filing_status", "married_filing_jointly"),
      ],
    );
    expect(run.value("form-4970", "0.header.f_beneficiary_date_of_birth")).toBe("07/04/1990");
    // Born 1990: 21 in 2011, so 2014 is after 21 and line 2 is blank.
    expect(run.value("form-4970", "0.line.2_income_accumulated_before_21")).toBeUndefined();
    expect(run.value("form-4970", "0.line.1_current_distribution_earlier_years")).toBe(69000);
  });
});
