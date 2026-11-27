/*
 * FTB 3805Z on a whole return: who files, what it asks, the limitation based
 * on EZ business income, the gaps, Schedule CA (540) line 9b3, Schedule P
 * (540) line 16, Form 540 lines 43 to 48, and "no facts, nothing changes".
 * The synthetic sarene scenario is the base; seonid is the second.
 */

import { describe, expect, it } from "vitest";
import {
  CA_ENTERPRISE_ZONE_KEYS,
  makeCaFilmCreditFactKey,
  type CaEnterpriseZoneBusinessFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { enterpriseZoneCreditGap } from "../../../../../src/state/ca/3805z/creditUsed.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { sareneScenario as base } from "../../../../scenarios/synthetic/sarene/index.js";
import { seonidScenario } from "../../../../scenarios/synthetic/seonid/index.js";

const EZ_KEYS: string[] = Object.values(CA_ENTERPRISE_ZONE_KEYS);
const withoutEz = (facts: TaxFactRow[]) => facts.filter((fact) => !EZ_KEYS.includes(fact.key));

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: base.userId,
  taxYear: base.taxYear,
  category,
  key,
  value,
  sourceNote: "test",
  createdAt: "2026-11-26T00:00:00Z",
});

const factOf = (facts: TaxFactRow[], key: string) => facts.find((fact) => fact.key === key);
const sareneBusiness = factOf(base.facts, CA_ENTERPRISE_ZONE_KEYS.business)
  ?.value as CaEnterpriseZoneBusinessFactValue;

/* The base facts with one EZ fact replaced; null leaves it unstated. */
function withEz(key: string, value: unknown, facts: TaxFactRow[] = base.facts): TaxFactRow[] {
  const kept = facts.filter((fact) => fact.key !== key);
  return value === null ? kept : [...kept, row("other", key, value)];
}

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({ userId: base.userId, taxYear: base.taxYear, key, decision: value, rationale: "t" });

