/*
 * Form 7213 on a whole return: who files, the copies, each gap, and Form 3800
 * Part III lines 1cc and 1u. The synthetic dain scenario is the base; byar
 * (no nuclear facts) shows that nothing changes without them.
 */

import { describe, expect, it } from "vitest";
import {
  makeGeneralBusinessCreditFactKey,
  makeNuclearFacilityFactKey,
  type NuclearFacilityFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { resolve3800Info } from "../../../../src/federal/3800/resolveInfo.js";
import { form7213Bindings } from "../../../../src/federal/7213/bindings.js";
import catalogJson from "../../../../src/federal/7213/catalog.json";
import { PART_I_TOTAL, PART_II_TOTAL } from "../../../../src/federal/7213/copies.js";
import { nuclearProductionSources } from "../../../../src/federal/7213/form3800.js";
import {
  ADVANCED_NUCLEAR_DETAIL,
  PART_I_PASS_THROUGH_NAME,
  PASS_THROUGH_COPY,
} from "../../../../src/federal/7213/passThrough.js";
import { resolve7213Info } from "../../../../src/federal/7213/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { byarScenario } from "../../../scenarios/synthetic/byar/index.js";
import {
  ADVANCED_KEY,
  advancedReactor,
  olderStation,
  STATION_KEY,
} from "../../../scenarios/synthetic/dain/facts.js";
import { dainScenario as base } from "../../../scenarios/synthetic/dain/index.js";

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

const isGap = (value: unknown) =>
  (value as { unsupported?: boolean } | undefined)?.unsupported === true;

/* The dain facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const inputsOf = (facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) =>
  makeResolverInputs({ facts, decisions });

const copiesOf = (facts: TaxFactRow[], decisions?: AIDecisionRow[]) =>
  resolve7213Info(inputsOf(facts, decisions)).form7213Copies ?? [];

const station = (
  credit: Partial<NuclearFacilityFactValue["credit"]>,
): NuclearFacilityFactValue => ({
  ...olderStation,
  credit: { ...olderStation.credit, ...credit } as NuclearFacilityFactValue["credit"],
});

const reactor = (
  credit: Partial<NuclearFacilityFactValue["credit"]>,
): NuclearFacilityFactValue => ({
  ...advancedReactor,
  credit: { ...advancedReactor.credit, ...credit } as NuclearFacilityFactValue["credit"],
});

const withoutFacilities = () => factsWith({ [ADVANCED_KEY]: undefined, [STATION_KEY]: undefined });

describe("Form 7213: who files (who-must-file::b01)", () => {
  it("files with a facility, one copy each and the pass-through copy last", () => {
    const info = resolve7213Info(inputsOf(base.facts));
    expect(info.mustFile?.["form-7213"]?.value).toBe(true);
    expect(info.form7213Copies?.map((copy) => copy.key)).toEqual([
      ADVANCED_KEY,
      STATION_KEY,
      PASS_THROUGH_COPY,
    ]);
    expect(info.missingInputs?.["form-7213"]).toEqual([]);
  });

  it("a K-1 credit alone files no Form 7213, and Form 3800 still takes it", () => {
    const facts = withoutFacilities();
    expect(resolve7213Info(inputsOf(facts)).mustFile?.["form-7213"]?.value).toBe(false);
    const lines = (resolve3800Info(inputsOf(facts)).form3800Sources?.current ?? []).map(
      (source) => [source.credit.line, source.credit.amount],
    );
    expect(lines).toEqual(
      expect.arrayContaining([
        ["1u", 2000],
        ["1cc", 3000],
      ]),
    );
    expect(nuclearProductionSources(inputsOf(facts))).toEqual({ sources: [], missing: [] });
  });

  it("the decision files it with only a K-1: the pass-through copy with both parts", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_7213", true)];
    const copies = copiesOf(withoutFacilities(), decisions);
    expect(copies.map((copy) => copy.key)).toEqual([PASS_THROUGH_COPY]);
    expect(copies[0]!.cells[PART_I_TOTAL]).toBe(3000);
    expect(copies[0]!.cells[PART_II_TOTAL]).toBe(2000);
  });

  it("the decision false takes the form off, and its facilities claim nothing on Form 3800", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_7213", false)];
    expect(copiesOf(base.facts, decisions)).toEqual([]);
    expect(nuclearProductionSources(inputsOf(base.facts, decisions)).sources).toEqual([]);
  });

  it("no nuclear facts: the form does not file and Form 3800's sources do not change", () => {
    const inputs = makeResolverInputs(byarScenario);
    expect(resolve7213Info(inputs).mustFile?.["form-7213"]?.value).toBe(false);
    expect(nuclearProductionSources(inputs)).toEqual({ sources: [], missing: [] });
    const lines = (resolve3800Info(inputs).form3800Sources?.current ?? []).map(
      (source) => source.credit.line,
    );
    expect(lines).toEqual(["4b", "4b"]);
  });
});

describe("Form 7213: the pass-through copy (line-10::b01, line-12::b01)", () => {
  it("prints a part's K-1 credits only next to a facility of that part", () => {
    const onlyReactor = factsWith({ [STATION_KEY]: undefined });
    const copies = copiesOf(onlyReactor);
    const passThrough = copies.find((copy) => copy.key === PASS_THROUGH_COPY)!;
    expect(passThrough.cells["0.part1_sec1.1a_facility_name_line1"]).toBe(PART_I_PASS_THROUGH_NAME);
    expect(passThrough.cells["0.part1_sec2.8_credit_from_pass_through_entities"]).toBe(3000);
    // The zero-emission K-1 credit goes straight to Form 3800 line 1u (line-12::b01).
    expect(passThrough.cells["1.part2_sec2.12_credit_from_pass_through"]).toBeUndefined();
  });

  it("no pass-through copy when the part with a facility has no K-1 credit", () => {
    const k1Key = base.facts.find((fact) => fact.key.startsWith("k1.partnership."))!;
    const onlyCodeA = {
      ...(k1Key.value as object),
      boxes: [{ box: "15", code: "A", amount: 2000 }],
    };
    const facts = factsWith({ [STATION_KEY]: undefined, [k1Key.key]: onlyCodeA });
    expect(copiesOf(facts).map((copy) => copy.key)).toEqual([ADVANCED_KEY]);
  });

  it("a K-1 that prints STMT is a gap on line 8 and line 9", () => {
    const k1Key = base.facts.find((fact) => fact.key.startsWith("k1.partnership."))!;
    const statement = { ...(k1Key.value as object), boxes: [{ box: "15", code: "B" }] };
    const passThrough = copiesOf(factsWith({ [k1Key.key]: statement })).find(
      (copy) => copy.key === PASS_THROUGH_COPY,
    )!;
    expect(isGap(passThrough.cells["0.part1_sec2.8_credit_from_pass_through_entities"])).toBe(true);
    expect(isGap(passThrough.cells[PART_I_TOTAL])).toBe(true);
    expect(ADVANCED_NUCLEAR_DETAIL).toBe("advanced_nuclear");
  });
});

describe("Form 7213: gaps and answers that wait", () => {
  it("a ZEC payment with no answer for line 6 waits: blank from line 6, the fact listed again", () => {
    const facts = factsWith({
      [STATION_KEY]: station({ zecPaymentsReducedByFullCredit: undefined }),
    });
    const info = resolve7213Info(inputsOf(facts));
    expect(info.missingInputs?.["form-7213"]).toEqual([STATION_KEY]);
    const copy = info.form7213Copies!.find((each) => each.key === STATION_KEY)!;
    expect(copy.cells["1.part2_sec2.5_zec_program_payments"]).toBe(30000);
    expect(copy.cells["1.part2_sec2.6_gross_receipts_after_zec"]).toBeUndefined();
    expect(copy.cells[PART_II_TOTAL]).toBeUndefined();
    expect(nuclearProductionSources(inputsOf(facts)).missing).toEqual([STATION_KEY]);
    expect(resolve3800Info(inputsOf(facts)).missingInputs?.["form-3800"]).toContain(STATION_KEY);
  });

  it("no ZEC payment: line 5 is blank and nothing waits", () => {
    const facts = factsWith({
      [STATION_KEY]: station({ zecPayments: undefined, zecPaymentsReducedByFullCredit: undefined }),
    });
    const copy = copiesOf(facts).find((each) => each.key === STATION_KEY)!;
    expect(copy.waiting).toBe(false);
    expect(copy.cells["1.part2_sec2.5_zec_program_payments"]).toBeUndefined();
    expect(copy.cells["1.part2_sec2.6_gross_receipts_after_zec"]).toBe(210000);
  });

  it("an eligible project partner: Section 2 is a gap, and so is Form 3800 line 1cc", () => {
    const facts = factsWith({ [ADVANCED_KEY]: reactor({ role: "eligible_project_partner" }) });
    const copy = copiesOf(facts).find((each) => each.key === ADVANCED_KEY)!;
    expect(copy.cells["0.part1_sec1.8_eligible_project_partner"]).toBe(true);
    expect(copy.cells["0.part1_sec1.8_owner_of_facility"]).toBeUndefined();
    expect(isGap(copy.cells["0.part1_sec2.7_smaller_of_5b_or_6b"])).toBe(true);
    const source = nuclearProductionSources(inputsOf(facts)).sources.find(
      (each) => each.credit.key === ADVANCED_KEY,
    )!;
    expect(isGap(source.credit.amount)).toBe(true);
  });

  it("a Part II facility placed in service on or after August 16, 2022 is a gap", () => {
    const facts = factsWith({ [STATION_KEY]: station({ placedInService: "2022-08-16" }) });
    const copy = copiesOf(facts).find((each) => each.key === STATION_KEY)!;
    expect(isGap(copy.cells["1.part2_sec2.3_line1_times_rate"])).toBe(true);
    expect(isGap(copy.cells[PART_II_TOTAL])).toBe(true);
    const dayBefore = factsWith({ [STATION_KEY]: station({ placedInService: "2022-08-15" }) });
    const kept = copiesOf(dayBefore).find((each) => each.key === STATION_KEY)!;
    expect(kept.cells[PART_II_TOTAL]).toBe(46800);
  });

  it("an elective payment election is a gap on line 13: an individual is not an applicable entity", () => {
    const electivePayment = { amount: 46800, registrationNumber: "N2505721300002" };
    const facts = factsWith({
      [STATION_KEY]: station({ transfer: undefined, electivePayment }),
    });
    const copy = copiesOf(facts).find((each) => each.key === STATION_KEY)!;
    expect(copy.cells["1.part2_sec1.1_irs_registration_number"]).toBe("N2505721300002");
    expect(copy.cells["1.part2_sec2.11_increased_credit_amount"]).toBe(46800);
    expect(isGap(copy.cells[PART_II_TOTAL])).toBe(true);
  });

  it("a stated line 1cc credit with no pass-through entity next to a facility is a gap", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("reactor"), {
      line: "1cc",
      sourceForm: "7213 Part I",
      amount: 50000,
      passive: false,
    });
    const sources = nuclearProductionSources(inputsOf(factsWith({}, [stated]))).sources;
    expect(isGap(sources.find((each) => each.credit.line === "1cc")!.credit.amount)).toBe(true);
    expect(sources.find((each) => each.credit.line === "1u")!.credit.amount).toBe(46800);
  });
});

describe("Form 7213 → Form 3800 Part III", () => {
  it("each facility is one source: Part I line 9 on 1cc, Part II line 13 on 1u with its transfer", () => {
    const { sources, missing } = nuclearProductionSources(inputsOf(base.facts));
    expect(missing).toEqual([]);
    expect(sources.map((each) => [each.credit.line, each.credit.key, each.credit.amount])).toEqual([
      ["1cc", ADVANCED_KEY, 50000],
      ["1u", STATION_KEY, 46800],
    ]);
    expect(sources[1]!.credit.transfer).toEqual({
      direction: "sold",
      amount: 10000,
      registrationNumber: "N2505721300001",
    });
  });

  it("a passive facility's source is passive, with its activity for Form 8582-CR", () => {
    const activity = { name: "Brazos Bend share", rentalRealEstate: false };
    const facts = factsWith({
      [ADVANCED_KEY]: { ...advancedReactor, passive: true, passiveActivity: activity },
    });
    const source = nuclearProductionSources(inputsOf(facts)).sources[0]!;
    expect(source.credit.passive).toBe(true);
    expect(source.credit.activity).toEqual(activity);
  });
});

describe("Form 7213 bindings", () => {
  it("every field outside the header and the estate and trust lines prints on some copy", () => {
    const partner = makeNuclearFacilityFactKey("partner-share");
    const partnerShare = reactor({ role: "eligible_project_partner", section761aElection: true });
    const owner = { name: "Brazos Bend Public Power Agency", tin: "00-0007216" };
    const extra = row("other", partner, {
      ...partnerShare,
      facility: { ...partnerShare.facility, owner },
    });
    const copies = copiesOf(factsWith({}, [extra]));
    const keys = catalogJson.fields.map((field) => field.fieldId.slice("form-7213.".length));
    const estatesAndTrusts = ["10_", "11_", "14_", "15_"];
    const missing = keys.filter(
      (key) =>
        !key.includes(".header.") &&
        !estatesAndTrusts.some((line) => key.split(".")[2]!.startsWith(line)) &&
        copies.every((copy) => copy.cells[key] === undefined),
    );
    expect(missing).toEqual([]);
    expect(Object.keys(form7213Bindings()).sort()).toEqual([...keys].sort());
  });

  it("a facility's copy leaves the other part blank: one form for each facility", () => {
    const [reactorCopy, stationCopy] = copiesOf(base.facts);
    expect(Object.keys(reactorCopy!.cells).every((key) => key.startsWith("0."))).toBe(true);
    expect(Object.keys(stationCopy!.cells).every((key) => key.startsWith("1."))).toBe(true);
  });
});
