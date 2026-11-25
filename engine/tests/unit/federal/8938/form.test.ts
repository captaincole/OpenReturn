/*
 * Form 8938 on a whole return: who files, the answers it waits for, the rows of
 * Parts V and VI, Part III and Part IV, and Schedule B line 7. The synthetic
 * amys scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  FOREIGN_ASSET_KEYS,
  makeDividendFactKey,
  makeForeignFinancialAssetFactKey,
  makeInterestFactKey,
  type ForeignFinancialAssetFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import {
  alpenroseFund,
  baselCurrent,
  fjordlineShares,
  polderNote,
} from "../../../scenarios/synthetic/amys/assets.js";
import { amysScenario as base } from "../../../scenarios/synthetic/amys/index.js";
import { faileScenario } from "../../../scenarios/synthetic/faile/index.js";

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

/* An engine gap: unsupported(reason), not a blank line. */
const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

/* The base decisions with each named decision replaced (undefined drops it). */
function decisionsWith(changes: Record<string, unknown>): AIDecisionRow[] {
  const kept = base.decisions.filter((each) => !(each.decisionKey in changes));
  const added = Object.entries(changes)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => decision(key, value));
  return [...kept, ...added];
}

function evaluate(facts: TaxFactRow[] = base.facts, decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8938-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  const line = (id: string) => value("form-8938", id);
  const missingOf = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  const missing = missingOf("form-8938");
  return { files, field, value, line, missing, missingOf };
}

const info = (facts: TaxFactRow[] = base.facts, decisions: AIDecisionRow[] = base.decisions) =>
  resolveFilingInfo({
    facts,
    decisions: decisions.map((each) => ({
      decisionKey: each.decisionKey,
      decision: each.decision,
    })),
  });

const ASSET = (slug: string) => makeForeignFinancialAssetFactKey(slug);

describe("who files Form 8938", () => {
  it("files for the amys couple: $383,666 at year end is over the $100,000 joint threshold", () => {
    const { files, missing } = evaluate();
    expect(files("form-8938")).toBe(true);
    expect(missing).toEqual([]);
  });

  it("does not file when they live abroad: under $400,000 at year end and $600,000 at any time", () => {
    const { files } = evaluate(factsWith({ [FOREIGN_ASSET_KEYS.livesAbroad]: true }));
    expect(files("form-8938")).toBe(false);
  });

  it("files and asks where they live when that answer decides it", () => {
    const { files, missing } = evaluate(factsWith({ [FOREIGN_ASSET_KEYS.livesAbroad]: undefined }));
    expect(files("form-8938")).toBe(true);
    expect(missing).toEqual([FOREIGN_ASSET_KEYS.livesAbroad]);
  });

  it("does not ask where they live when the domestic threshold is not met either way", () => {
    const small = {
      ...baselCurrent,
      maximumValue: 30000,
      yearEndValue: 30000,
      closedOrDisposed: undefined,
    };
    const facts = [
      ...base.facts.filter(
        (fact) => fact.category !== "foreign" || fact.key === FOREIGN_ASSET_KEYS.exceptedForms,
      ),
      row("foreign", ASSET("basel-current"), small),
    ];
    const { files, missing } = evaluate(facts);
    expect(files("form-8938")).toBe(false);
    expect(missing).toEqual([]);
  });

  it("asks for the highest total when only it can settle the any-time test", () => {
    const first = {
      ...baselCurrent,
      maximumValue: 40000,
      yearEndValue: 30000,
      foreignCurrency: undefined,
      closedOrDisposed: undefined,
    };
    const second = { ...polderNote, maximumValue: 40000, yearEndValue: 0 };
    const onlyThese = base.facts.filter((fact) => fact.category !== "foreign");
    const single = decisionsWith({ "decisions.scope.filing_status": "single" });
    const facts = [
      ...onlyThese,
      row("foreign", ASSET("basel-current"), first),
      row("foreign", ASSET("polder-note"), second),
      row("foreign", FOREIGN_ASSET_KEYS.livesAbroad, false),
    ];
    expect(evaluate(facts, single).missing).toEqual([FOREIGN_ASSET_KEYS.highestTotalValue]);
    const stated = [...facts, row("foreign", FOREIGN_ASSET_KEYS.highestTotalValue, 70000)];
    expect(evaluate(stated, single).files("form-8938")).toBe(false);
  });

  it("follows the explicit decision", () => {
    const decisions = decisionsWith({ "decisions.scope.must_file_8938": false });
    expect(evaluate(base.facts, decisions).files("form-8938")).toBe(false);
  });

  it("does not file when no income tax return is required (who-must-file::b01)", () => {
    const decisions = decisionsWith({ "decisions.scope.must_file_federal": false });
    expect(info(base.facts, decisions).mustFile?.["form-8938"]?.value).toBe(false);
  });

  it("does not file with no foreign asset, and Schedule B keeps its decision", () => {
    const result = evaluateScenario({
      filing: { id: "faile", taxYear: faileScenario.taxYear },
      facts: faileScenario.facts,
      decisions: faileScenario.decisions,
      authEmail: null,
    });
    expect(result.forms.get("form-8938")?.mustFile).toMatchObject({ ok: true, value: false });
    const scheduleB = result.forms.get("schedule-b");
    const field = (id: string) =>
      scheduleB?.fields.find((each) => each.fieldId === `schedule-b.${id}`);
    expect(field("0.line.7a_foreign_account_no")?.result).toMatchObject({ ok: true, value: true });
    expect(field("0.line.7a_fincen_114_required_yes")?.result.ok).toBe(false);
    expect(isGap(field("0.line.7a_fincen_114_required_yes")?.result)).toBe(false);
  });
});

