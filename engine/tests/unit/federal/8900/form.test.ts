/*
 * Form 8900 on a whole return: who files, each line, the gaps, the basis of
 * the track asset and Form 3800 line 4g. The synthetic nieda scenario (a
 * Class III railroad with assignments both ways, a capitalized track asset
 * and a K-1 code AJ) is the base.
 */

import { describe, expect, it } from "vitest";
import {
  RAILROAD_TRACK_MAINTENANCE_KEY,
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makeSCorporationK1FactKey,
  type BusinessFactValue,
  type RailroadTrackMaintenanceFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  RAILROAD_KEY,
  TERMINAL_ID,
  TRACK_ASSET,
  railroad,
  terminalK1,
  trackMaintenance,
} from "../../../scenarios/synthetic/nieda/facts.js";
import { niedaScenario as nieda } from "../../../scenarios/synthetic/nieda/index.js";

const MUST_FILE = "decisions.scope.must_file_8900";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: nieda.userId,
    taxYear: nieda.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...nieda.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []) {
  const kept = nieda.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = nieda.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8900-test", taxYear: nieda.taxYear },
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
  const line = (id: string) => value("form-8900", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const L1 = "0.line.1_track_maintenance_expenditures";
const L2 = "0.line.2_forty_percent_of_line1";
const L3A = "0.line.3a_miles_owned_or_leased";
const L3B = "0.line.3b_miles_assigned_to_others";
const L3C = "0.line.3c_miles_assigned_to_you";
const L3D = "0.line.3d_total_miles";
const L4 = "0.line.4_miles_times_3500";
const L5 = "0.line.5_smaller_of_line2_or_line4";
const L6 = "0.line.6_credit_from_partnerships_s_corps";
const L7 = "0.line.7_total_credit";
const COL_E = "3.part3.4g_form_8900_col_e";
const BASIS = "0.line.19c_basis";
const REPAIRS = "0.line.21";

const track = (value: Partial<RailroadTrackMaintenanceFactValue>) => ({
  [RAILROAD_TRACK_MAINTENANCE_KEY]: { ...trackMaintenance, ...value },
});
const business = (value: Partial<BusinessFactValue>) => ({
  [RAILROAD_KEY]: { ...railroad, ...value },
});
const withAsset = (asset: Record<string, unknown>) =>
  business({
    depreciation: {
      ...railroad.depreciation,
      assets: [{ ...railroad.depreciation!.assets![0]!, ...asset }],
    },
  });

describe("the nieda return: assignments both ways, a capitalized asset and a K-1", () => {
  const out = evaluate(nieda.facts);

  it("fills lines 1 to 7", () => {
    expect(out.files("form-8900")).toBe(true);
    expect(out.line(L1)).toBe(412_500);
    expect(out.line(L2)).toBe(165_000);
    expect(out.line(L3A)).toBe(52.5);
    expect(out.line(L3B)).toBe(8);
    expect(out.line(L3C)).toBe(2.25);
    expect(out.line(L3D)).toBe(46.75);
    expect(out.line(L4)).toBe(163_625);
    expect(out.line(L5)).toBe(163_625);
    expect(out.line(L6)).toBe(2_450);
    expect(out.line(L7)).toBe(166_075);
    expect(out.missing("form-8900")).toEqual([]);
  });

  it("line 5 lowers the track's basis; the deducted repairs stay (adjustments-to-basis::b01)", () => {
    expect(out.value("form-4562", BASIS)).toBe(210_000 - 163_625);
    expect(out.value("schedule-c", REPAIRS)).toBe(262_500);
  });

  it("Form 3800 line 4g equals line 7, the K-1 and the railroad", () => {
    expect(out.value("form-3800", COL_E)).toBe(166_075);
    expect(out.value("form-3800", "3.part3.4g_form_8900_col_a")).toBe(2);
  });
});

describe("line 6 with two K-1s that show cents", () => {
  const SECOND_ID = "second-grain-terminal";
  const creditOnly = (amount: number) => [{ box: "13", code: "AJ", amount }];
  const out = evaluate(
    factsWith(
      { [makeSCorporationK1FactKey(TERMINAL_ID)]: { ...terminalK1, boxes: creditOnly(1_200.4) } },
      [
        row("k1", makeSCorporationK1FactKey(SECOND_ID), {
          ...terminalK1,
          entityName: "Second Grain Terminal, Inc.",
          entityEin: "00-0008901",
          boxes: creditOnly(800.4),
        }),
        row("k1", makeK1HoldingFactKey(SECOND_ID), {
          owner: "taxpayer",
          materiallyParticipated: true,
          allInvestmentAtRisk: true,
          stockBasisAtStart: 120_000,
          stockAcquiredAs: "purchased",
        }),
      ],
    ),
  );

  it("rounds each K-1, then adds: $1,200 + $800, not $2,001 (docs/rule-decisions.md A134)", () => {
    expect(out.line(L6)).toBe(2_000);
    expect(out.line(L7)).toBe(163_625 + 2_000);
    expect(out.value("form-3800", COL_E)).toBe(163_625 + 2_000);
  });
});

describe("no Form 8900 fact: nothing changes", () => {
  const out = evaluate(factsWith({ [RAILROAD_TRACK_MAINTENANCE_KEY]: undefined }));

  it("a K-1 credit alone files no Form 8900 and goes to line 4g (general-instructions::b01)", () => {
    expect(out.files("form-8900")).toBe(false);
    expect(out.value("form-3800", COL_E)).toBe(2_450);
  });

  it("the asset keeps its whole cost", () => {
    expect(out.value("form-4562", BASIS)).toBe(210_000);
  });

  it("the decision files it with only the K-1: lines 6 and 7", () => {
    const filed = evaluate(factsWith({ [RAILROAD_TRACK_MAINTENANCE_KEY]: undefined }), [
      ...nieda.decisions,
      decision(MUST_FILE, true),
    ]);
    expect(filed.files("form-8900")).toBe(true);
    expect(filed.line(L1)).toBeUndefined();
    expect(filed.line(L5)).toBeUndefined();
    expect(filed.line(L6)).toBe(2_450);
    expect(filed.line(L7)).toBe(2_450);
    expect(filed.value("form-3800", COL_E)).toBe(2_450);
  });
});

describe("who files", () => {
  it("an assignor files with no credit (general-instructions::b01)", () => {
    const out = evaluate(
      factsWith(track({ expenditures: 0, milesAssignedToOthers: 52.5, capitalized: undefined })),
    );
    expect(out.files("form-8900")).toBe(true);
    expect(out.line(L1)).toBe(0);
    expect(out.line(L3D)).toBe(2.25);
    expect(out.line(L5)).toBe(0);
    expect(out.line(L7)).toBe(2_450);
    expect(out.value("form-3800", COL_E)).toBe(2_450);
  });

  it("a malformed fact files the form and asks for it again", () => {
    const out = evaluate(factsWith({ [RAILROAD_TRACK_MAINTENANCE_KEY]: { businessKey: 5 } }));
    expect(out.files("form-8900")).toBe(true);
    expect(out.missing("form-8900")).toEqual([RAILROAD_TRACK_MAINTENANCE_KEY]);
  });

  it("a railroad's line 3a waits for its answer (line-3a::b01)", () => {
    const out = evaluate(
      factsWith(track({ milesOwnedOrLeased: undefined, milesAssignedToOthers: undefined })),
    );
    expect(out.missing("form-8900")).toEqual([RAILROAD_TRACK_MAINTENANCE_KEY]);
    expect(out.line(L1)).toBeUndefined();
    expect(out.line(L7)).toBeUndefined();
  });

  it("an assignee that is not a railroad fills line 3c only", () => {
    const out = evaluate(
      factsWith(
        track({
          classIIOrIIIRailroad: false,
          milesOwnedOrLeased: undefined,
          milesAssignedToOthers: undefined,
          milesAssignedToYou: 20,
        }),
      ),
    );
    expect(out.line(L3A)).toBeUndefined();
    expect(out.line(L3B)).toBeUndefined();
    expect(out.line(L3D)).toBe(20);
    expect(out.line(L4)).toBe(70_000);
    expect(out.line(L5)).toBe(70_000);
  });
});

describe("gaps", () => {
  const gapOn = (facts: TaxFactRow[], decisions?: AIDecisionRow[]) => {
    const out = evaluate(facts, decisions);
    return { line5: isGap(out.field("form-8900", L5)), col: isGap(out.field("form-3800", COL_E)) };
  };

  it("miles owned for a business that is not a railroad", () => {
    expect(gapOn(factsWith(track({ classIIOrIIIRailroad: false })))).toEqual({
      line5: true,
      col: true,
    });
  });

  it("more miles assigned than owned (line-3b::b01)", () => {
    expect(gapOn(factsWith(track({ milesAssignedToOthers: 60 })))).toEqual({
      line5: true,
      col: true,
    });
  });

  it("a business that is not on the return", () => {
    expect(gapOn(factsWith(track({ businessKey: "business.elsewhere" })))).toEqual({
      line5: true,
      col: true,
    });
  });

  it("the asset is missing, has section 179, or is not all business use", () => {
    expect(
      gapOn(factsWith(track({ capitalized: [{ amount: 210_000, asset: "Other" }] }))).line5,
    ).toBe(true);
    expect(gapOn(factsWith(withAsset({ section179Elected: 10_000 }))).line5).toBe(true);
    expect(gapOn(factsWith(withAsset({ businessUsePercent: 80 }))).line5).toBe(true);
  });

  it("two capitalized assets, an intangible, or more capitalized than spent", () => {
    const two = [
      { amount: 100_000, asset: TRACK_ASSET },
      { amount: 10_000, notPlacedInService: true },
    ];
    expect(gapOn(factsWith(track({ capitalized: two }))).line5).toBe(true);
    expect(
      gapOn(factsWith(track({ capitalized: [{ amount: 10_000, amortizedCost: "Assignment" }] })))
        .line5,
    ).toBe(true);
    expect(
      gapOn(factsWith(track({ capitalized: [{ amount: 500_000, asset: TRACK_ASSET }] }))).line5,
    ).toBe(true);
  });

  it("a business the owner does not materially participate in: line 4g only", () => {
    expect(gapOn(factsWith(business({ materiallyParticipated: false })))).toEqual({
      line5: false,
      col: true,
    });
  });

  it("the decision not to file while the basis is lowered", () => {
    const out = evaluate(nieda.facts, [...nieda.decisions, decision(MUST_FILE, false)]);
    expect(out.files("form-8900")).toBe(false);
    expect(isGap(out.field("form-3800", COL_E))).toBe(true);
  });

  it("the same credit also stated as a Form 3800 line 4g amount", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("form-8900"), {
      sourceForm: "8900",
      line: "4g",
      amount: 5_000,
      passive: false,
    });
    expect(gapOn(factsWith({}, [stated])).col).toBe(true);
  });
});

