/* Source: irs-1040-inst-2025, lines 27a–27c: Step 1 (income limits), Step 3 and Worksheet B. */

import { describe, expect, it } from "vitest";
import {
  EIC_KEYS,
  SPOUSE_KEYS,
  makeBusinessFactKey,
  makeDependentFactKey,
  makeW2FactKey,
} from "../../../../src/facts/index.js";
import { resolveScheduleEICInfo } from "../../../../src/federal/schedule-eic/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const child = {
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
};

const resolve = (opts: {
  status: string;
  wages: number;
  answers?: Record<string, boolean>;
  businessExpenses?: number;
}) =>
  resolveScheduleEICInfo(
    makeResolverInputs({
      facts: [
        { key: "identity.dob", category: "identity", value: "05/01/1985" },
        { key: SPOUSE_KEYS.dob, category: "identity", value: "06/01/1986" },
        { key: makeW2FactKey("acme"), category: "wages", value: { box1: opts.wages } },
        { key: makeDependentFactKey("kid"), category: "dependents", value: child },
        ...(opts.businessExpenses === undefined
          ? []
          : [
              {
                key: makeBusinessFactKey("side"),
                category: "self_employment",
                value: {
                  activity: "Consulting",
                  grossReceipts: 5_000,
                  sellsGoods: false,
                  materiallyParticipated: true,
                  expenses: { supplies: opts.businessExpenses },
                },
              },
            ]),
        ...Object.entries(opts.answers ?? {}).map(([key, value]) => ({
          key,
          category: "other",
          value,
        })),
      ],
      decisions: [{ decisionKey: "decisions.scope.filing_status", decision: opts.status }],
    }),
  );

describe("resolveScheduleEICInfo", () => {
  it("does not ask a joint return whether the filer is someone's qualifying child", () => {
    const info = resolve({ status: "married_filing_jointly", wages: 30_000 });
    expect(info.missingInputs?.["schedule-eic"]).toEqual(
      expect.arrayContaining([EIC_KEYS.nonresidentAlien, EIC_KEYS.barredByIrs]),
    );
    expect(info.missingInputs?.["schedule-eic"]).not.toContain(EIC_KEYS.qualifyingChildOfAnother);
  });

  it("files on a joint return even with a qualifying-child-of-another answer of yes", () => {
    const info = resolve({
      status: "married_filing_jointly",
      wages: 30_000,
      answers: { [EIC_KEYS.qualifyingChildOfAnother]: true },
    });
    expect(info.mustFile?.["schedule-eic"]?.value).toBe(true);
  });

  it("asks a head of household, and a yes rules the EIC out", () => {
    expect(
      resolve({ status: "head_of_household", wages: 30_000 }).missingInputs?.["schedule-eic"],
    ).toContain(EIC_KEYS.qualifyingChildOfAnother);
    const info = resolve({
      status: "head_of_household",
      wages: 30_000,
      answers: { [EIC_KEYS.qualifyingChildOfAnother]: true },
    });
    expect(info.mustFile?.["schedule-eic"]?.value).toBe(false);
  });

  it("does not file when wages reach the limit and the business has a profit", () => {
    const info = resolve({ status: "head_of_household", wages: 400_000, businessExpenses: 0 });
    expect(info.mustFile?.["schedule-eic"]?.value).toBe(false);
    expect(info.missingInputs?.["schedule-eic"]).toEqual([]);
  });

  it("stays possible when a business loss could bring earned income under the limit", () => {
    const info = resolve({ status: "head_of_household", wages: 51_000, businessExpenses: 9_000 });
    expect(info.missingInputs?.["schedule-eic"]).toContain(EIC_KEYS.nonresidentAlien);
  });
});
