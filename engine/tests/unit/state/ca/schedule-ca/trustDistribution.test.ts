/*
 * Schedule CA line 8z column C with a trust amount (FTB 5870A Part II line 2,
 * ca-5870a-inst-2025::sec::section-a::b01) next to a child's adjustment (FTB
 * 3803 against Form 8814). Column C holds "the total of all individual items"
 * (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b05), so the trust
 * amount stays when the child's part of the column is blank.
 */

import { describe, expect, it } from "vitest";
import type { ChildIncomeLine8z } from "../../../../../src/state/ca/3803/filingInfo.js";
import { trustDistributionBindings } from "../../../../../src/state/ca/schedule-ca/trustDistribution.js";

type Binding = NonNullable<(typeof trustDistributionBindings)["1.line.b8z_additions"]>;
type Form = Parameters<Binding>[0];
type Info = Parameters<Binding>[1];

const TRUST = { amount: 50000 };

/* Column C of line 8z for a Schedule 1 line 8z of $2,000 (the Form 8814 line 12 total). */
function columnC(childIncomeLine8z: ChildIncomeLine8z | undefined, federal?: number) {
  const form = { "1.line.b8z_federal": federal } as unknown as Form;
  const info = { childIncomeLine8z, form5870AScheduleCaAddition: TRUST } as unknown as Info;
  return trustDistributionBindings["1.line.b8z_additions"]!(form, info);
}

const child = (change: Partial<Extract<ChildIncomeLine8z, { kind: "figured" }>>) =>
  ({
    kind: "figured",
    childCapitalGainDistributions: false,
    federalLine12: 2000,
    ...change,
  }) as const;

describe("Schedule CA line 8z column C: a trust amount and a child's adjustment", () => {
  it("the same child's amount on both returns: column C is the trust amount", () => {
    expect(columnC(child({}), 2000)).toBe(50000);
  });

  it("a child's subtraction only: column C is the trust amount", () => {
    expect(columnC(child({ subtraction: 400 }), 2000)).toBe(50000);
  });

  it("a child's addition: column C adds both", () => {
    expect(columnC(child({ addition: 300 }), 2000)).toBe(50300);
  });

  it("the child's adjustment waits: column C waits too", () => {
    expect(columnC({ kind: "waits" }, 2000)).toBeUndefined();
  });

  it("no child and no other line 8z item: the trust amount alone", () => {
    expect(columnC(undefined)).toBe(50000);
  });
});
