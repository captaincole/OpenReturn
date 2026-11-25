/*
 * One Form 8824 for each exchange (DECISION 2026-11-25, printed.ts): copy n
 * prints the nth exchange in Parts I–III and the nth Part IV sale. Schedule D
 * and Form 4797 take the total of every exchange once. The golden run checks
 * copy 0 only; this file checks the later copies. Made-up second exchanges on
 * the synthetic dobraine and gaul returns.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { loadFromFixtures, type Catalog } from "../../../../src/catalog.js";
import { evaluateForm } from "../../../../src/engine.js";
import {
  isLikeKindExchangeFactKey,
  makeLikeKindExchangeFactKey,
  type LikeKindExchangeFactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { getFormSpec } from "../../../../src/registry.js";
import { makeDecisionsView, makeFactsView } from "../../../../src/types.js";
import { catalogPath } from "../../../helpers/formPaths.js";
import { dobraineScenario } from "../../../scenarios/synthetic/dobraine/index.js";
import { gaulScenario } from "../../../scenarios/synthetic/gaul/index.js";
import type { Scenario } from "../../../types.js";

const spec = getFormSpec("form-8824");
let catalog: Catalog;

beforeAll(async () => {
  spec.register?.();
  catalog = await loadFromFixtures([catalogPath(spec)]);
});

const exchangeOf = (base: Scenario) =>
  base.facts.find((fact) => isLikeKindExchangeFactKey(fact.key))!;

/* The base return with a second exchange, made from the first by `change`. */
function withSecond(
  base: Scenario,
  change: (value: LikeKindExchangeFactValue) => LikeKindExchangeFactValue,
): TaxFactRow[] {
  const first = exchangeOf(base);
  const second: TaxFactRow = {
    ...first,
    id: "f-second",
    key: makeLikeKindExchangeFactKey("second-site"),
    value: change(first.value as LikeKindExchangeFactValue),
  };
  return [...base.facts, second];
}

/* The filing info of a return, as the renderer gives it to each copy. */
function filingInfoOf(base: Scenario, facts: TaxFactRow[]) {
  return resolveFilingInfo({
    facts: facts.map(({ key, value, category }) => ({ key, value, category })),
    decisions: base.decisions.map(({ decisionKey, decision }) => ({ decisionKey, decision })),
  });
}

/* Each copy's field values: `count` copies of Form 8824, evaluated as renderCopies does. */
function copies(base: Scenario, facts: TaxFactRow[]) {
  const filingInfo = filingInfoOf(base, facts);
  const count = spec.copies?.count(filingInfo) ?? 1;
  const values = Array.from({ length: count }, (_, index) => {
    const form = evaluateForm(
      spec.formId,
      {
        taxYear: base.taxYear,
        facts: makeFactsView(facts),
        decisions: makeDecisionsView(base.decisions),
        filingInfo: spec.copies?.select(filingInfo, index),
      },
      catalog,
    );
    return new Map(
      form.fields.map((field) => [field.fieldId, field.result.ok ? field.result.value : undefined]),
    );
  });
  return { count, values };
}

/* One value of another form on the whole return. */
function returnValue(base: Scenario, facts: TaxFactRow[], formId: string, id: string) {
  const result = evaluateScenario({
    filing: { id: "form-8824-copies", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const found = result.forms
    .get(formId)
    ?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  return found?.ok ? found.value : undefined;
}

const field = (id: string) => `form-8824.${id}`;

/* A smaller business exchange: $20,000 cash, $5,000 of section 1245 depreciation. */
const smallerSite = (value: LikeKindExchangeFactValue): LikeKindExchangeFactValue => ({
  ...value,
  givenUp: {
    ...value.givenUp,
    description: "Grain bins on 2 acres, 14 Mill Rd, Dayton, WA",
    adjustedBasis: 100000,
    recapture: { section1245Depreciation: 5000 },
  },
  received: {
    ...value.received,
    fairMarketValue: 200000,
    section1250Value: 120000,
    section1245Value: 50000,
    intangibleValue: 10000,
  },
  cashReceived: 20000,
  exchangeExpenses: 0,
});

describe("Form 8824: one copy for each exchange", () => {
  it("one exchange prints one copy", () => {
    expect(copies(dobraineScenario, dobraineScenario.facts).count).toBe(1);
  });

  it("two exchanges print two copies, each with its own Parts I–III", () => {
    const { count, values } = copies(dobraineScenario, withSecond(dobraineScenario, smallerSite));
    expect(count).toBe(2);
    const [first, second] = values;
    expect(first?.get(field("0.line.1_property_given_up_description_row1"))).toContain(
      "610 Quarry Rd",
    );
    expect(second?.get(field("0.line.1_property_given_up_description_row1"))).toBe(
      "Grain bins on 2 acres, 14 Mill Rd, Dayton, WA",
    );
    // The first copy keeps the dobraine golden's lines.
    expect(first?.get(field("1.line.15_cash_other_property_received"))).toBe(26000);
    expect(first?.get(field("1.line.23_recognized_gain"))).toBe(26000);
    // The second: line 15 $20,000; line 19 = 220,000 − 100,000; line 21 the $5,000 recapture.
    expect(second?.get(field("1.line.15_cash_other_property_received"))).toBe(20000);
    expect(second?.get(field("1.line.19_realized_gain_loss"))).toBe(120000);
    expect(second?.get(field("1.line.21_ordinary_income_recapture"))).toBe(5000);
    expect(second?.get(field("1.line.22_subtract_line_21_from_20"))).toBe(15000);
    expect(second?.get(field("1.line.23_recognized_gain"))).toBe(20000);
    // Each copy prints the name above Part I.
    expect(second?.get(field("0.header.taxpayer_name"))).toBe("Dobraine Halvorsen");
  });

  it("Form 4797 lines 5 and 16 take the sum of both exchanges, once", () => {
    const facts = withSecond(dobraineScenario, smallerSite);
    // 8,000 + 15,000 (line 22) and 18,000 + 5,000 (line 21).
    expect(
      returnValue(
        dobraineScenario,
        facts,
        "form-4797",
        "0.line.5_section_1231_like_kind_exchanges",
      ),
    ).toBe(23000);
    expect(
      returnValue(dobraineScenario, facts, "form-4797", "0.line.16_ordinary_like_kind_exchanges"),
    ).toBe(23000);
  });

  it("Schedule D line 11 adds an investment exchange once for each exchange", () => {
    const line11 = (facts: TaxFactRow[]) =>
      Number(
        returnValue(gaulScenario, facts, "schedule-d", "0.line.11_long_term_gain_other_forms") ?? 0,
      );
    const withoutExchange = gaulScenario.facts.filter(
      (fact) => !isLikeKindExchangeFactKey(fact.key),
    );
    const one = line11(gaulScenario.facts) - line11(withoutExchange);
    const twice = line11(withSecond(gaulScenario, (value) => value)) - line11(withoutExchange);
    expect(one).toBeGreaterThan(0);
    expect(twice).toBe(2 * one);
  });

  it("the Part IV sale prints on the first copy only", () => {
    const { count, values } = copies(
      gaulScenario,
      withSecond(gaulScenario, (value) => value),
    );
    expect(count).toBe(2);
    expect(values[0]?.get(field("1.line.26_certificate_of_divestiture_number_part1"))).toBe("25");
    expect(
      values[1]?.get(field("1.line.26_certificate_of_divestiture_number_part1")),
    ).toBeUndefined();
    expect(values[1]?.get(field("1.line.23_recognized_gain"))).toBe(
      values[0]?.get(field("1.line.23_recognized_gain")),
    );
  });
});
