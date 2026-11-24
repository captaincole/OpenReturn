/*
 * Form 6198's arithmetic (src/federal/6198/lines.ts, figure.ts). The published
 * examples of the instructions are tests named by their block id; the rest are
 * limit tests that need no source.
 */

import { describe, expect, it } from "vitest";
import {
  dispositionEntries,
  figureForm6198,
  type AtRiskActivity,
} from "../../../../src/federal/6198/figure.js";
import {
  allocateLoss,
  amountAtRisk,
  amountAtRiskBelowZero,
  deductibleLoss,
  partIIILines,
  partIILines,
  partILines,
  type PartIEntry,
} from "../../../../src/federal/6198/lines.js";

const entry = (line: PartIEntry<string>["line"], amount: number, source: string) => ({
  line,
  amount,
  source,
});

/* An activity the way a caller builds one: its items, then lines 2a to 2c from the facts. */
const activity = (
  entries: PartIEntry<string>[],
  amounts: AtRiskActivity<string>["amounts"],
): AtRiskActivity<string> => ({
  factKey: "business.test",
  title: "Test activity",
  description: "Test activity",
  entries: [...entries, ...dispositionEntries<string>(amounts)],
  amounts,
  owner: "taxpayer",
});

describe("published examples", () => {
  it.each([
    ["(a) a $400 loss and $1,000 at risk", -400, 1000, -400],
    ["(b) a $1,600 loss and $1,200 at risk", -1600, 1200, -1200],
    ["(c) an $800 loss and nothing at risk", -800, 0, 0],
  ])(
    "irs-6198-inst-2025::sec::part-iv-deductible-loss::b01 example %s: line 21",
    (_, line5, line20, line21) => {
      expect(deductibleLoss(line5, line20)).toBe(line21);
    },
  );

  /*
   * irs-6198-inst-2025::sec::line-5::b02: a Schedule C loss of $4,600 on line 1
   * and a Schedule D gain of $3,100 on line 2a; Part II or III allows $600 of the
   * $1,500 excess loss; Schedule C takes $3,700 ($3,100 + $600).
   */
  it("irs-6198-inst-2025::sec::line-5::b02 example: a $3,700 Schedule C loss", () => {
    const entries = [entry("1", -4600, "schedule_c"), entry("2a", 3100, "schedule_d")];
    const partI = partILines(entries);
    expect(partI).toMatchObject({ line1: -4600, line2a: 3100, line5: -1500 });
    const line21 = deductibleLoss(partI.line5, 600);
    expect(line21).toBe(-600);
    const allocated = allocateLoss(entries, line21);
    expect(allocated).toEqual([
      { source: "schedule_c", line: "1", allowed: -3700, carried: -900 },
      { source: "schedule_d", line: "2a", allowed: 3100, carried: 0 },
    ]);
  });

  it("the same example through figureForm6198, with $600 at risk from Part II", () => {
    const outcome = figureForm6198(
      activity([entry("1", -4600, "schedule_c"), entry("2a", 3100, "schedule_d")], {
        simplified: { adjustedBasisAtStart: 600 },
      }),
    );
    expect(outcome.kind).toBe("figured");
    if (outcome.kind !== "figured") return;
    expect(outcome.figures.line20).toBe(600);
    expect(outcome.figures.line21).toBe(-600);
    expect(outcome.figures.entries[0]?.allowed).toBe(-3700);
  });

  /*
   * irs-6198-inst-2025::sec::part-i::b01 and ::part-i-2::b01: a $1,500 loss last
   * year limited to $500 leaves $1,000, which goes on this year's line 1 with
   * the current amount.
   */
  it("irs-6198-inst-2025::sec::part-i-2::b01 example: last year's $1,000 joins line 1", () => {
    const partI = partILines([entry("1", -1000, "carried"), entry("1", -2000, "box 1")]);
    expect(partI.line1).toBe(-3000);
    expect(partI.line5).toBe(-3000);
  });
});

