/* Source: irs-1040-inst-2025, lines 27a–27c: Step 1 (income limits) and Step 4 (filers without a qualifying child). */

import { describe, expect, it } from "vitest";
import { EIC_KEYS, makeBusinessFactKey, makeW2FactKey } from "../../../../src/facts/index.js";
import { resolve1040Info } from "../../../../src/federal/1040/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const NO_CHILD_KEYS = [
  EIC_KEYS.nonresidentAlien,
  EIC_KEYS.mainHomeInUs,
  EIC_KEYS.qualifyingChildOfAnother,
  EIC_KEYS.claimableAsDependent,
  EIC_KEYS.deniedInEarlierYear,
  EIC_KEYS.barredByIrs,
];

const missing = (opts: { wages?: number; dob: string; status?: string }) =>
  resolve1040Info(
    makeResolverInputs({
      facts: [
        { key: "identity.dob", category: "identity", value: opts.dob },
        ...(opts.wages === undefined
          ? []
          : [{ key: makeW2FactKey("acme"), category: "wages", value: { box1: opts.wages } }]),
      ],
      decisions: [
        { decisionKey: "decisions.scope.filing_status", decision: opts.status ?? "single" },
      ],
    }),
  ).missingInputs?.["form-1040"];

describe("resolve1040Info: the no-child EIC questions", () => {
  it("asks a single filer aged 25 to 64 with wages under the limit", () => {
    expect(missing({ wages: 9_000, dob: "05/01/1990" })).toEqual(
      expect.arrayContaining(NO_CHILD_KEYS),
    );
  });

  it("asks no one the EIC could not reach", () => {
    const asked = (opts: Parameters<typeof missing>[0]) =>
      (missing(opts) ?? []).filter((key) => key.startsWith("eic."));
    expect(asked({ wages: 400_000, dob: "05/01/1990" })).toEqual([]);
    expect(asked({ wages: 19_104, dob: "05/01/1990" })).toEqual([]);
    expect(asked({ dob: "05/01/1990" })).toEqual([]);
    expect(asked({ wages: 9_000, dob: "05/01/1955" })).toEqual([]);
    expect(asked({ wages: 9_000, dob: "05/01/1990", status: "married_filing_separately" })).toEqual(
      [],
    );
  });

  it("skips questions 5 and 6 on a joint return", () => {
    const keys = missing({ wages: 20_000, dob: "05/01/1990", status: "married_filing_jointly" });
    expect(keys).toContain(EIC_KEYS.mainHomeInUs);
    expect(keys).not.toContain(EIC_KEYS.claimableAsDependent);
  });
});

/* A single filer aged 35 with W-2 wages and a side business that sells no goods. */
const askedWithBusiness = (wages: number, expenses: number, materiallyParticipated = true) =>
  (
    resolve1040Info(
      makeResolverInputs({
        facts: [
          { key: "identity.dob", category: "identity", value: "05/01/1990" },
          { key: makeW2FactKey("acme"), category: "wages", value: { box1: wages } },
          {
            key: makeBusinessFactKey("side"),
            category: "self_employment",
            value: {
              activity: "Consulting",
              grossReceipts: 5_000,
              sellsGoods: false,
              materiallyParticipated,
              expenses: { supplies: expenses },
            },
          },
        ],
        decisions: [{ decisionKey: "decisions.scope.filing_status", decision: "single" }],
      }),
    ).missingInputs?.["form-1040"] ?? []
  ).filter((key) => key.startsWith("eic."));

describe("resolve1040Info: the EIC questions with a business (Worksheet B)", () => {
  it("asks no one whose wages reach the limit and whose business has a profit", () => {
    expect(askedWithBusiness(400_000, 0)).toEqual([]);
    expect(askedWithBusiness(19_104, 5_000)).toEqual([]);
  });

  it("asks while a business loss or an unknown line 31 could bring earned income under the limit", () => {
    expect(askedWithBusiness(20_000, 9_000)).toEqual(expect.arrayContaining(NO_CHILD_KEYS));
    expect(askedWithBusiness(20_000, 0, false)).toEqual(expect.arrayContaining(NO_CHILD_KEYS));
  });

  it("asks a filer whose wages are under the limit", () => {
    expect(askedWithBusiness(9_000, 0)).toEqual(expect.arrayContaining(NO_CHILD_KEYS));
  });
});
