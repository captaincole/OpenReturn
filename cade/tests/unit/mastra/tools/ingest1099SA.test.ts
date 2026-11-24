import {
  makeHsaDistributionFactKey,
  type HsaDistributionFactValue,
} from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import {
  distributionIdOf,
  form1099SAFact,
  type Form1099SAInput,
} from "../../../../src/mastra/tools/ingest1099SA.js";

/* What Cade reads off the printed form, with the slug and the id he picks. */
const printed = (
  form: HsaDistributionFactValue,
  accountSlug: string,
  distributionId: string,
): Form1099SAInput => ({
  year: 2025,
  payer: { name: form.payerName, tin: form.payerTin },
  owner: form.owner,
  accountSlug,
  distributionId,
  box1: form.box1,
  box2: form.box2,
  box3: form.box3,
  box4: form.box4,
  box5: form.box5,
});

const THADDEUS_FORMS: [string, string][] = [
  ["cascade-health", "sa1"],
  ["sound-savings", "sa1"],
  ["evergreen-ma", "sa1"],
  ["evergreen-ma", "sa2"],
];

describe("form1099SAFact", () => {
  it.each(THADDEUS_FORMS)(
    "records thaddeus's %s %s form as the scenario holds it",
    async (...row) => {
      const [accountSlug, distributionId] = row;
      const key = makeHsaDistributionFactKey(accountSlug, distributionId);
      const { facts } = await loadScenario("thaddeus");
      const expected = facts.find((fact) => fact.key === key);
      expect(expected?.category).toBe("hsa");
      const form = expected?.value as HsaDistributionFactValue;
      expect(form1099SAFact(printed(form, accountSlug, distributionId))).toEqual({
        key,
        value: form,
      });
    },
  );

  it("keeps the key of a plain HSA form: the payer's slug and the code", () => {
    const { key, value } = form1099SAFact({
      year: 2025,
      payer: { name: "Example HSA Custodian", tin: "00-0000006" },
      box1: 144.9,
      box3: "1",
      box5: "HSA",
    });
    expect(key).toBe("account.example-hsa-custodian.hsa_distributions.code-1");
    expect(value).toEqual({
      payerName: "Example HSA Custodian",
      payerTin: "00-0000006",
      box1: 144.9,
      box3: "1",
      box5: "HSA",
    });
    expect(Object.keys(value)).not.toContain("owner");
  });
});

describe("distributionIdOf", () => {
  it("gives each spouse's account and each account type its own id", () => {
    expect(distributionIdOf({ box3: "1", box5: "HSA" })).toBe("code-1");
    expect(distributionIdOf({ box3: "1", box5: "Archer MSA", owner: "taxpayer" })).toBe(
      "archer-msa-code-1",
    );
    expect(distributionIdOf({ box3: "1", box5: "Archer MSA", owner: "spouse" })).toBe(
      "spouse-archer-msa-code-1",
    );
    expect(distributionIdOf({ box3: "3", box5: "MA MSA", owner: "spouse" })).toBe(
      "spouse-ma-msa-code-3",
    );
  });
});