describe("Part II, the simplified computation", () => {
  it("adds line 7 to line 6 and subtracts line 9", () => {
    expect(partIILines({ adjustedBasisAtStart: 12000, increases: 5000, decreases: 9000 })).toEqual({
      line6: 12000,
      line7: 5000,
      line8: 17000,
      line9: 9000,
      line10a: 8000,
      line10b: 8000,
    });
  });

  it("enters 0 on line 10b when line 10a is below zero, and never below zero on line 6", () => {
    const lines = partIILines({ adjustedBasisAtStart: 1000, decreases: 3000 });
    expect(lines.line10a).toBe(-2000);
    expect(lines.line10b).toBe(0);
    expect(partIILines({ adjustedBasisAtStart: -50 }).line6).toBe(0);
  });

  it("rounds each line to whole dollars", () => {
    expect(partIILines({ adjustedBasisAtStart: 1000.5, increases: 0.49 })).toMatchObject({
      line6: 1001,
      line7: 0,
      line8: 1001,
    });
  });
});

describe("Part III, the detailed computation", () => {
  it("starts from last year's line 19b, box b (irs-6198-inst-2025::sec::line-15::b01)", () => {
    const lines = partIIILines({
      start: "prior_year_form",
      priorYearAmountAtRisk: 4000,
      increasesSince: 30000,
      decreasesSince: 2000,
    });
    expect(lines).toEqual({
      line15Box: "b",
      line15: 4000,
      sinceBox: "b",
      line16: 30000,
      line17: 34000,
      line18: 2000,
      line19a: 32000,
      line19b: 32000,
    });
  });

  it("enters 0 on line 15 for an activity that began after its effective date", () => {
    const lines = partIIILines({ start: "began_after_effective_date", increasesSince: 100 });
    expect(lines).toMatchObject({ line15Box: "a", line15: 0, sinceBox: "a", line19b: 100 });
    expect(lines?.line11).toBeUndefined();
  });

  it("figures lines 11 to 15 at the effective date, line 15 never below zero", () => {
    const lines = partIIILines({
      start: "effective_date",
      investmentAtEffectiveDate: 5000,
      increasesAtEffectiveDate: 1000,
      decreasesAtEffectiveDate: 2500,
      increasesSince: 700,
      decreasesSince: 200,
    });
    expect(lines).toMatchObject({
      line11: 5000,
      line12: 1000,
      line13: 6000,
      line14: 2500,
      line15Box: "a",
      line15: 3500,
      line17: 4200,
      line19a: 4000,
    });
    const negative = partIIILines({
      start: "effective_date",
      investmentAtEffectiveDate: 100,
      decreasesAtEffectiveDate: 500,
    });
    expect(negative?.line15).toBe(0);
  });

  it("is undefined while the starting amount is missing", () => {
    expect(partIIILines({ start: "prior_year_form" })).toBeUndefined();
    expect(partIIILines({ start: "effective_date" })).toBeUndefined();
  });

  it("enters 0 on line 19b when line 19a is below zero", () => {
    const lines = partIIILines({ start: "began_after_effective_date", decreasesSince: 900 });
    expect(lines).toMatchObject({ line19a: -900, line19b: 0 });
  });
});