describe("a separate return", () => {
  const separate = decisionsWith({ "decisions.scope.filing_status": "married_filing_separately" });

  it("leaves out the spouse's shares, and reports the joint account at its full value", () => {
    const figured = info(base.facts, separate).form8938;
    expect(figured?.partVI.map((each) => each.description)).toEqual([polderNote.description]);
    expect(figured?.partV[0]).toMatchObject({ maximumValue: 122209, jointWithSpouse: true });
    expect(figured?.otherAssets.totals.dividends).toBeUndefined();
  });

  it("does not ask whether the spouse is a specified individual when the half share already files", () => {
    expect(evaluate(base.facts, separate).missing).toEqual([]);
  });
});

describe("the lines", () => {
  it("summarizes Part V by type and Part VI once per asset", () => {
    const { line } = evaluate();
    expect(line("0.line.5_number_deposit_accounts")).toBe(2);
    expect(line("0.line.6_max_value_deposit_accounts")).toBe(122209 + 16919);
    expect(line("0.line.8_max_value_custodial_accounts")).toBe(82369);
    expect(line("0.line.11_max_value_foreign_assets")).toBe(222399 + 76500);
  });

  it("prints one page 2 for each account and asset, and counts the additional statements", () => {
    const figured = info().form8938;
    expect(figured?.copies).toBe(3);
    expect(figured?.partV[2]).toMatchObject({ closed: true, noTaxItem: true, deposit: true });
    expect(figured?.partVI[1]).toMatchObject({ acquired: "03/14/2025", range: "b" });
    expect(evaluate().line("0.header.number_of_additional_statements")).toBe(2);
  });

  it("takes one page 2 for each issuer of an asset, without counting the asset twice", () => {
    const issuer = polderNote.issuers![0]!;
    const note: ForeignFinancialAssetFactValue = {
      ...polderNote,
      issuers: [
        issuer,
        { ...issuer, name: "Second Issuer N.V." },
        { ...issuer, role: "counterparty" },
      ],
    };
    const facts = factsWith({ [ASSET("polder-note")]: note });
    const figured = info(facts).form8938;
    expect(figured?.copies).toBe(4);
    expect(figured?.partII?.line10).toBe(2);
    expect(evaluate(facts).line("0.header.number_of_additional_statements")).toBe(3);
  });

  /*
   * Each category's line rounds on its own, as the Schedule B rows do; the
   * Schedule B totals round once, so a sum of rounded lines can differ by $1
   * (dividends: 1,450.20 + 1,239.41 = 2,689.61, line 6 prints 2,690).
   */
  it("ties Part III to the income lines: Schedule B's rows and Form 1040 line 20", () => {
    const { line, value } = evaluate();
    const scheduleB = (id: string) => Number(value("schedule-b", id));
    expect(line("0.line.13a_accounts_interest_col_c")).toBe(scheduleB("0.line.1_amount_1"));
    expect(line("0.line.14a_other_assets_interest_col_c")).toBe(scheduleB("0.line.1_amount_2"));
    expect(line("0.line.13b_accounts_dividends_col_c")).toBe(scheduleB("0.line.5_amount_1"));
    expect(line("0.line.14b_other_assets_dividends_col_c")).toBe(scheduleB("0.line.5_amount_2"));
    const credits =
      Number(line("0.line.13g_accounts_credits_col_c")) +
      Number(line("0.line.14g_other_assets_credits_col_c"));
    // 138.53 + 189.23 = 327.76: the rounded lines (139 + 189) and line 20 (328) agree here.
    expect(credits).toBe(value("form-1040", "line.20"));
  });

  it("leaves the credits blank when no foreign tax credit is claimed", () => {
    const bologna = base.facts.find((fact) => fact.key === makeInterestFactKey("bologna-savings"))!;
    const fjordline = base.facts.find(
      (fact) => fact.key === makeDividendFactKey("fjordline-shares"),
    )!;
    const facts = factsWith({
      [bologna.key]: { ...(bologna.value as object), box6: undefined },
      [fjordline.key]: { ...(fjordline.value as object), box7: undefined },
    });
    const { line } = evaluate(facts);
    expect(line("0.line.13g_accounts_credits_col_c")).toBeUndefined();
    expect(line("0.line.13g_accounts_credits_col_d")).toBeUndefined();
  });

  it("waits for the Part IV counts when an asset is reported on another form", () => {
    const { missing, line } = evaluate(
      factsWith({ [FOREIGN_ASSET_KEYS.exceptedForms]: undefined }),
    );
    expect(missing).toEqual([FOREIGN_ASSET_KEYS.exceptedForms]);
    expect(line("0.line.18_number_forms_8621")).toBeUndefined();
  });

  it("makes a GIIN in the wrong shape a gap, not a blank", () => {
    const bologna = base.facts.find((fact) => fact.key === ASSET("bologna-savings"))!;
    const value = bologna.value as ForeignFinancialAssetFactValue;
    const facts = factsWith({
      [bologna.key]: { ...value, institution: { ...value.institution!, giin: "B4S7G200031SL380" } },
    });
    expect(isGap(evaluate(facts).field("form-8938", "1.line.26b_institution_giin_segment_1"))).toBe(
      true,
    );
  });
});

