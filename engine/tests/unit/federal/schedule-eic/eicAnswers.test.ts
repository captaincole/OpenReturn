/*
 * Source: irs-1040-inst-2025, lines 27a–27c: Step 1 (income limits), Step 3
 * questions 4 and 5 (no-continue-4::b01) and Step 4 (filers without a qualifying child).
 */

import { describe, expect, it } from "vitest";
import {
  EIC_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeDependentFactKey,
  makeW2FactKey,
} from "../../../../src/facts/index.js";
import { resolve1040Info } from "../../../../src/federal/1040/resolveInfo.js";
import { resolveEicLineInfo } from "../../../../src/federal/schedule-eic/eicAnswers.js";
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

  it("asks while a business loss could bring earned income under the limit", () => {
    expect(askedWithBusiness(20_000, 9_000)).toEqual(expect.arrayContaining(NO_CHILD_KEYS));
    // Line G "No": line 31 waits on the passive rules, but its loss is no more than line 29's.
    expect(askedWithBusiness(20_000, 9_000, false)).toEqual(expect.arrayContaining(NO_CHILD_KEYS));
  });

  it("counts a business with a profit as 0, whether or not its line 31 is known", () => {
    expect(askedWithBusiness(20_000, 0, false)).toEqual([]);
  });

  it("asks a filer whose wages are under the limit", () => {
    expect(askedWithBusiness(9_000, 0)).toEqual(expect.arrayContaining(NO_CHILD_KEYS));
  });
});

/* An MFS filer aged 40 with $20,000 of wages and one son. */
const mfsWithChild = (answers: Record<string, boolean>) =>
  makeResolverInputs({
    facts: [
      { key: "identity.dob", category: "identity", value: "05/01/1985" },
      { key: makeW2FactKey("acme"), category: "wages", value: { box1: 20_000 } },
      {
        key: makeDependentFactKey("kid"),
        category: "dependents",
        value: {
          firstName: "Kid",
          lastName: "Doe",
          ssn: "900-12-3456",
          relationship: "Son",
          dob: "02/28/2018",
          monthsLivedWithYou: 12,
          livedInUs: true,
          usCitizenOrResident: true,
          fullTimeStudent: false,
          permanentlyDisabled: false,
        },
      },
      ...Object.entries(answers).map(([key, value]) => ({ key, category: "filing_status", value })),
    ],
    decisions: [
      { decisionKey: "decisions.scope.filing_status", decision: "married_filing_separately" },
    ],
  });

const separationAsked = (answers: Record<string, boolean>) =>
  (resolve1040Info(mfsWithChild(answers)).missingInputs?.["form-1040"] ?? []).filter(
    (key) =>
      key === SPOUSE_KEYS.livedApartLastSixMonths ||
      key === SPOUSE_KEYS.legallySeparatedApartAtYearEnd,
  );

describe("the EIC's Step 3 questions 4 and 5 for MFS with a qualifying child", () => {
  it("asks the 1040 page 1 keys: the last 6 months, then legal separation", () => {
    expect(separationAsked({})).toEqual([SPOUSE_KEYS.livedApartLastSixMonths]);
    expect(separationAsked({ [SPOUSE_KEYS.livedApartLastSixMonths]: false })).toEqual([
      SPOUSE_KEYS.legallySeparatedApartAtYearEnd,
    ]);
    expect(separationAsked({ [SPOUSE_KEYS.livedApartLastSixMonths]: true })).toEqual([]);
  });

  it("reads living apart all year as living apart the last 6 months", () => {
    const info = resolveEicLineInfo(mfsWithChild({ [SPOUSE_KEYS.livedApartAllYear]: true }));
    expect(info.livedApartLastSixMonths).toBe(true);
    expect(separationAsked({ [SPOUSE_KEYS.livedApartAllYear]: true })).toEqual([]);
  });

  it("carries the legal separation answer", () => {
    const info = resolveEicLineInfo(
      mfsWithChild({
        [SPOUSE_KEYS.livedApartLastSixMonths]: false,
        [SPOUSE_KEYS.legallySeparatedApartAtYearEnd]: true,
      }),
    );
    expect(info).toMatchObject({
      livedApartLastSixMonths: false,
      legallySeparatedApartAtYearEnd: true,
    });
  });
});
