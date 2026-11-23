import { isSavingsBondCashedFactKey } from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import { savingsBondRecordSkill } from "../../../../src/mastra/skills/savingsBondRecord.js";
import {
  SavingsBondRecordSchema,
  issueDateOf,
  savingsBondFactsOf,
} from "../../../../src/mastra/tools/ingestSavingsBondRecord.js";

/* What Cade passes after reading odessa's docs/01-savings-bonds-cashed.pdf and asking the ownership test. */
const odessaRecord = SavingsBondRecordSchema.parse({
  year: 2025,
  bonds: [
    {
      serialNumber: "L000000123EE",
      series: "EE",
      format: "paper",
      issueDate: "03/2004",
      faceValue: 10000,
      proceeds: 10420,
      ownerQualifies: true,
    },
    {
      series: "EE",
      format: "electronic",
      issueDate: "09/2012",
      faceValue: 5000,
      proceeds: 6310,
      ownerQualifies: true,
    },
    {
      series: "I",
      format: "electronic",
      issueDate: "06/2015",
      faceValue: 8000,
      proceeds: 11280,
      ownerQualifies: true,
    },
    {
      serialNumber: "L000000045EE",
      series: "EE",
      format: "paper",
      issueDate: "05/1988",
      faceValue: 2000,
      proceeds: 4620,
      ownerQualifies: true,
    },
  ],
});

describe("savingsBondFactsOf", () => {
  it("records odessa's bonds with the keys and values the scenario holds", async () => {
    const { facts } = await loadScenario("odessa");
    const expected = facts
      .filter((fact) => isSavingsBondCashedFactKey(fact.key))
      .map((fact) => ({ category: fact.category, key: fact.key, value: fact.value }));
    expect(expected).toHaveLength(4);
    const written = savingsBondFactsOf(odessaRecord.bonds).map((fact) => ({
      category: "education",
      ...fact,
    }));
    expect(written).toEqual(expected);
  });

  it("gives two bonds of the same kind and year their own keys", () => {
    const [first] = odessaRecord.bonds;
    const keys = savingsBondFactsOf([first, first]).map((fact) => fact.key);
    expect(keys).toEqual([
      "education.savings_bond.paper-ee-2004",
      "education.savings_bond.paper-ee-2004-2",
    ]);
    expect(keys.every(isSavingsBondCashedFactKey)).toBe(true);
  });

  it("leaves a blank serial number out of the fact", () => {
    const [, electronic] = savingsBondFactsOf(odessaRecord.bonds);
    expect(Object.keys(electronic.value)).not.toContain("serialNumber");
    expect(Object.keys(electronic.value)).not.toContain("interestReportedInPriorYears");
  });
});

describe("issueDateOf", () => {
  it.each([
    ["03/2004", "2004-03-01"],
    ["3/2004", "2004-03-01"],
    ["03/01/2004", "2004-03-01"],
    ["2004-03", "2004-03-01"],
    ["2004-03-01", "2004-03-01"],
  ])("%s → %s", (printed, iso) => {
    expect(issueDateOf(printed)).toBe(iso);
  });
});

describe("savings-bond-record skill", () => {
  it("names its tool for load_tool", () => {
    expect(savingsBondRecordSkill.skill.instructions).toContain('"ingest-savings-bond-record"');
  });
});