function evaluate(
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
  name = "form-3805z-test",
) {
  const result = evaluateScenario({
    filing: { id: name, taxYear: base.taxYear },
    facts,
    decisions,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  const field = (fieldId: string) => {
    const formId = fieldId.split(".")[0];
    const found = result.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
    if (!found) return { value: undefined, reason: undefined };
    const outcome = found.result as { ok: boolean; value?: unknown; reason?: string };
    return outcome.ok ? { value: outcome.value } : { value: undefined, reason: outcome.reason };
  };
  return {
    result,
    files,
    value: (id: string) => field(id).value,
    reason: (id: string) => field(id).reason,
  };
}

const ezField = (id: string) => `form-3805z.${id}`;

describe("who files", () => {
  it("files with a California return and a carryover above 0", () => {
    expect(evaluate(base.facts).files("form-3805z")).toBe(true);
  });

  it("does not file with no carryover above 0", () => {
    let facts = withEz(CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover, 0);
    facts = withEz(CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover, 0, facts);
    facts = withEz(CA_ENTERPRISE_ZONE_KEYS.nolCarryovers, [], facts);
    expect(evaluate(facts).files("form-3805z")).toBe(false);
  });

  it("files with only an EZ NOL carryover", () => {
    let facts = withEz(CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover, 0);
    facts = withEz(CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover, 0, facts);
    const run = evaluate(facts);
    expect(run.files("form-3805z")).toBe(true);
    expect(run.value("schedule-ca.2.line.b9b3_subtractions")).toBe(15_000);
    expect(run.value(ezField("0.line.1c_total_credit_carryover"))).toBe(0);
  });

  it("does not file without a California return, and the explicit decision wins", () => {
    const noCa = base.decisions
      .filter((each) => each.decisionKey !== "decisions.scope.must_file_ca_540")
      .concat(decision("decisions.scope.must_file_ca_540", false));
    expect(evaluate(base.facts, noCa).files("form-3805z")).toBe(false);
    const off = [...base.decisions, decision("decisions.scope.must_file_3805z", false)];
    expect(evaluate(base.facts, off).files("form-3805z")).toBe(false);
  });
});

describe("what it asks", () => {
  it("asks for each answer it reads once it files", () => {
    for (const key of [
      CA_ENTERPRISE_ZONE_KEYS.business,
      CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover,
      CA_ENTERPRISE_ZONE_KEYS.nolCarryovers,
    ]) {
      const run = evaluate(withEz(key, null));
      expect(pendingInputs(run.result).pendingFacts).toContain(key);
      expect(run.value("form-540.line.43_credit_amount")).toBeUndefined();
    }
  });

  it("asks again for a business fact with an answer missing inside it", () => {
    const { activityCode: _code, ...partial } = sareneBusiness;
    const run = evaluate(withEz(CA_ENTERPRISE_ZONE_KEYS.business, partial));
    expect(pendingInputs(run.result).pendingFacts).toContain(CA_ENTERPRISE_ZONE_KEYS.business);
  });

  it("asks again for an EZ NOL row outside 2001 to 2013", () => {
    const run = evaluate(
      withEz(CA_ENTERPRISE_ZONE_KEYS.nolCarryovers, [{ yearOfLoss: 2016, amount: 1_000 }]),
    );
    expect(pendingInputs(run.result).pendingFacts).toContain(CA_ENTERPRISE_ZONE_KEYS.nolCarryovers);
  });
});

describe("the limitation based on EZ business income", () => {
  it("sarene: line 7 is line 6a, and Form 540 line 43 takes code 176", () => {
    const run = evaluate(base.facts);
    expect(run.value(ezField("1.line.7_ez_income_limitation"))).toBe(3_200);
    expect(run.value("form-540.line.43_credit_name")).toBe("Enterprise Zone");
    expect(run.value("form-540.line.43_credit_code")).toBe("176");
    expect(run.value("form-540.line.43_credit_amount")).toBe(3_200);
    expect(run.value("form-540.line.48_tax_after_credits")).toBe(5_167 - 3_200);
  });

  it("line 7 is line 6b when the tax on the zone income is more than the return's tax", () => {
    const business = factOf(seonidScenario.facts, CA_ENTERPRISE_ZONE_KEYS.business)
      ?.value as CaEnterpriseZoneBusinessFactValue;
    const allInZone = {
      ...business,
      incomeItems: business.incomeItems.map((item) => ({ ...item, zoneShare: 1 })),
    };
    const facts = withEz(CA_ENTERPRISE_ZONE_KEYS.business, allInZone, seonidScenario.facts);
    const run = evaluate(facts, seonidScenario.decisions);
    const line6a = run.value(ezField("1.line.6a_tax_on_ez_income")) as number;
    const line6b = run.value(ezField("1.line.6b_tax_from_return")) as number;
    expect(line6a).toBeGreaterThan(line6b);
    expect(run.value(ezField("1.line.7_ez_income_limitation"))).toBe(line6b);
  });

  it("a loss from the zone uses no credit and no NOL, and both credits carry in full", () => {
    const loss = {
      ...sareneBusiness,
      incomeItems: [{ line: "schedule_c", amount: -20_000 }],
    };
    const run = evaluate(withEz(CA_ENTERPRISE_ZONE_KEYS.business, loss));
    expect(run.value(ezField("1.line.1_trade_or_business_income"))).toBe(-14_030);
    expect(run.value(ezField("1.line.7_ez_income_limitation"))).toBe(0);
    expect(run.value(ezField("0.line.1c_total_credit_carryover"))).toBe(0);
    expect(run.value(ezField("1.line.8_hiring_credit_row_b_col_g"))).toBe(1_400);
    expect(run.value(ezField("1.line.9_sales_use_tax_credit_row_b_col_g"))).toBe(2_600);
    expect(run.value(ezField("0.line.3c_ez_nol_carryover_future_years"))).toBe(15_000);
    expect(run.value("schedule-ca.2.line.b9b3_subtractions")).toBeUndefined();
    expect(run.value("form-540.line.43_credit_amount")).toBeUndefined();
  });

  it("a business entirely within the zone takes 100%", () => {
    const whole = { ...sareneBusiness, apportionment: { entirelyWithinZone: true } };
    const run = evaluate(withEz(CA_ENTERPRISE_ZONE_KEYS.business, whole));
    expect(run.value(ezField("0.line.2_average_apportionment_percentage"))).toBe("100.00%");
    expect(run.value(ezField("1.line.1_trade_or_business_income"))).toBe(125_000);
  });
});

describe("Schedule P (540) and the credits after it", () => {
  it("seonid: line 16 takes code 176 up to line 7, then Schedule S line 2 and line 45", () => {
    const run = evaluate(seonidScenario.facts, seonidScenario.decisions);
    expect(run.value("schedule-p.3.part3.16_credit_code")).toBe("176");
    expect(run.value("schedule-p.3.part3.16_credit_amount_col_a")).toBe(7_971);
    expect(run.value("schedule-p.3.part3.16_credit_used_col_b")).toBe(7_971);
    expect(run.value(ezField("0.line.1a_hiring_credit_carryover"))).toBe(7_971);
    expect(run.value("schedule-s.0.line.2_california_tax_liability")).toBe(24_729 - 7_971);
    expect(run.value("form-540.line.45_schedule_p_credits")).toBe(7_971 + 1_800 + 4_000);
  });
});

describe("FTB 3541 Part IV with an enterprise zone credit", () => {
  /* A 2025 program 4.0 credit that elects refund; the EZ credit comes after it in Section B2. */
  const program40 = row("other", makeCaFilmCreditFactKey("program-40"), {
    certificateNumber: 8300,
    yearIssued: 2025,
    copyrightRegistrationNumber: "PA0000000001",
    source: "generated",
    credit: 40_000,
    carryoverFromPriorYear: 0,
    refundableElection: true,
  });
  const line21 = "form-3541.1.line.21_ca_income_tax_liability";

  it("a credit carryover makes line 21 a gap: the engine does not reorder the credits", () => {
    const run = evaluate([...base.facts, program40]);
    expect(run.files("form-3541")).toBe(true);
    expect(run.reason(line21)).toMatch(/enterprise zone, passive/);
  });

  it("an EZ NOL alone takes no credit, so line 21 is figured", () => {
    let facts = withEz(CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover, 0);
    facts = withEz(CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover, 0, facts);
    const run = evaluate([...facts, program40]);
    expect(run.files("form-3805z")).toBe(true);
    const tax = run.value("form-540.line.35_total_tax_after_credits");
    expect(typeof tax).toBe("number");
    expect(run.value(line21)).toBe(tax);
  });
});

describe("gaps", () => {
  it("a disregarded entity's credit is a gap on FTB 3805Z and Form 540 line 43", () => {
    const disregarded = { ...sareneBusiness, throughDisregardedEntity: true };
    const run = evaluate(withEz(CA_ENTERPRISE_ZONE_KEYS.business, disregarded));
    expect(run.reason(ezField("0.line.1a_hiring_credit_carryover"))).toMatch(/disregarded entity/);
    expect(run.reason("form-540.line.43_credit_amount")).toMatch(/disregarded entity/);
    expect(run.value(ezField("1.line.7_ez_income_limitation"))).toBe(3_200);
    expect(run.value("schedule-ca.2.line.b9b3_subtractions")).toBe(15_000);
  });

  it("a credit available above $5,000,000 is a gap", () => {
    const info = { enterpriseZone: {} };
    expect(enterpriseZoneCreditGap(info, 5_000_001)?.reason).toMatch(/\$5,000,000/);
    expect(enterpriseZoneCreditGap(info, 5_000_000)).toBeUndefined();
  });

  it("Section A with no property and no payroll is a gap on line 2 and line 1", () => {
    const empty = {
      ...sareneBusiness,
      apportionment: {
        entirelyWithinZone: false,
        ownedPropertyCalifornia: 0,
        ownedPropertyZone: 0,
        netAnnualRentCalifornia: 0,
        netAnnualRentZone: 0,
        payrollCalifornia: 0,
        payrollZone: 0,
      },
    };
    const run = evaluate(withEz(CA_ENTERPRISE_ZONE_KEYS.business, empty));
    expect(run.reason(ezField("0.line.2_average_apportionment_percentage"))).toMatch(/Section A/);
    expect(run.reason(ezField("1.line.1_trade_or_business_income"))).toMatch(/Section A/);
  });
});

describe("no facts, nothing changes", () => {
  const run = evaluate(withoutEz(base.facts));

  it("the form does not file and the lines keep main's reasons", () => {
    expect(run.files("form-3805z")).toBe(false);
    expect(run.reason("schedule-ca.2.line.b9b3_subtractions")).toMatch(
      /CA-specific NOL deduction from FTB Forms 3805Z, 3807, or 3809/,
    );
    expect(run.reason("form-540.line.43_credit_amount")).toMatch(
      /No ingestion path for user-supplied special credits/,
    );
  });

  it("California AGI and the tax have no EZ deduction and no credit", () => {
    expect(run.value("form-540.line.14_ca_adjustments_subtractions")).toBe(0);
    expect(run.value("form-540.line.17_ca_agi")).toBe(116_169);
    expect(run.value("form-540.line.47_total_credits")).toBeUndefined();
  });
});