describe("Part IV and the limits", () => {
  it("line 20 is the larger of line 10b and line 19b, or the one completed", () => {
    const partII = partIILines({ adjustedBasisAtStart: 8000 });
    const partIII = partIIILines({ start: "began_after_effective_date", increasesSince: 10000 });
    expect(amountAtRisk(partII, partIII)).toBe(10000);
    expect(amountAtRisk(partII, undefined)).toBe(8000);
    expect(amountAtRisk(undefined, partIII)).toBe(10000);
    expect(amountAtRisk(undefined, undefined)).toBeUndefined();
  });

  it("line 21 is never more than the loss or the amount at risk, at the edge too", () => {
    expect(deductibleLoss(-1000, 1000)).toBe(-1000);
    expect(deductibleLoss(-1000, 999)).toBe(-999);
    expect(deductibleLoss(-999, 1000)).toBe(-999);
  });

  it("the allowed and carried parts of every item add up to the item", () => {
    const entries = [
      entry("1", -40000, "box 1"),
      entry("1", -6000, "carried"),
      entry("3", 2500, "box 10"),
      entry("4", -1333, "box 12"),
    ];
    const line5 = partILines(entries).line5;
    const allocated = allocateLoss(entries, deductibleLoss(line5, 17000));
    for (const [index, each] of allocated.entries()) {
      expect(each.allowed + each.carried).toBe(entries[index]!.amount);
    }
    const allowedLosses = allocated
      .filter((each) => each.allowed < 0)
      .reduce((total, each) => total - each.allowed, 0);
    expect(allowedLosses).toBe(2500 + 17000);
    expect(allocated[2]).toMatchObject({ allowed: 2500, carried: 0 });
  });

  it("allows every item in full with a profit on line 5", () => {
    const entries = [entry("1", 3000, "box 1"), entry("4", -500, "box 12")];
    expect(allocateLoss(entries, undefined).map((each) => each.carried)).toEqual([0, 0]);
  });

  it("knows an amount at risk below zero only when line 20 is 0", () => {
    const below = partIILines({ adjustedBasisAtStart: 100, decreases: 500 });
    const above = partIIILines({ start: "began_after_effective_date", increasesSince: 50 });
    expect(amountAtRiskBelowZero(below, undefined)).toBe(true);
    expect(amountAtRiskBelowZero(below, above)).toBe(false);
    expect(amountAtRiskBelowZero(partIILines({ adjustedBasisAtStart: 0 }), undefined)).toBe(false);
  });
});

describe("figureForm6198", () => {
  const loss = [entry("1", -5000, "box 1")];

  it("stops at Part I with a profit: no Part II to IV", () => {
    const outcome = figureForm6198(activity([entry("1", 5000, "box 1")], undefined));
    expect(outcome).toMatchObject({ kind: "figured", figures: { partI: { line5: 5000 } } });
    if (outcome.kind === "figured") expect(outcome.figures.line21).toBeUndefined();
  });

  it("waits on the amounts at risk with a loss, and on an incomplete Part III", () => {
    expect(figureForm6198(activity(loss, undefined))).toEqual({
      kind: "waiting",
      factKeys: ["business.test"],
    });
    const partIIIOnly = {
      simplified: { adjustedBasisAtStart: 900 },
      detailed: { start: "prior_year_form" as const },
    };
    expect(figureForm6198(activity(loss, partIIIOnly)).kind).toBe("waiting");
  });

  it("reports an amount at risk below zero: the recapture is not modeled", () => {
    const outcome = figureForm6198(
      activity(loss, { simplified: { adjustedBasisAtStart: 100, decreases: 400 } }),
    );
    expect(outcome.kind).toBe("unsupported");
  });

  it("reports a loss on line 2 that the limit would reduce", () => {
    const outcome = figureForm6198(
      activity([entry("1", -5000, "box 1")], {
        simplified: { adjustedBasisAtStart: 1000 },
        dispositions: { form4797: -800 },
      }),
    );
    expect(outcome.kind).toBe("unsupported");
  });

  it("reports a gain on lines 2a to 2c from the facts and counts it against the loss", () => {
    const outcome = figureForm6198(
      activity([entry("1", -5000, "box 1")], {
        simplified: { adjustedBasisAtStart: 1000 },
        dispositions: {
          scheduleD: 700,
          form4797: 300,
          otherForm: { form: "Form 4684", amount: 200 },
        },
      }),
    );
    expect(outcome.kind).toBe("figured");
    if (outcome.kind !== "figured") return;
    expect(outcome.figures.partI).toMatchObject({
      line2a: 700,
      line2b: 300,
      line2c: 200,
      line5: -3800,
    });
    expect(outcome.figures.line21).toBe(-1000);
    expect(outcome.figures.entries[0]).toMatchObject({ allowed: -2200, carried: -2800 });
  });
});
