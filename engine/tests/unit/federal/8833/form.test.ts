/*
 * Form 8833 on a whole return: who files, what each copy prints, the cases the
 * engine does not print, and that a return with no treaty position is
 * unchanged. The synthetic irella scenario is the base.
 */

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { loadFromFixtures, type Catalog } from "../../../../src/catalog.js";
import { evaluateForm } from "../../../../src/engine.js";
import {
  OTHER_INCOME_KEYS,
  isTreatyPositionFactKey,
  makeTreatyPositionFactKey,
  type TreatyPositionFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { resolveFilingInfo } from "../../../../src/filingInfo.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { getFormSpec } from "../../../../src/registry.js";
import { makeDecisionsView, makeFactsView } from "../../../../src/types.js";
import { decisionRow, identityFact } from "../../../helpers/fixtureBuilders.js";
import { catalogPath } from "../../../helpers/formPaths.js";
import { irellaScenario as base } from "../../../scenarios/synthetic/irella/index.js";

/* Each case evaluates whole returns synchronously; yield to the event loop so the worker can report (requiredInputs.test.ts). */
beforeEach(() => new Promise<void>((resolve) => setImmediate(resolve)));

const otherFacts = base.facts.filter((fact) => !isTreatyPositionFactKey(fact.key));
const template = base.facts.find((fact) => isTreatyPositionFactKey(fact.key))!;
const baseValue = template.value as TreatyPositionFactValue;

const position = (slug: string, value: Partial<TreatyPositionFactValue> = {}): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeTreatyPositionFactKey(slug),
  value: { ...baseValue, ...value },
});

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const withDecision = (key: string, value: unknown): AIDecisionRow[] => [
  ...base.decisions.filter((each) => each.decisionKey !== key),
  decision(key, value),
];

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8833-test", taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (id: string, formId = "form-8833") =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (id: string, formId = "form-8833") => {
    const found = field(id, formId);
    return found?.ok ? found.value : undefined;
  };
  return { result, files, field, value, pending: pendingInputs(result).pendingFacts };
}

const ROW = (row: number) => `0.line.6_treaty_position_explanation_row_${row}`;
const UNSUPPORTED = { ok: false, unsupported: true };

describe("Form 8833 who files", () => {
  it("files for a position whose reporting is not waived", () => {
    expect(evaluate([...otherFacts, position("p")]).files("form-8833")).toBe(true);
  });

  it("files nothing for a waived position", () => {
    const run = evaluate([...otherFacts, position("p", { reportingWaived: true })]);
    expect(run.files("form-8833")).toBe(false);
  });

  it("an explicit decision false wins over a position", () => {
    const run = evaluate(
      [...otherFacts, position("p")],
      withDecision("decisions.scope.must_file_8833", false),
    );
    expect(run.files("form-8833")).toBe(false);
  });

  it("an explicit decision true with no position makes the content lines a gap", () => {
    const run = evaluate(otherFacts, withDecision("decisions.scope.must_file_8833", true));
    expect(run.files("form-8833")).toBe(true);
    expect(run.field("0.line.1a_treaty_country")).toMatchObject(UNSUPPORTED);
    expect(run.field(ROW(1))).toMatchObject(UNSUPPORTED);
    expect(run.value("0.header.taxpayer_name")).toBe("Irella Wenlock");
  });

  it("a spouse's position files on a joint return only", () => {
    const spouse = position("s", { owner: "spouse" });
    expect(evaluate([...otherFacts, spouse]).files("form-8833")).toBe(false);
  });

  it("a position with an answer missing files and is listed until it is answered", () => {
    const incomplete = position("p", { explanation: undefined, treatyCountry: "  " });
    const run = evaluate([...otherFacts, incomplete]);
    expect(run.files("form-8833")).toBe(true);
    expect(run.pending).toContain(makeTreatyPositionFactKey("p"));
    expect(run.value("0.line.1a_treaty_country")).toBeUndefined();
    expect(run.value(ROW(1))).toBeUndefined();
  });

  it("neither header box checked is a missing answer; line 5 Yes needs its subsections", () => {
    const noBox = position("a", { section6114Disclosure: false });
    const noSubsection = position("b", { specificallyRequired: true });
    const run = evaluate([...otherFacts, noBox, noSubsection]);
    expect(run.pending).toEqual(
      expect.arrayContaining([makeTreatyPositionFactKey("a"), makeTreatyPositionFactKey("b")]),
    );
  });

  it("the scenario's complete position waits for nothing", () => {
    expect(evaluate(base.facts).pending.filter(isTreatyPositionFactKey)).toEqual([]);
  });
});

