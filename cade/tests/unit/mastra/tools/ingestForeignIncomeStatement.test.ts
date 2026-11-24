import {
  isForeignIncomeStatementKey,
  makeDividendFactKey,
  makeForeignIncomeStatementKey,
} from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import {
  foreignIncomeStatementFact,
  ingestForeignIncomeStatement,
} from "../../../../src/mastra/tools/ingestForeignIncomeStatement.js";

/* galad's docs/02-foreign-income-larchmont.pdf, as printed, with the slug of its 1099-DIV. */
const LARCHMONT_KEY = makeForeignIncomeStatementKey(makeDividendFactKey("larchmont-international"));

describe("foreignIncomeStatementFact", () => {
  it("records galad's Larchmont statement as the scenario holds it", async () => {
    const { facts } = await loadScenario("galad");
    const expected = facts.find((fact) => fact.key === LARCHMONT_KEY);
    expect(expected?.category).toBe("investment_income");
    const fact = foreignIncomeStatementFact({
      form: "1099-DIV",
      payerName: "Larchmont International Index Fund",
      accountSlug: "larchmont-international",
      grossIncome: 26880.25,
      qualifiedDividends: 21412.6,
    });
    expect(fact).toEqual({ key: LARCHMONT_KEY, value: expected?.value });
    expect(Object.keys(fact.value)).toEqual(Object.keys(expected?.value as object));
  });

  it("puts a 1099-INT's statement next to the interest fact", () => {
    const { key } = foreignIncomeStatementFact({
      form: "1099-INT",
      payerName: "Example Brokerage LLC",
      grossIncome: 4280,
    });
    expect(key).toBe("account.example-brokerage-llc.interest.foreign_income");
    expect(isForeignIncomeStatementKey(key)).toBe(true);
  });

  it("has the id its skill names", () => {
    expect(ingestForeignIncomeStatement.id).toBe("ingest-foreign-income-statement");
  });
});