describe("the basis reduction", () => {
  it("is limited to the amount capitalized", () => {
    const out = evaluate(
      factsWith(track({ capitalized: [{ amount: 100_000, asset: TRACK_ASSET }] })),
    );
    expect(out.value("form-4562", BASIS)).toBe(110_000);
    expect(out.line(L5)).toBe(163_625);
  });

  it("is none for a structure not placed in service in 2025, or nothing capitalized", () => {
    const later = evaluate(
      factsWith(track({ capitalized: [{ amount: 100_000, notPlacedInService: true }] })),
    );
    expect(later.value("form-4562", BASIS)).toBe(210_000);
    expect(later.value("form-3800", COL_E)).toBe(166_075);
    const none = evaluate(factsWith(track({ capitalized: [] })));
    expect(none.value("form-4562", BASIS)).toBe(210_000);
  });

  it("is none with the decision not to file and nothing capitalized: no gap", () => {
    const out = evaluate(factsWith(track({ capitalized: undefined })), [
      ...nieda.decisions,
      decision(MUST_FILE, false),
    ]);
    expect(out.files("form-8900")).toBe(false);
    expect(out.value("form-4562", BASIS)).toBe(210_000);
    expect(out.value("form-3800", COL_E)).toBe(2_450);
  });

  it("a group member's share is line 5 and the reduction", () => {
    const out = evaluate(factsWith(track({ groupShareOfCredit: 50_000 })));
    expect(out.line(L4)).toBe(163_625);
    expect(out.line(L5)).toBe(50_000);
    expect(out.value("form-4562", BASIS)).toBe(160_000);
    expect(out.value("form-3800", COL_E)).toBe(52_450);
  });
});

describe("Form 3800 waits for line G", () => {
  it("asks whether the owner materially participated", () => {
    const out = evaluate(factsWith(business({ materiallyParticipated: undefined })));
    expect(out.missing("form-3800")).toContain(RAILROAD_KEY);
  });
});