describe("Form 8833 lines", () => {
  it("line 5 Yes prints the subsections; No leaves them blank", () => {
    const yes = evaluate([
      ...otherFacts,
      position("p", { specificallyRequired: true, requiredSubsections: "301.6114-1(b)(7)" }),
    ]);
    expect(yes.value("0.line.5_reporting_required_6114_1b_yes")).toBe(true);
    expect(yes.value("0.line.5_reporting_required_6114_1b_no")).toBeUndefined();
    expect(yes.value("0.line.5_6114_1b_subsections")).toBe("301.6114-1(b)(7)");
    const no = evaluate([
      ...otherFacts,
      position("p", { requiredSubsections: "301.6114-1(b)(7)" }),
    ]);
    expect(no.value("0.line.5_6114_1b_subsections")).toBeUndefined();
    expect(no.value("0.line.5_reporting_required_6114_1b_no")).toBe(true);
  });

  it("line 4 prints the stated limitation on benefits test; blank when none", () => {
    const run = evaluate([
      ...otherFacts,
      position("p", { limitationOnBenefits: "Article 22(2)(a)" }),
    ]);
    expect(run.value("0.line.4_limitation_on_benefits_provisions")).toBe("Article 22(2)(a)");
    expect(
      evaluate(base.facts).value("0.line.4_limitation_on_benefits_provisions"),
    ).toBeUndefined();
  });

  it("a dual-resident position is a gap: it belongs on Form 1040-NR", () => {
    const run = evaluate([...otherFacts, position("p", { dualResidentDisclosure: true })]);
    expect(run.field("0.header.dual_resident_disclosing_under_7701b")).toMatchObject(UNSUPPORTED);
    expect(run.value("0.header.disclosing_under_section_6114")).toBe(true);
  });

  it("an explanation longer than 25 rows makes every row a gap", () => {
    const long = Array.from({ length: 26 }, (_, index) => `Paragraph ${index + 1}.`).join("\n");
    const run = evaluate([...otherFacts, position("p", { explanation: long })]);
    for (const row of [1, 13, 25]) expect(run.field(ROW(row))).toMatchObject(UNSUPPORTED);
  });

  it("the reference ID stays blank and the citizen or resident box is checked", () => {
    const run = evaluate(base.facts);
    expect(run.value("0.header.reference_id_number")).toBeUndefined();
    expect(run.value("0.header.us_citizen_or_resident")).toBe(true);
  });
});

describe("Form 8833 on a joint return", () => {
  const spouseFacts = [
    identityFact({
      userId: base.userId,
      taxYear: base.taxYear,
      suffix: "spouse.name.first",
      value: "Tovan",
    }),
    identityFact({
      userId: base.userId,
      taxYear: base.taxYear,
      suffix: "spouse.name.last",
      value: "Wenlock",
    }),
    identityFact({
      userId: base.userId,
      taxYear: base.taxYear,
      suffix: "spouse.ssn",
      value: "400-00-8834",
    }),
    identityFact({
      userId: base.userId,
      taxYear: base.taxYear,
      suffix: "spouse.occupation",
      value: "Engineer",
    }),
  ];

  it("a spouse's position prints the spouse's name and number", () => {
    const run = evaluate(
      [...otherFacts, ...spouseFacts, position("s", { owner: "spouse" })],
      withDecision("decisions.scope.filing_status", "married_filing_jointly"),
    );
    expect(run.files("form-8833")).toBe(true);
    expect(run.value("0.header.taxpayer_name")).toBe("Tovan Wenlock");
    expect(String(run.value("0.header.us_taxpayer_id_number"))).toContain("8834");
  });
});

describe("Form 8833 copies", () => {
  const spec = getFormSpec("form-8833");
  let catalog: Catalog;

  beforeAll(async () => {
    spec.register?.();
    catalog = await loadFromFixtures([catalogPath(spec)]);
  });

  /* Each copy's field values, evaluated as renderCopies does. */
  function copies(facts: TaxFactRow[]) {
    const filingInfo = resolveFilingInfo({
      facts: facts.map(({ key, value, category }) => ({ key, value, category })),
      decisions: base.decisions.map(({ decisionKey, decision }) => ({ decisionKey, decision })),
    });
    const count = spec.copies?.count(filingInfo) ?? 1;
    return Array.from({ length: count }, (_, index) => {
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
        form.fields.map((each) => [each.fieldId, each.result.ok ? each.result.value : undefined]),
      );
    });
  }

  it("one copy for each disclosed position, in the order recorded; a waived one has none", () => {
    const second = position("credit", {
      treatyCountry: "France",
      articles: "24",
      explanation: "A credit for a French tax the Code does not allow.",
    });
    const waived = position("pension", { reportingWaived: true, treatyCountry: "Germany" });
    const forms = copies([...otherFacts, position("first"), waived, second]);
    expect(forms.map((form) => form.get("form-8833.0.line.1a_treaty_country"))).toEqual([
      "People's Republic of China",
      "France",
    ]);
    expect(forms[1].get(`form-8833.${ROW(1)}`)).toBe(
      "A credit for a French tax the Code does not allow.",
    );
    expect(forms[1].get(`form-8833.${ROW(2)}`)).toBeUndefined();
  });
});

describe("Form 8833 changes nothing else", () => {
  it("with no treaty position, the form does not file and Form 1040 is the same", () => {
    const withPosition = evaluate(base.facts);
    const without = evaluate(otherFacts);
    expect(without.files("form-8833")).toBe(false);
    for (const line of ["line.9", "line.11a", "line.15", "line.24", "line.34"]) {
      expect(without.value(line, "form-1040")).toBe(withPosition.value(line, "form-1040"));
    }
  });

  it("a line 8z item below 0 files Schedule 1; a return with none is unchanged", () => {
    const noItems = otherFacts.filter((fact) => fact.key !== OTHER_INCOME_KEYS.otherItems);
    const plain = evaluate(noItems);
    expect(plain.files("schedule-1")).toBe(false);
    expect(plain.value("line.9", "form-1040")).toBe(31400);
    const exempt = evaluate(base.facts);
    expect(exempt.files("schedule-1")).toBe(true);
    expect(exempt.value("line.8", "form-1040")).toBe(-5000);
  });
});
