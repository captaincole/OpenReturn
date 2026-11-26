/*
 * Form 8958 on a whole return: who files, the answers it asks for, the cases the
 * engine does not print, and that the form changes no other amount. The
 * synthetic careane scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  COMMUNITY_PROPERTY_KEYS,
  makeCommunityPropertyItemFactKey,
  type CommunityPropertyItemFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { careaneScenario as base } from "../../../scenarios/synthetic/careane/index.js";

const isCommunityFact = (fact: TaxFactRow) => fact.key.startsWith("community_property.");
const otherFacts = base.facts.filter((fact) => !isCommunityFact(fact));
const communityFacts = base.facts.filter(isCommunityFact);
const template = communityFacts.find((fact) => fact.key.startsWith("community_property.item."))!;

const itemFact = (slug: string, value: CommunityPropertyItemFactValue): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeCommunityPropertyItemFactKey(slug),
  value,
});
const domicile = (state: string): TaxFactRow => ({
  ...template,
  id: "f-domicile",
  key: COMMUNITY_PROPERTY_KEYS.domicileState,
  value: state,
});
const livingApart = (): TaxFactRow => ({
  ...template,
  id: "f-apart",
  key: COMMUNITY_PROPERTY_KEYS.spousesLivingApartRules,
  value: true,
});
const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });
const withStatus = (status: string) => [
  ...base.decisions.filter((each) => each.decisionKey !== "decisions.scope.filing_status"),
  decision("decisions.scope.filing_status", status),
];

const wages = (slug: string, owner: "taxpayer" | "spouse", amount: number): TaxFactRow =>
  itemFact(slug, { line: "wages", description: slug, amount, basis: "community", owner });

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8958-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (id: string) =>
    result.forms.get("form-8958")?.fields.find((each) => each.fieldId === `form-8958.${id}`)
      ?.result;
  const value = (id: string) => {
    const found = field(id);
    return found?.ok ? found.value : undefined;
  };
  const pending = () => pendingInputs(result).pendingFacts;
  return { result, files, field, value, pending };
}

const ROW_1 = "0.line.1_wages_each_employer_row_1";
const UNSUPPORTED = { ok: false, unsupported: true };

describe("Form 8958 who files", () => {
  it("files on a separate return in Texas with community property items", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-8958")).toBe(true);
    expect(run.pending()).toEqual([]);
  });

  it("does not file with no items", () => {
    expect(evaluate([...otherFacts, domicile("TX")]).files("form-8958")).toBe(false);
  });

  it("does not file on a joint return", () => {
    expect(evaluate(base.facts, withStatus("married_filing_jointly")).files("form-8958")).toBe(
      false,
    );
  });

  it("does not file when the domicile has no community property law", () => {
    const facts = [
      ...base.facts.filter((fact) => fact.key !== COMMUNITY_PROPERTY_KEYS.domicileState),
      domicile("OR"),
    ];
    expect(evaluate(facts).files("form-8958")).toBe(false);
  });

  it("an RDP files as single in California, not in Texas", () => {
    const items = communityFacts.filter(
      (fact) => fact.key !== COMMUNITY_PROPERTY_KEYS.domicileState,
    );
    const single = withStatus("single");
    expect(evaluate([...otherFacts, ...items, domicile("CA")], single).files("form-8958")).toBe(
      true,
    );
    expect(evaluate([...otherFacts, ...items, domicile("TX")], single).files("form-8958")).toBe(
      false,
    );
  });

  it("files while the domicile is missing, and asks for it", () => {
    const facts = base.facts.filter((fact) => fact.key !== COMMUNITY_PROPERTY_KEYS.domicileState);
    const run = evaluate(facts);
    expect(run.files("form-8958")).toBe(true);
    expect(run.pending()).toContain(COMMUNITY_PROPERTY_KEYS.domicileState);
    expect(run.value(`${ROW_1}_col_b`)).toBeUndefined();
  });

  it("the explicit decision wins", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_8958", false)];
    expect(evaluate(base.facts, decisions).files("form-8958")).toBe(false);
  });
});

describe("Form 8958 changes no other amount", () => {
  it("every other form's fields are the same with and without the community property facts", () => {
    const values = (facts: TaxFactRow[]) => {
      const out = new Map<string, string>();
      for (const [formId, form] of evaluate(facts).result.forms) {
        if (formId === "form-8958") continue;
        for (const each of form.fields) out.set(each.fieldId, JSON.stringify(each.result));
      }
      return out;
    };
    expect(values(base.facts)).toEqual(values(otherFacts));
  });
});

describe("Form 8958 rows", () => {
  it("the living-apart rules give each spouse his or her own wages", () => {
    const run = evaluate([...base.facts, livingApart()]);
    expect([
      run.value(`${ROW_1}_col_b`),
      run.value("0.line.1_wages_each_employer_row_2_col_b"),
    ]).toEqual([72000, 0]);
  });

  it("more items than rows: the line is unsupported, the other lines still print", () => {
    const extra = [1, 2, 3].map((count) => wages(`extra-${count}`, "spouse", 1000));
    const run = evaluate([...base.facts, ...extra]);
    expect(run.field(`${ROW_1}_col_a`)).toMatchObject(UNSUPPORTED);
    expect(run.value("0.line.2_interest_income_each_payer_row_1_col_b")).toBe(600);
  });

  it("an item with no owner where its basis needs one waits, with its description printed", () => {
    const noOwner = itemFact("no-owner", {
      line: "other",
      description: "Gift fund interest",
      amount: 500,
      basis: "separate",
    });
    const run = evaluate([...base.facts, noOwner]);
    expect(run.value("1.line.12_other_items_row_2_description")).toBe("Gift fund interest");
    expect(run.value("1.line.12_other_items_row_2_col_a")).toBeUndefined();
    expect(run.pending()).toContain(noOwner.key);
  });

  it("a community part larger than the total is unsupported", () => {
    const bad = itemFact("bad-part", {
      line: "other",
      description: "Annuity",
      amount: 1000,
      basis: "part_community",
      communityAmount: 1500,
      owner: "taxpayer",
    });
    expect(evaluate([...base.facts, bad]).field("1.line.12_other_items_row_2_col_b")).toMatchObject(
      UNSUPPORTED,
    );
  });

  it("line 4 prints its one row; a second refund needs a statement", () => {
    const refund = (slug: string) =>
      itemFact(slug, {
        line: "state_income_tax_refund",
        description: slug,
        amount: 900,
        basis: "community",
      });
    const one = evaluate([...base.facts, refund("az-refund")]);
    expect([
      one.value("0.line.4_state_income_tax_refund_col_b"),
      one.value("0.line.4_state_income_tax_refund_col_c"),
    ]).toEqual([450, 450]);
    const two = evaluate([...base.facts, refund("az-refund"), refund("nm-refund")]);
    expect(two.field("0.line.4_state_income_tax_refund_col_a")).toMatchObject(UNSUPPORTED);
  });
});
