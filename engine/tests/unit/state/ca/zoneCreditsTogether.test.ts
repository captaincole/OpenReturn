/*
 * FTB 3805Z's enterprise zone credit (code 176) and FTB 3807's LAMBRA credit
 * (code 198) on one return. The LAMBRA credit offsets tax in Schedule P (540)
 * Section A2 and the enterprise zone credit in Section B2
 * (ca-540-sched-p-inst-2025::sec::credit-table::b06), and "If your credits are
 * taken in more than one section, complete each section before going to the
 * next section" (::to-complete-part-iii::b01): the zone credit takes the tax
 * the LAMBRA credit leaves. Schedule CA (540) line 9b3 adds both forms' NOL
 * deductions (ca-540-sched-ca-inst-2025::sec::line-9b3-nol-deduction-from-form-ftb-3805z-ftb-3807-or-ftb-3809::b01).
 *
 * The return joins the made-up taxpayers' facts: shemerin's machine shop and
 * LAMBRA credit carryovers, tarna's 2011 LAMBRA NOL, and sarene's enterprise
 * zone shop, credit carryovers and EZ NOLs. Both shops are scaled down and
 * wholly inside their zones, and the Utah jobs are left out, so the tax is
 * small and under the tentative minimum tax exemption: the two credits offered
 * are more than the tax.
 */

