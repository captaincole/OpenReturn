/*
 * Form 8834 on a whole return: who files, line 1 from Form 8582-CR, the tax
 * limit, the gaps, and Schedule 3 line 6i. The synthetic ronde scenario is
 * the base; pevara is a return with no qualified electric vehicle credit.
 */

import { describe, expect, it } from "vitest";
import {
  makeCreditCarryoverFactKey,
  makeDependentFactKey,
  makeElectricVehiclePassiveCreditFactKey,
  makeGeneralBusinessCreditFactKey,
  makePartnershipK1FactKey,
  type CreditCarryoverFactValue,
  type DependentFactValue,
  type GeneralBusinessCreditFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { pevaraScenario } from "../../../scenarios/synthetic/pevara/index.js";
import {
  DELIVERY_ID,
  DELIVERY_NAME,
  VAN_CREDIT,
  deliveryK1,
} from "../../../scenarios/synthetic/ronde/facts.js";
import { rondeScenario as base } from "../../../scenarios/synthetic/ronde/index.js";

const VANS = makeElectricVehiclePassiveCreditFactKey("harbor-electric-vans");
const K1 = makePartnershipK1FactKey(DELIVERY_ID);
const DELIVERY = { name: DELIVERY_NAME, rentalRealEstate: false };

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

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8834-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8834", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_1 = "0.line.1_passive_activity_credits_allowed";
const LINE_6 = "0.line.6_net_tax_less_minimum_tax";
const LINE_7 = "0.line.7_qualified_electric_vehicle_credit";
const LINE_37 = "1.line.37_passive_activity_credit_allowed";

const withBox1 = (amount: number) => ({ ...deliveryK1, boxes: [{ box: "1", amount }] });

const child = (index: number): DependentFactValue => ({
  firstName: `Kid${index}`,
  lastName: "Tallowmere",
  ssn: `400-00-88${50 + index}`,
  relationship: "Son",
  dob: "03/02/2016",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
});
const children = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    row("dependents", makeDependentFactKey(`kid-${index}`), child(index)),
  );

describe("Form 8834 who files", () => {
  it("a prior year unallowed credit files Form 8834, Form 8582-CR, Form 6251 and Schedule 3", () => {
    const run = evaluate(base.facts);
    for (const formId of ["form-8834", "form-8582-cr", "form-6251", "schedule-3"]) {
      expect(run.files(formId)).toBe(true);
    }
    expect(run.line(LINE_1)).toBe(2400);
    expect(run.line(LINE_7)).toBe(2400);
    expect(run.value("schedule-3", "0.line.6i")).toBe(2400);
    expect(run.files("form-3800")).toBe(false);
  });

  it("no qualified electric vehicle credit: nothing changes, and Schedule 3 line 6i keeps its old reason", () => {
    const run = evaluate(factsWith({ [VANS]: undefined }));
    expect(run.files("form-8834")).toBe(false);
    expect(run.files("form-8582-cr")).toBe(false);
    expect(run.files("form-6251")).toBe(false);
    expect(isGap(run.field("schedule-3", "0.line.6i"))).toBe(true);
    const other = evaluateScenario({
      filing: { id: "pevara-8834", taxYear: pevaraScenario.taxYear },
      facts: pevaraScenario.facts,
      decisions: pevaraScenario.decisions,
      authEmail: null,
    });
    const mustFile = other.forms.get("form-8834")?.mustFile;
    expect(mustFile?.ok && mustFile.value).toBe(false);
    const line6i = other.forms
      .get("schedule-3")
      ?.fields.find((each) => each.fieldId === "schedule-3.0.line.6i")?.result;
    expect(isGap(line6i)).toBe(true);
  });

  it("a carryover of 0 files nothing", () => {
    const run = evaluate(factsWith({ [VANS]: { ...VAN_CREDIT, amount: 0 } }));
    expect(run.files("form-8834")).toBe(false);
  });

  it("the explicit decision wins", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8834", false),
    ]);
    expect(run.files("form-8834")).toBe(false);
    expect(isGap(run.field("schedule-3", "0.line.6i"))).toBe(true);
  });

  it("no net passive income: Form 8582-CR allows nothing and the form leaves the return", () => {
    const run = evaluate(factsWith({ [K1]: withBox1(0) }));
    expect(run.value("form-8582-cr", LINE_37)).toBe(0);
    expect(run.files("form-8834")).toBe(false);
    expect(run.value("schedule-3", "0.line.6i")).toBeUndefined();
  });

  it("no credit allowed and a gap in the tax limit: line 7 is 0 and line 6i is blank, not a gap", () => {
    // "Enter the smaller of line 1 or line 6": a line 1 of 0 gives 0 whatever line 6 is.
    const run = evaluate(factsWith({ [K1]: withBox1(0) }), [
      ...base.decisions,
      decision("decisions.scope.must_file_6251", false),
    ]);
    expect(run.files("form-6251")).toBe(false);
    expect(run.files("form-8834")).toBe(false);
    expect(isGap(run.field("schedule-3", "0.line.6i"))).toBe(false);
    expect(run.value("schedule-3", "0.line.6i")).toBeUndefined();
  });
});

