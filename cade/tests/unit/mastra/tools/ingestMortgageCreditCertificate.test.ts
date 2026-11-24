import {
  MORTGAGE_CREDIT_KEYS,
  type MortgageCreditCertificateFactValue,
} from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import {
  mortgageCreditCertificateFact,
  type MortgageCreditCertificateInput,
} from "../../../../src/mastra/tools/ingestMortgageCreditCertificate.js";

/* What Cade reads off the certificate, and the two amounts he gets elsewhere. */
const input = (mcc: MortgageCreditCertificateFactValue): MortgageCreditCertificateInput => ({
  year: 2025,
  certificate: {
    issuerName: mcc.issuerName,
    certificateNumber: mcc.certificateNumber,
    issueDate: mcc.issueDate,
    creditRatePercent: mcc.creditRatePercent,
    certifiedIndebtedness: mcc.certifiedIndebtedness,
  },
  interestPaid: mcc.interestPaid,
  originalLoanAmount: mcc.originalLoanAmount,
});

describe("mortgageCreditCertificateFact", () => {
  it("records linnea's certificate as the scenario holds it", async () => {
    const { facts } = await loadScenario("linnea");
    const expected = facts.find((fact) => fact.key === MORTGAGE_CREDIT_KEYS.certificate);
    expect(expected?.category).toBe("mortgage");
    const mcc = expected?.value as MortgageCreditCertificateFactValue;
    expect(mortgageCreditCertificateFact(input(mcc))).toEqual({
      key: MORTGAGE_CREDIT_KEYS.certificate,
      value: mcc,
    });
  });

  it("leaves an answer that was not given out of the fact", () => {
    const { value } = mortgageCreditCertificateFact({
      year: 2025,
      certificate: {
        issuerName: "Example Housing Agency",
        creditRatePercent: 20,
        certifiedIndebtedness: 150000,
      },
      interestPaid: 6000,
      originalLoanAmount: 150000,
    });
    expect(Object.keys(value).sort()).toEqual(
      [
        "certifiedIndebtedness",
        "creditRatePercent",
        "interestPaid",
        "issuerName",
        "originalLoanAmount",
      ].sort(),
    );
  });
});
