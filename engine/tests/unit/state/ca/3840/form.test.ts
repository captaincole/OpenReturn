/*
 * FTB 3840 on a whole return: who files, the answers it waits for, the
 * Question B box, the signature area, and the cases the engine does not print.
 * The synthetic ingtar scenario is the base. No other form reads FTB 3840, so
 * its facts change no other line.
 */

import { describe, expect, it } from "vitest";
import {
  isCaLikeKindExchangeFactKey,
  isLikeKindExchangeFactKey,
  makeCaLikeKindExchangeFactKey,
  makeLikeKindExchangeFactKey,
  type CaLikeKindExchangeFactValue,
  type LikeKindExchangeFactValue,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { gaulScenario } from "../../../../scenarios/synthetic/gaul/index.js";
import {
  INGTAR_CA_EXCHANGE,
  INGTAR_EXCHANGE,
} from "../../../../scenarios/synthetic/ingtar/facts.js";
import { ingtarScenario as base } from "../../../../scenarios/synthetic/ingtar/index.js";
import type { Scenario } from "../../../../types.js";

const FEDERAL_KEY = makeLikeKindExchangeFactKey("placer-land");
const CALIFORNIA_KEY = makeCaLikeKindExchangeFactKey("placer-land");

function evaluate(
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
  scenario: Scenario = base,
) {
  const result = evaluateScenario({
    filing: { id: "form-3840-test", taxYear: scenario.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const form = (formId: string) => result.forms.get(formId);
  const files = (formId = "form-3840") => {
    const found = form(formId);
    return found?.mustFile.ok ? found.mustFile.value : undefined;
  };
  const field = (id: string, formId = "form-3840") =>
    form(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (id: string, formId = "form-3840") => {
    const found = field(id, formId);
    return found?.ok ? found.value : undefined;
  };
  return { result, files, field, value, pending: pendingInputs(result) };
}

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({ userId: base.userId, taxYear: base.taxYear, key, decision: value, rationale: "t" });

const withDecision = (key: string, value: unknown) => [
  ...base.decisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

const withoutExchanges = base.facts.filter(
  (fact) => !isLikeKindExchangeFactKey(fact.key) && !isCaLikeKindExchangeFactKey(fact.key),
);

function withFacts(
  federal: LikeKindExchangeFactValue | undefined,
  california: CaLikeKindExchangeFactValue | undefined | "malformed",
  slug = "placer-land",
): TaxFactRow[] {
  const template = base.facts.find((fact) => fact.key === FEDERAL_KEY)!;
  const row = (key: string, value: unknown): TaxFactRow => ({
    ...template,
    id: `f-${key}`,
    key,
    value,
  });
  return [
    ...(federal ? [row(makeLikeKindExchangeFactKey(slug), federal)] : []),
    ...(california === undefined
      ? []
      : [
          row(
            makeCaLikeKindExchangeFactKey(slug),
            california === "malformed" ? { givenUp: {} } : california,
          ),
        ]),
  ];
}

const UNSUPPORTED = { ok: false, unsupported: true };
const ca = (change: Partial<CaLikeKindExchangeFactValue>) => ({ ...INGTAR_CA_EXCHANGE, ...change });

describe("FTB 3840 who files (ca-3840-inst-2025::sec::b-who-must-file::b01)", () => {
  it("files for California land traded for Nevada land, with nothing pending", () => {
    const run = evaluate(base.facts);
    expect(run.files()).toBe(true);
    expect(run.pending.pendingFacts).toEqual([]);
  });

  it("with no exchange fact, the form does not file", () => {
    expect(evaluate(withoutExchanges).files()).toBe(false);
  });

  it("the explicit decision false wins", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_3840", false));
    expect(run.files()).toBe(false);
  });

  it("files by decision with no fact: the exchange lines are a gap, the header fills", () => {
    const run = evaluate(withoutExchanges, withDecision("decisions.scope.must_file_3840", true));
    expect(run.files()).toBe(true);
    expect(run.field("0.line.14_realized_gain_loss")).toMatchObject(UNSUPPORTED);
    expect(run.value("0.header.name")).toBe("Ingtar Vallemont & Mairin Vallemont");
  });

  it("both properties in California: no FTB 3840", () => {
    const inState = ca({
      received: { ...INGTAR_CA_EXCHANGE.received, inCalifornia: true, state: "CA" },
    });
    expect(evaluate([...withoutExchanges, ...withFacts(INGTAR_EXCHANGE, inState)]).files()).toBe(
      false,
    );
  });

  it("property outside California given up: no FTB 3840", () => {
    const outOfState = ca({
      givenUp: { ...INGTAR_CA_EXCHANGE.givenUp, inCalifornia: false, state: "OR" },
    });
    expect(evaluate([...withoutExchanges, ...withFacts(INGTAR_EXCHANGE, outOfState)]).files()).toBe(
      false,
    );
  });

  it("a California return with an exchange and no California answers: files and asks for them", () => {
    const run = evaluate([...withoutExchanges, ...withFacts(INGTAR_EXCHANGE, undefined)]);
    expect(run.files()).toBe(true);
    expect(run.pending.pendingFacts).toContain(CALIFORNIA_KEY);
    expect(run.value("0.line.14_realized_gain_loss")).toBe(140000);
    expect(run.value("1.line.8_california_sourced_deferred_gain")).toBeUndefined();
    expect(run.value("0.header.b_filing_type")).toBeUndefined();
  });

  it("a California fact with no Form 8824 fact asks for the exchange", () => {
    const run = evaluate([...withoutExchanges, ...withFacts(undefined, INGTAR_CA_EXCHANGE)]);
    expect(run.files()).toBe(true);
    expect(run.pending.pendingFacts).toContain(FEDERAL_KEY);
    expect(run.value("1.line.1a_property_address")).toBe("APN 040-210-015, Placer County");
  });

  it("a federal-only return in another state with an exchange files nothing (gaul)", () => {
    expect(evaluate(gaulScenario.facts, gaulScenario.decisions, gaulScenario).files()).toBe(false);
  });

  it("a malformed California fact files the form and every exchange line is a gap", () => {
    const run = evaluate([...withoutExchanges, ...withFacts(INGTAR_EXCHANGE, "malformed")]);
    expect(run.files()).toBe(true);
    expect(run.field("1.line.8_california_sourced_deferred_gain")).toMatchObject(UNSUPPORTED);
  });

  it("two exchanges: each takes its own form, and the engine prints one (g-multiple-exchanges::b01)", () => {
    const facts = [
      ...base.facts,
      ...withFacts(INGTAR_EXCHANGE, INGTAR_CA_EXCHANGE, "second-parcel"),
    ];
    const run = evaluate(facts);
    expect(run.field("0.line.19_deferred_gain_loss")).toMatchObject(UNSUPPORTED);
    expect(run.value("0.header.ssn")).toBe("400003840");
  });
});

describe("FTB 3840 Question B (general-question-a-through-question-c::b01–b03)", () => {
  const exchange2023: LikeKindExchangeFactValue = {
    ...INGTAR_EXCHANGE,
    givenUp: { ...INGTAR_EXCHANGE.givenUp, dateTransferred: "2023-04-11" },
    received: {
      ...INGTAR_EXCHANGE.received,
      dateIdentified: "2023-05-02",
      dateReceived: "2023-07-21",
    },
    relatedParty: undefined,
  };

  it("an earlier exchange whose gain is not recognized: Annual, with the year of the exchange", () => {
    const run = evaluate([...withoutExchanges, ...withFacts(exchange2023, INGTAR_CA_EXCHANGE)]);
    expect(run.files()).toBe(true);
    expect(run.value("0.header.b_filing_type")).toBe("annual");
    expect(run.value("0.header.b_exchange_taxable_year")).toBe("2023");
    // The same Side 1 as the initial form, and no Form 8824 this year.
    expect(run.value("0.line.19_deferred_gain_loss")).toBe(120000);
    expect(run.files("form-8824")).toBe(false);
  });

  it("the property received was sold in 2025: Final", () => {
    const sold = ca({ recognizedIn2025: true });
    const run = evaluate([...withoutExchanges, ...withFacts(exchange2023, sold)]);
    expect(run.value("0.header.b_filing_type")).toBe("final");
    expect(run.value("0.header.b_exchange_taxable_year")).toBe("2023");
  });

  it("a related party disposition with no exception recognizes the gain: Final", () => {
    const disposed: LikeKindExchangeFactValue = {
      ...INGTAR_EXCHANGE,
      relatedParty: { ...INGTAR_EXCHANGE.relatedParty!, relatedPartyDisposed: true },
    };
    const run = evaluate([...withoutExchanges, ...withFacts(disposed, INGTAR_CA_EXCHANGE)]);
    expect(run.value("0.header.b_filing_type")).toBe("final");
    expect(run.value("0.header.b_exchange_taxable_year")).toBe("2025");
  });

  it("the exchange of 2025: Initial, and no year", () => {
    const run = evaluate(base.facts);
    expect(run.value("0.header.b_filing_type")).toBe("initial");
    expect(run.value("0.header.b_exchange_taxable_year")).toBeUndefined();
  });
});

describe("FTB 3840 Question C", () => {
  it("a related party: the box, the name and the nine digits", () => {
    const run = evaluate(base.facts);
    expect(run.value("0.header.c_exchange_involves")).toBe("related_party");
    expect(run.value("0.header.c_related_party_tin")).toBe("400003842");
  });

  it("no related party: real property, and the name lines stay blank", () => {
    const unrelated = { ...INGTAR_EXCHANGE, relatedParty: undefined };
    const run = evaluate([...withoutExchanges, ...withFacts(unrelated, INGTAR_CA_EXCHANGE)]);
    expect(run.value("0.header.c_exchange_involves")).toBe("real_property");
    expect(run.value("0.header.c_related_party_name")).toBeUndefined();
  });

  it("a related party with no identifying number asks for the exchange again", () => {
    const noNumber: LikeKindExchangeFactValue = {
      ...INGTAR_EXCHANGE,
      relatedParty: { ...INGTAR_EXCHANGE.relatedParty!, identifyingNumber: undefined },
    };
    const run = evaluate([...withoutExchanges, ...withFacts(noNumber, INGTAR_CA_EXCHANGE)]);
    expect(run.pending.pendingFacts).toContain(FEDERAL_KEY);
  });
});

describe("FTB 3840 signature area (ca-3840-inst-2025::sec::e-signature::b01)", () => {
  it("attached to Form 540: no signature lines", () => {
    const run = evaluate(base.facts);
    expect(run.value("0.signing.taxpayer_phone")).toBeUndefined();
    expect(run.field("0.signing.date_signed")).toMatchObject({ ok: false });
    expect(run.field("0.signing.date_signed")).not.toMatchObject(UNSUPPORTED);
  });

  it("filed separately (no California return): the phone prints, the dates are signed by hand", () => {
    const run = evaluate(base.facts, withDecision("decisions.scope.must_file_ca_540", false));
    expect(run.files()).toBe(true);
    expect(run.value("0.signing.taxpayer_phone")).toBe("9165550384");
    expect(run.field("0.signing.date_signed")).toMatchObject(UNSUPPORTED);
    expect(run.field("0.signing.spouse_phone")).toMatchObject(UNSUPPORTED);
  });
});

describe("FTB 3840 Schedule A line 11", () => {
  it("prints the stated Schedule R percentage with four decimals", () => {
    const apportioned = ca({ apportionmentPercent: 42.125 });
    const run = evaluate([...withoutExchanges, ...withFacts(INGTAR_EXCHANGE, apportioned)]);
    expect(run.value("1.line.11_apportionment_percentage")).toBe("042.1250");
  });
});

describe("FTB 3840 changes no other form", () => {
  it("Form 1040, Form 8824, Schedule D and Form 540 are the same with or without the California fact", () => {
    const withCa = evaluate(base.facts);
    const without = evaluate(base.facts.filter((fact) => fact.key !== CALIFORNIA_KEY));
    for (const formId of ["form-1040", "form-8824", "schedule-d", "form-540", "schedule-ca"]) {
      const values = (run: ReturnType<typeof evaluate>) =>
        run.result.forms.get(formId)?.fields.map((each) => [each.fieldId, each.result]);
      expect(values(without)).toEqual(values(withCa));
    }
  });
});