describe("Schedule B line 7 from the account facts", () => {
  it("answers both questions and lists the countries when one account is over $10,000", () => {
    const accountsOnly = base.facts.filter(
      (fact) => (fact.value as { part?: string } | null)?.part !== "other_asset",
    );
    // With no Part VI asset nothing waits for the financial account answer.
    const { value, missingOf } = evaluate(accountsOnly);
    expect(missingOf("schedule-b").filter((key) => key.startsWith("account."))).toEqual([]);
    expect(value("schedule-b", "0.line.7a_foreign_account_yes")).toBe(true);
    expect(value("schedule-b", "0.line.7a_fincen_114_required_yes")).toBe(true);
    expect(value("schedule-b", "0.line.7b_foreign_country_1")).toBe("Italy");
    expect(value("schedule-b", "0.line.7b_foreign_country_2")).toBe("United Kingdom, Switzerland");
  });

  it("lists the country of a Part VI asset answered as a financial account", () => {
    // The Luxembourg fund units are a "mutual fund or similar pooled fund" (Schedule B line 7a).
    const { value, missingOf } = evaluate();
    expect(value("schedule-b", "0.line.7a_fincen_114_required_yes")).toBe(true);
    expect(value("schedule-b", "0.line.7b_foreign_country_1")).toBe("Italy");
    expect(value("schedule-b", "0.line.7b_foreign_country_2")).toBe(
      "United Kingdom, Switzerland, Luxembourg",
    );
    expect(missingOf("schedule-b").filter((key) => key.startsWith("account."))).toEqual([]);
  });

  it("counts a Part VI financial account alone for the $10,000 test", () => {
    // Basel at CHF 7,000 ($8,838 at the Treasury's 0.792) does not settle question 2; the fund's $21,000 does.
    const facts = factsWith({
      [ASSET("basel-current")]: { ...baselCurrent, maximumValue: 7000 },
      [ASSET("bologna-savings")]: undefined,
      [ASSET("thames-brokerage")]: undefined,
    });
    const { value } = evaluate(facts);
    expect(value("schedule-b", "0.line.7a_foreign_account_yes")).toBe(true);
    expect(value("schedule-b", "0.line.7a_fincen_114_required_yes")).toBe(true);
    expect(value("schedule-b", "0.line.7b_foreign_country_1")).toBe("Switzerland");
    expect(value("schedule-b", "0.line.7b_foreign_country_2")).toBe("Luxembourg");
  });

  it("leaves out a Part VI asset answered as not a financial account", () => {
    const facts = factsWith({
      [ASSET("alpenrose-fund")]: { ...alpenroseFund, financialAccount: false },
    });
    const { value } = evaluate(facts);
    expect(value("schedule-b", "0.line.7b_foreign_country_1")).toBe("Italy");
    expect(value("schedule-b", "0.line.7b_foreign_country_2")).toBe("United Kingdom, Switzerland");
    // Alone, it does not count for the $10,000 test either.
    const small = factsWith({
      [ASSET("basel-current")]: { ...baselCurrent, maximumValue: 7000 },
      [ASSET("bologna-savings")]: undefined,
      [ASSET("thames-brokerage")]: undefined,
      [ASSET("alpenrose-fund")]: { ...alpenroseFund, financialAccount: false },
    });
    expect(isGap(evaluate(small).field("schedule-b", "0.line.7a_fincen_114_required_yes"))).toBe(
      true,
    );
  });

  it("waits for the answer and asks it when a Part VI asset does not say", () => {
    const facts = factsWith({
      [ASSET("alpenrose-fund")]: { ...alpenroseFund, financialAccount: undefined },
    });
    const { value, field, missingOf } = evaluate(facts);
    expect(value("schedule-b", "0.line.7a_fincen_114_required_yes")).toBe(true);
    for (const row of ["0.line.7b_foreign_country_1", "0.line.7b_foreign_country_2"]) {
      expect(field("schedule-b", row)?.ok).toBe(false);
      expect(isGap(field("schedule-b", row))).toBe(false);
    }
    expect(missingOf("schedule-b")).toContain(ASSET("alpenrose-fund"));
  });

  it("files Schedule B to ask when an unanswered Part VI asset is the only foreign asset", () => {
    const onlyShares = (answer: boolean | undefined) =>
      base.facts
        .filter(
          (fact) =>
            (fact.category !== "foreign" || fact.key === ASSET("fjordline-shares")) &&
            fact.category !== "investment_income",
        )
        .map((fact) =>
          fact.key === ASSET("fjordline-shares")
            ? { ...fact, value: { ...fjordlineShares, financialAccount: answer } }
            : fact,
        );
    const waiting = evaluate(onlyShares(undefined));
    expect(waiting.files("schedule-b")).toBe(true);
    expect(waiting.missingOf("schedule-b")).toContain(ASSET("fjordline-shares"));
    expect(evaluate(onlyShares(false)).files("schedule-b")).toBe(false);
  });

  it("leaves question 2 to a person when no account alone is over $10,000", () => {
    const onlyBasel = base.facts.filter(
      (fact) => fact.category !== "foreign" || fact.key === ASSET("basel-current"),
    );
    const small = { ...baselCurrent, maximumValue: 7000 };
    const { value, field } = evaluate(
      onlyBasel.map((fact) =>
        fact.key === ASSET("basel-current") ? { ...fact, value: small } : fact,
      ),
    );
    expect(value("schedule-b", "0.line.7a_foreign_account_yes")).toBe(true);
    expect(isGap(field("schedule-b", "0.line.7a_fincen_114_required_yes"))).toBe(true);
  });

  it("follows an explicit No: question 2 and line 7b stay blank", () => {
    const decisions = decisionsWith({ "decisions.scope.has_foreign_financial_account": false });
    const { value, field } = evaluate(base.facts, decisions);
    expect(value("schedule-b", "0.line.7a_foreign_account_no")).toBe(true);
    expect(isGap(field("schedule-b", "0.line.7a_fincen_114_required_yes"))).toBe(false);
    expect(value("schedule-b", "0.line.7b_foreign_country_1")).toBeUndefined();
  });
});

describe("an asset in a currency outside the H.10 release", () => {
  it("files the form with every line unsupported, and asks nothing", () => {
    const peso = { ...baselCurrent, foreignCurrency: { code: "ARS" } };
    const { files, field, missing } = evaluate(factsWith({ [ASSET("basel-current")]: peso }));
    expect(files("form-8938")).toBe(true);
    expect(missing).toEqual([]);
    for (const id of ["0.line.6_max_value_deposit_accounts", "1.line.23_account_maximum_value"]) {
      expect(isGap(field("form-8938", id)), id).toBe(true);
    }
  });
});
