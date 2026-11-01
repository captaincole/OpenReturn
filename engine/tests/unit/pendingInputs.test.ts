import { describe, expect, it } from "vitest";
import type { FilingInfo } from "../../src/filingInfo.js";
import { pendingInputs } from "../../src/pendingInputs.js";
import type { BaseFormField, DerivationResult, EvaluatedForm } from "../../src/types.js";

const ok = <T>(value: T): DerivationResult<T> => ({
  ok: true,
  value,
  rationale: "",
  supportingFactKeys: [],
});
const blocked = (extra: Partial<Extract<DerivationResult<never>, { ok: false }>>) =>
  ({ ok: false, reason: "blocked", ...extra }) as DerivationResult<never>;

const field = (fieldId: string, result: DerivationResult<unknown>) =>
  ({ fieldId, result }) as unknown as BaseFormField;

function form(
  formId: string,
  mustFile: DerivationResult<boolean>,
  fields: BaseFormField[] = [],
  missingInputs: string[] = [],
): EvaluatedForm<BaseFormField> {
  return {
    formId,
    jurisdiction: "federal",
    title: formId,
    taxYear: 2025,
    mustFile,
    missingInputs,
    fields,
  };
}

const IDENTITY = {
  taxpayerFirstName: "A",
  taxpayerLastName: "B",
  taxpayerSSN: "000-00-0000",
  taxpayerDateOfBirth: "1990-01-01",
  homeAddressLine1: "1 Main St",
  homeAddressCity: "Town",
  homeAddressState: "CA",
  homeAddressZip: "90000",
  taxpayerOccupation: "Engineer",
  taxpayerPhone: "555-0100",
} as unknown as FilingInfo;

const run = (forms: EvaluatedForm<BaseFormField>[], filingInfo = IDENTITY) =>
  pendingInputs({
    forms: new Map(forms.map((evaluated) => [evaluated.formId, evaluated])),
    filingInfo,
  });

describe("pendingInputs", () => {
  it("is empty for a complete return", () => {
    expect(run([form("a", ok(true), [field("a.1", ok(5))])])).toEqual({
      pendingDecisions: [],
      pendingFacts: [],
    });
  });

  it("asks for the must-file decision when it is missing", () => {
    const evaluated = form("a", blocked({ missingDecisionKey: "decisions.scope.must_file_a" }));
    expect(run([evaluated]).pendingDecisions).toEqual(["decisions.scope.must_file_a"]);
  });

  it("splits a filed form's blockers into decisions and facts, sorted and unique", () => {
    const evaluated = form(
      "a",
      ok(true),
      [
        field("a.1", blocked({ missingFactKeys: ["wages.z", "wages.a"] })),
        field("a.2", blocked({ missingDecisionKey: "decisions.b" })),
        field("a.3", blocked({ missingFactKeys: ["wages.a"] })),
      ],
      ["decisions.a"],
    );
    expect(run([evaluated])).toEqual({
      pendingDecisions: ["decisions.a", "decisions.b"],
      pendingFacts: ["wages.a", "wages.z"],
    });
  });

  it("ignores forms that do not file, and engine gaps", () => {
    const notFiled = form(
      "a",
      ok(false),
      [field("a.1", blocked({ missingFactKeys: ["x"] }))],
      ["y"],
    );
    const gap = form("b", ok(true), [
      field("b.1", blocked({ unsupported: true, missingFactKeys: ["z"] })),
    ]);
    expect(run([notFiled, gap])).toEqual({ pendingDecisions: [], pendingFacts: [] });
  });

  it("asks for identity slots the resolver could not read", () => {
    const info = { ...IDENTITY, taxpayerPhone: undefined } as unknown as FilingInfo;
    expect(run([], info).pendingFacts).toEqual(["identity.phone"]);
  });
});