import { describe, expect, it } from "vitest";
import {
  CA_ENTERPRISE_ZONE_KEYS,
  CA_LAMBRA_KEYS,
  makeBusinessFactKey,
  makeOtherStateTaxFactKey,
  type BusinessFactValue,
  type CaEnterpriseZoneBusinessFactValue,
  type CaLambraBusinessFactValue,
  type CaLambraIncomeRow,
  type CaLambraNolCarryover,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { sareneScenario } from "../../../scenarios/synthetic/sarene/index.js";
import { shemerinScenario as base } from "../../../scenarios/synthetic/shemerin/index.js";
import { tarnaScenario } from "../../../scenarios/synthetic/tarna/index.js";

const LAMBRA_SHOP_KEY = makeBusinessFactKey("calloway-machining");
const ZONE_SHOP_KEY = makeBusinessFactKey("kestrel-machine");

const valueOf = <T>(facts: TaxFactRow[], key: string) =>
  facts.find((fact) => fact.key === key)?.value as T;

/* Shemerin's shop with $42,500 of profit, all of it at Tustin Legacy. */
const lambraShop: BusinessFactValue = {
  ...valueOf<BusinessFactValue>(base.facts, LAMBRA_SHOP_KEY),
  grossReceipts: 482500,
};
const lambraBusiness: CaLambraBusinessFactValue = {
  ...valueOf<CaLambraBusinessFactValue>(base.facts, CA_LAMBRA_KEYS.business),
  grossReceipts: 482500,
  whollyWithinLambra: true,
  property: undefined,
  payroll: undefined,
};
const lambraIncome: CaLambraIncomeRow[] = [
  { line: "schedule_c", description: "Calloway Precision Machining", amount: 42500 },
];
/* Tarna's 2011 LAMBRA NOL ($20,000); her 2012 loss would take all the LAMBRA income. */
const lambraNol = valueOf<CaLambraNolCarryover[]>(
  tarnaScenario.facts,
  CA_LAMBRA_KEYS.nolCarryovers,
).filter((row) => row.yearOfLoss === 2011);

/* Sarene's shop with $37,500 of profit, all of it in the former Fresno zone. */
const zoneShop: BusinessFactValue = {
  ...valueOf<BusinessFactValue>(sareneScenario.facts, ZONE_SHOP_KEY),
  grossReceipts: 172500,
};
const sareneZone = valueOf<CaEnterpriseZoneBusinessFactValue>(
  sareneScenario.facts,
  CA_ENTERPRISE_ZONE_KEYS.business,
);
const zoneBusiness: CaEnterpriseZoneBusinessFactValue = {
  ...sareneZone,
  grossReceipts: 172500,
  apportionment: { entirelyWithinZone: true },
  incomeItems: [{ ...sareneZone.incomeItems[0], amount: 37500 }],
};

const row = (fact: TaxFactRow, value: unknown): TaxFactRow => ({
  ...fact,
  userId: base.userId,
  taxYear: base.taxYear,
  value,
});

/* Sarene's zone facts, as hers: the shop, the business, both credits and both EZ NOLs. */
const ZONE_FACTS: Record<string, unknown> = {
  [ZONE_SHOP_KEY]: zoneShop,
  [CA_ENTERPRISE_ZONE_KEYS.business]: zoneBusiness,
  [CA_ENTERPRISE_ZONE_KEYS.hiringCreditCarryover]: undefined,
  [CA_ENTERPRISE_ZONE_KEYS.salesTaxCreditCarryover]: undefined,
  [CA_ENTERPRISE_ZONE_KEYS.nolCarryovers]: undefined,
};
const zoneFacts = sareneScenario.facts
  .filter((fact) => fact.key in ZONE_FACTS)
  .map((fact) => row(fact, ZONE_FACTS[fact.key] ?? fact.value));

const LAMBRA_CHANGES: Record<string, unknown> = {
  [LAMBRA_SHOP_KEY]: lambraShop,
  [CA_LAMBRA_KEYS.business]: lambraBusiness,
  [CA_LAMBRA_KEYS.businessIncome]: lambraIncome,
  [CA_LAMBRA_KEYS.nolCarryovers]: lambraNol,
};
const UTAH = makeOtherStateTaxFactKey("ut");
const lambraFacts = base.facts
  .filter((fact) => fact.key !== UTAH)
  .map((fact) => (fact.key in LAMBRA_CHANGES ? row(fact, LAMBRA_CHANGES[fact.key]) : fact));

function evaluate(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "zone-credits-together", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  return (formId: string, id: string) => {
    const found = result.forms
      .get(formId)
      ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
    return found?.ok ? found.value : undefined;
  };
}

/*
 * Hand check. Profits 42,500 + 37,500; half the SE tax 5,652 (80,000 ×
 * 0.9235 × 15.3% ÷ 2): federal AGI 74,348, under the $92,749 AMT exemption,
 * so TMT is 0. Line 9b3: 20,000 (FTB 3807 line 3b) + 15,000 (FTB 3805Z line
 * 3b). Taxable income 74,348 − 35,000 − 5,706 = 33,642; line 35 is the tax
 * table's 708 less 153, 555. Each zone's Schedule Z line 5 is 22,500 (42,500
 * − 20,000; 37,500 − 15,000), so each line 7 is 339, the tax on 22,500. The
 * two credits offer 678, more than the 555 of tax.
 */
describe("FTB 3805Z and FTB 3807 on one return", () => {
  const value = evaluate([...lambraFacts, ...zoneFacts]);
  const used = (line: string) => value("schedule-p", `${line}_credit_used_col_b`) as number;

  it("takes the LAMBRA credit in Section A2 first, then the zone credit from what is left", () => {
    expect(value("form-540", "line.35_total_tax_after_credits")).toBe(555);
    expect(value("schedule-p", "1.part3.2_tentative_minimum_tax")).toBe(0);
    expect(value("schedule-p", "2.part3.6_credit_code")).toBe("198");
    expect(value("schedule-p", "2.part3.6_credit_amount_col_a")).toBe(339);
    expect(used("2.part3.6")).toBe(339);
    expect(value("schedule-p", "2.part3.11_tax_balance_col_c")).toBe(216);
    expect(value("schedule-p", "3.part3.16_credit_code")).toBe("176");
    expect(value("schedule-p", "3.part3.16_credit_amount_col_a")).toBe(339);
    expect(used("3.part3.16")).toBe(216);
    expect(value("schedule-p", "3.part3.16_tax_balance_col_c")).toBe(0);
    expect(value("schedule-p", "3.part3.16_credit_carryover_col_d")).toBe(123);
    expect(value("form-3807", "0.line.1c_total_credit_carryover")).toBe(339);
    expect(value("form-3805z", "0.line.1c_total_credit_carryover")).toBe(216);
  });

  it("never uses more credit than the tax", () => {
    const tax = value("form-540", "line.35_total_tax_after_credits") as number;
    expect(used("2.part3.6") + used("3.part3.16")).toBe(tax);
  });

  it("puts both credits on Form 540 lines 43 and 44", () => {
    expect(value("form-540", "line.43_credit_code")).toBe("198");
    expect(value("form-540", "line.43_credit_amount")).toBe(339);
    expect(value("form-540", "line.44_credit_code")).toBe("176");
    expect(value("form-540", "line.44_credit_amount")).toBe(216);
    expect(value("form-540", "line.45_schedule_p_credits")).toBeUndefined();
    expect(value("form-540", "line.47_total_credits")).toBe(555);
    expect(value("form-540", "line.48_tax_after_credits")).toBe(0);
  });

  it("adds both NOL deductions on Schedule CA line 9b3, column B", () => {
    expect(value("form-3807", "0.line.3b_nol_deduction_current_year")).toBe(20000);
    expect(value("form-3805z", "0.line.3b_ez_nol_deduction_current_year")).toBe(15000);
    expect(value("schedule-ca", "2.line.b9b3_subtractions")).toBe(35000);
    expect(value("schedule-ca", "2.line.b10_subtractions")).toBe(35000);
    expect(value("form-540", "line.14_ca_adjustments_subtractions")).toBe(35000);
  });

  it("gives the zone credit its whole line 7 with no LAMBRA credit", () => {
    const noLambraCredit = lambraFacts.map((fact) =>
      fact.key === CA_LAMBRA_KEYS.hiringCreditCarryover ||
      fact.key === CA_LAMBRA_KEYS.salesUseTaxCreditCarryover
        ? row(fact, 0)
        : fact,
    );
    const alone = evaluate([...noLambraCredit, ...zoneFacts]);
    expect(alone("form-540", "line.43_credit_code")).toBe("176");
    expect(alone("form-540", "line.43_credit_amount")).toBe(339);
    expect(alone("form-540", "line.48_tax_after_credits")).toBe(216);
  });
});