describe("Form 8834 line 1: what Form 8582-CR allows", () => {
  it("less net passive income: line 1 is the tax on it (8582-CR line 6, 22% of $5,000)", () => {
    const run = evaluate(factsWith({ [K1]: withBox1(5000) }));
    expect(run.value("form-8582-cr", "0.line.6_tax_net_passive_income")).toBe(1100);
    expect(run.value("form-8582-cr", LINE_37)).toBe(1100);
    expect(run.line(LINE_1)).toBe(1100);
    expect(run.line(LINE_7)).toBe(1100);
  });

  it("rental real estate with active participation goes on Worksheet 1 (line 1b)", () => {
    const rental = {
      ...VAN_CREDIT,
      activity: { ...DELIVERY, rentalRealEstate: true, activelyParticipated: true },
    };
    const run = evaluate(factsWith({ [VANS]: rental }));
    expect(run.value("form-8582-cr", "0.line.1b_rental_active_prior_unallowed")).toBe(2400);
    expect(run.value("form-8582-cr", "0.line.4b_other_passive_prior_unallowed")).toBeUndefined();
    expect(run.line(LINE_1)).toBe(2400);
  });

  it("rental real estate with no active participation answer: the fact is asked again", () => {
    const rental = { ...VAN_CREDIT, activity: { ...DELIVERY, rentalRealEstate: true } };
    const run = evaluate(factsWith({ [VANS]: rental }));
    expect(run.missing("form-8834")).toContain(VANS);
    expect(run.missing("form-8582-cr")).toContain(VANS);
    expect(run.line(LINE_1)).toBeUndefined();
  });

  it("shares the allowed credit with a passive Form 3800 carryover by Worksheets 8 and 9", () => {
    // Line 5 $3,400, line 6 $3,080: $320 unallowed, shared 1,000 : 2,400 as $94 and $226.
    const carryover: CreditCarryoverFactValue = {
      sourceForm: "5884",
      line: "4b",
      originYear: 2024,
      amount: 1000,
      passive: true,
      passiveActivity: DELIVERY,
    };
    const extra = row("other", makeCreditCarryoverFactKey("harbor-work-opportunity"), carryover);
    const run = evaluate(factsWith({}, [extra]));
    expect(run.value("form-8582-cr", "0.line.5_total_passive_credits")).toBe(3400);
    expect(run.value("form-8582-cr", LINE_37)).toBe(3080);
    expect(run.line(LINE_1)).toBe(2174);
    expect(run.files("form-3800")).toBe(true);
  });

  it("a passive current-year Form 3800 credit next to it is a gap on line 1 and line 6i", () => {
    const credit: GeneralBusinessCreditFactValue = {
      sourceForm: "5884",
      line: "4b",
      amount: 900,
      passive: true,
      passiveActivity: DELIVERY,
    };
    const extra = row("other", makeGeneralBusinessCreditFactKey("harbor-wotc"), credit);
    const run = evaluate(factsWith({}, [extra]));
    expect(isGap(run.field("form-8834", LINE_1))).toBe(true);
    expect(isGap(run.field("form-8834", LINE_7))).toBe(true);
    expect(isGap(run.field("schedule-3", "0.line.6i"))).toBe(true);
    expect(run.line("0.line.2_regular_tax_before_credits")).toBe(28673);
  });

  it("a credit held through a publicly traded partnership is a gap", () => {
    const ptp = { ...VAN_CREDIT, activity: { ...DELIVERY, publiclyTradedPartnership: true } };
    const run = evaluate(factsWith({ [VANS]: ptp }));
    expect(isGap(run.field("form-8834", LINE_1))).toBe(true);
  });

  it("Form 8582-CR turned off: line 1 is a gap, lines 2 to 6 still compute", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8582_cr", false),
    ]);
    expect(isGap(run.field("form-8834", LINE_1))).toBe(true);
    expect(run.line(LINE_6)).toBe(8028);
  });
});

describe("Form 8834 lines 2 to 7: the tax limit", () => {
  it("line 3b takes the child tax credit; with four children line 6 is below line 1", () => {
    // Line 3b $8,800; line 4 $28,673 − $88 − $8,800 = $19,785; line 6 $19,785 − $18,357 = $1,428.
    const run = evaluate(factsWith({}, children(3)));
    expect(run.line("0.line.3b_certain_allowable_credits")).toBe(8800);
    expect(run.line("0.line.4_net_regular_tax")).toBe(19785);
    expect(run.line(LINE_6)).toBe(1428);
    expect(run.line(LINE_7)).toBe(1428);
    expect(run.value("schedule-3", "0.line.6i")).toBe(1428);
  });

  it("line 5 is Form 6251 line 7 less the foreign tax credit (decision A58)", () => {
    const run = evaluate(base.facts);
    expect(run.value("form-6251", "0.line.7_tax_on_line_6")).toBe(18445);
    expect(run.line("0.line.5_tentative_minimum_tax")).toBe(18357);
  });

  it("Form 6251 turned off: line 5 is a gap", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_6251", false),
    ]);
    expect(isGap(run.field("form-8834", "0.line.5_tentative_minimum_tax"))).toBe(true);
    expect(isGap(run.field("form-8834", LINE_7))).toBe(true);
    expect(run.line("0.line.4_net_regular_tax")).toBe(26385);
  });
});
