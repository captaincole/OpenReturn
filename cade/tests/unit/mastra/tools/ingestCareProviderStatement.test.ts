import { makeDependentCareProviderFactKey } from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import { careProviderFact } from "../../../../src/mastra/tools/ingestCareProviderStatement.js";

const FRESNO = { city: "Fresno", state: "CA" };

/* What Cade reads from ottilie's two statements, plus the answers the statements do not print. */
const PRESCHOOL_STATEMENT = {
  providerSlug: "sunflower-hill",
  name: "Sunflower Hill Preschool",
  address: { line1: "1580 Blossom Way", ...FRESNO, zip: "93705" },
  tin: "12-3456783",
  phone: "559-555-0147",
  amountPaid: 6500,
  householdEmployee: false,
  providerType: "organization" as const,
};

const SITTER_STATEMENT = {
  providerSlug: "lupe-arroyo",
  name: "Lupe Arroyo",
  address: { line1: "318 Fig Garden Ln", ...FRESNO, zip: "93704" },
  tin: "400-00-0377",
  phone: "559-555-0162",
  amountPaid: 3000,
  householdEmployee: false,
  providerType: "person" as const,
};

describe("careProviderFact", () => {
  it.each([
    ["the preschool", PRESCHOOL_STATEMENT],
    ["the babysitter", SITTER_STATEMENT],
  ])("records the fact ottilie's facts.ts holds for %s", async (_, statement) => {
    const scenario = await loadScenario("ottilie");
    const { factKey, value } = careProviderFact(statement);
    const expected = scenario.facts.find((fact) => fact.key === factKey);
    expect(expected?.category).toBe("dependents");
    expect(value).toEqual(expected?.value);
  });

  it("slugs the name when no slug is given", () => {
    const { providerSlug: _, ...unslugged } = PRESCHOOL_STATEMENT;
    expect(careProviderFact(unslugged).factKey).toBe(
      makeDependentCareProviderFactKey("sunflower-hill-preschool"),
    );
  });

  it("records a provider with no printed tax-exempt notice as not tax-exempt", () => {
    expect(careProviderFact(SITTER_STATEMENT).value.taxExempt).toBe(false);
    expect(careProviderFact({ ...SITTER_STATEMENT, taxExempt: true }).value.taxExempt).toBe(true);
  });
});
