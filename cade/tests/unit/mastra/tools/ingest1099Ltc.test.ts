import { makeLtcBenefitsFactKey, type LtcBenefitsFactValue } from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import {
  form1099LtcFact,
  type Form1099LtcInput,
} from "../../../../src/mastra/tools/ingest1099Ltc.js";

/* What Cade reads off the printed form, with the slug and the id he picks. */
const printed = (
  form: LtcBenefitsFactValue,
  payerSlug: string,
  formId: string,
): Form1099LtcInput => ({
  year: 2025,
  payer: { name: form.payerName, tin: form.payerTin },
  payerSlug,
  formId,
  owner: form.owner,
  insuredName: form.insuredName,
  insuredSsn: form.insuredSsn,
  box1: form.box1,
  box2: form.box2,
  box3: form.box3,
  box4: form.box4,
  box5: form.box5,
  box5DateCertified: form.box5DateCertified,
});

const THADDEUS_FORMS: [string, string][] = [
  ["mount-rainier", "ltc1"],
  ["olympic-life", "ltc1"],
];

describe("form1099LtcFact", () => {
  it.each(THADDEUS_FORMS)("records thaddeus's %s form as the scenario holds it", async (...row) => {
    const [payerSlug, formId] = row;
    const key = makeLtcBenefitsFactKey(payerSlug, formId);
    const { facts } = await loadScenario("thaddeus");
    const expected = facts.find((fact) => fact.key === key);
    expect(expected?.category).toBe("medical");
    const form = expected?.value as LtcBenefitsFactValue;
    expect(form1099LtcFact(printed(form, payerSlug, formId))).toEqual({ key, value: form });
  });

  it("keys the form by the payer and the insured by default, and drops an unchecked box 4", () => {
    const { key, value } = form1099LtcFact({
      year: 2025,
      payer: { name: "Example Life Co" },
      insuredName: "Ana Example",
      insuredSsn: "400-00-0001",
      box1: 1200,
      box3: "reimbursed",
      box4: false,
    });
    expect(key).toBe("account.example-life-co.ltc_benefits.ana-example");
    expect(Object.keys(value)).not.toContain("box4");
    expect(Object.keys(value)).not.toContain("payerTin");
  });
});
