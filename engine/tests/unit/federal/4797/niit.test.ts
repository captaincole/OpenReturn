/*
 * Form 8960 line 5b takes out the gain or loss on property of a non-section 1411
 * trade or business (irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b01).
 * The base is berelain with a 300,000 W-2 added, so her MAGI is over the
 * 200,000 threshold. Every sale is her print shop's (line G "Yes"), so the
 * Form 4797 amount on line 5a (126,360) comes out again on line 5b.
 */

import { describe, expect, it } from "vitest";
import {
  NO_BUSINESS,
  RENTAL_KEYS,
  makeBusinessPropertySaleFactKey,
  makeRentalFactKey,
  makeW2FactKey,
  type BusinessPropertySaleFactValue,
  type RentalFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { berelainScenario as base } from "../../../scenarios/synthetic/berelain/index.js";

const FORM = "form-8960";
const LINE_5A = "0.line.5a";
const LINE_5B = "0.line.5b";
const LINE_5D = "0.line.5d";
const LINE_17 = "0.line.17";

const template = base.facts.find((fact) => fact.category === "wages")!;
const fact = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});

const bigW2 = fact("wages", makeW2FactKey("plains-hospital"), {
  ...(template.value as object),
  employerName: "Plains Regional Hospital",
  box1: 300000,
  box2: 60000,
  box3: 176100,
  box4: 10918,
  box5: 300000,
  box6: 4350,
});

const LAPTOP = makeBusinessPropertySaleFactKey("design-laptop");
const HAY_FIELD = makeBusinessPropertySaleFactKey("hay-field");

function relink(facts: TaxFactRow[], key: string, link: Partial<BusinessPropertySaleFactValue>) {
  return facts.map((each) => {
    if (each.key !== key) return each;
    const { businessId: _id, ...rest } = each.value as BusinessPropertySaleFactValue;
    return { ...each, value: { ...rest, ...link } };
  });
}

function evaluate(facts: TaxFactRow[]) {
  const result = evaluateScenario({
    filing: { id: "form-4797-niit-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const field = (id: string) =>
    result.forms.get(FORM)?.fields.find((each) => each.fieldId === `${FORM}.${id}`)?.result;
  const value = (id: string) => {
    const found = field(id);
    return found?.ok ? found.value : undefined;
  };
  const form = result.forms.get(FORM);
  return { files: form?.mustFile.ok && form.mustFile.value, field, value, result };
}

const highWage = [...base.facts, bigW2];

const duplex: RentalFactValue = {
  owner: "taxpayer",
  propertyType: "multi_family",
  address: { street: "22 Elm St", city: "Lubbock", state: "TX", zip: "79401" },
  fairRentalDays: 365,
  personalUseDays: 0,
  rentsReceived: 12000,
  allInvestmentAtRisk: true,
  materiallyParticipated: false,
  priorYearUnallowedLoss: 0,
  qualifiedBusiness: false,
};

describe("Form 8960 line 5b with Form 4797 sales", () => {
  it("over the threshold, the shop's whole Form 4797 amount comes out", () => {
    const run = evaluate(highWage);
    expect(run.files).toBe(true);
    // 1040 line 7a 81,460 (Schedule D: Form 4797 line 9 79,960 + box 2a 1,500) + Schedule 1 line 4 46,400.
    expect(run.value(LINE_5A)).toBe(127860);
    // Lines 2, 10 and 24: 13,800 − 2,500 − 9,000 + 900 + 82,860 + 18,800 + 7,500 + 14,000.
    expect(run.value(LINE_5B)).toBe(-126360);
    expect(run.value(LINE_5D)).toBe(1500);
    // Line 8: dividends 3,200 + line 4c 0 + line 5d 1,500 = 4,700; 3.8% = 178.60.
    expect(run.value(LINE_17)).toBe(179);
  });

  it("a sale of no business stays in NII", () => {
    const run = evaluate(relink(highWage, HAY_FIELD, { businessId: NO_BUSINESS }));
    expect(run.value(LINE_5B)).toBe(-126360 + 14000);
  });

  it("a passive rental's sale stays in NII", () => {
    const rental = fact("rental", makeRentalFactKey("duplex"), duplex);
    const professional = fact("rental", RENTAL_KEYS.realEstateProfessional, false);
    const facts = [...relink(highWage, LAPTOP, { rentalId: "duplex" }), rental, professional];
    expect(evaluate(facts).value(LINE_5B)).toBe(-126360 + 900);
  });

  it("waits while the rental's passive answer is missing", () => {
    const rental = fact("rental", makeRentalFactKey("duplex"), duplex);
    const run = evaluate([...relink(highWage, LAPTOP, { rentalId: "duplex" }), rental]);
    expect(pendingInputs(run.result).pendingFacts).toContain(RENTAL_KEYS.realEstateProfessional);
    expect(run.value(LINE_5B)).toBeUndefined();
  });

  it("a rental that is a nonpassive trade or business: its sale is a gap", () => {
    const rental = fact("rental", makeRentalFactKey("duplex"), {
      ...duplex,
      materiallyParticipated: true,
      tradeOrBusiness: true,
    });
    const professional = fact("rental", RENTAL_KEYS.realEstateProfessional, true);
    const facts = [...relink(highWage, LAPTOP, { rentalId: "duplex" }), rental, professional];
    expect(evaluate(facts).field(LINE_5B)).toMatchObject({ ok: false, unsupported: true });
  });

  it("a passive business's sales stay in NII", () => {
    const facts = highWage.map((each) =>
      each.category === "self_employment"
        ? { ...each, value: { ...(each.value as object), materiallyParticipated: false } }
        : each,
    );
    expect(evaluate(facts).value(LINE_5B)).toBeUndefined();
  });

  it("waits while a sale's business is not answered, and the form asks", () => {
    const run = evaluate(relink(highWage, LAPTOP, {}));
    expect(pendingInputs(run.result).pendingFacts).toContain(LAPTOP);
    expect(run.value(LINE_5B)).toBeUndefined();
    expect(run.value(LINE_5D)).toBeUndefined();
  });

  it("a capital loss carried in makes line 5b a gap (worksheet line 2(h))", () => {
    const carryover = fact("capital_gains", "capital_gains.long_term_loss_carryover", 2000);
    expect(evaluate([...highWage, carryover]).field(LINE_5B)).toMatchObject({
      ok: false,
      unsupported: true,
    });
  });

  it("berelain herself stays under the threshold: no Form 8960", () => {
    // MAGI upper bound: 12,000 + 3,200 + 1,500 + 49,152 + Form 4797's net 126,360 = 192,212.
    expect(evaluate(base.facts).files).toBe(false);
  });

  it("with no other investment income, a sale of no business is what files the form", () => {
    const noDividends = highWage.filter((each) => each.category !== "investment_income");
    expect(evaluate(noDividends).files).toBe(false);
    expect(evaluate(relink(noDividends, HAY_FIELD, { businessId: NO_BUSINESS })).files).toBe(true);
  });
});
