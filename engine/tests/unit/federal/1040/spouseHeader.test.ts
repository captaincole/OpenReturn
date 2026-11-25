/*
 * Source: 2025 Form 1040 instructions, Name and Address (a separate return
 * names the spouse below the filing status boxes) and Sign Your Return (the
 * spouse signs a joint return and enters an occupation); Form 540 instructions,
 * Date of Birth.
 */

import { describe, expect, it } from "vitest";
import { SPOUSE_KEYS } from "../../../../src/facts/index.js";
import type { Form1040FilingInfo } from "../../../../src/federal/1040/filingInfo.js";
import {
  headerMfsSpouseFullName,
  headerSpouseFirstNameMi,
  headerSpouseLastName,
  headerSpouseSsn,
} from "../../../../src/federal/1040/header.js";
import { signingSpouseOccupation } from "../../../../src/federal/1040/signing.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import type { Form540FilingInfo } from "../../../../src/state/ca/540/filingInfo.js";
import { headerSpouseDateOfBirth } from "../../../../src/state/ca/540/header.js";
import type { FilingStatus } from "../../../../src/values.js";

const SPOUSE_FACTS = [
  { key: SPOUSE_KEYS.firstName, value: "Moiraine" },
  { key: SPOUSE_KEYS.lastName, value: "Damodred" },
  { key: SPOUSE_KEYS.ssn, value: "400-00-1234" },
  { key: SPOUSE_KEYS.dob, value: "05/14/1980" },
  { key: SPOUSE_KEYS.occupation, value: "Advisor" },
];

const info = (status: FilingStatus, facts = SPOUSE_FACTS) =>
  resolveFilingInfo({
    facts: facts.map((fact) => ({ ...fact, category: "identity" })),
    decisions: [{ decisionKey: "decisions.scope.filing_status", decision: status }],
  });

const header = (filing: ReturnType<typeof info>) => {
  const form = filing as Form1040FilingInfo;
  return {
    first: headerSpouseFirstNameMi(undefined, form),
    last: headerSpouseLastName(undefined, form),
    occupation: signingSpouseOccupation(undefined, form),
    ssn: headerSpouseSsn(undefined, form),
    mfsName: headerMfsSpouseFullName(undefined, form),
    caDob: headerSpouseDateOfBirth(undefined as never, filing as Form540FilingInfo),
  };
};

describe("spouse name, occupation and date of birth", () => {
  it("a joint return prints the spouse's name, occupation and California DOB", () => {
    expect(header(info("married_filing_jointly"))).toEqual({
      first: "Moiraine",
      last: "Damodred",
      occupation: "Advisor",
      ssn: "400001234",
      mfsName: undefined,
      caDob: "05/14/1980",
    });
  });

  it("a single return leaves them blank", () => {
    const result = header(info("single"));
    expect([result.first, result.last, result.occupation, result.caDob]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("a separate return names the spouse below the filing status, not in the header", () => {
    expect(header(info("married_filing_separately"))).toEqual({
      first: undefined,
      last: undefined,
      occupation: undefined,
      ssn: "400001234",
      mfsName: "Moiraine Damodred",
      caDob: undefined,
    });
  });

  it("a joint return with no spouse name or occupation asks for them", () => {
    const missing = info("married_filing_jointly", [])?.missingInputs?.["form-1040"];
    expect(missing).toEqual(
      expect.arrayContaining([SPOUSE_KEYS.firstName, SPOUSE_KEYS.lastName, SPOUSE_KEYS.occupation]),
    );
  });

  it("a separate return does not ask for the spouse's occupation", () => {
    const missing = info("married_filing_separately", [])?.missingInputs?.["form-1040"];
    expect(missing).toEqual(expect.arrayContaining([SPOUSE_KEYS.firstName]));
    expect(missing).not.toContain(SPOUSE_KEYS.occupation);
  });
});
