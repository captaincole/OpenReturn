/*
 * Form 965-A on a whole return: who files, the missing answers, the gaps,
 * Schedule 2 line 20, and "no facts, nothing changes". The synthetic ferane
 * scenario is the base; wren has no section 965 facts.
 */

import { describe, expect, it } from "vitest";
import {
  makeSection965DeferredFactKey,
  makeSection965InclusionFactKey,
  makeSection965OtherLiabilityFactKey,
  makeSection965SCorporationFactKey,
  type Section965InclusionValue,
  type Section965OtherLiabilityValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { PAST_SCHEDULE } from "../../../../src/federal/965-a/lines.js";
import { MORE_THAN_ONE_FORM } from "../../../../src/federal/965-a/resolveInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { bainScenario as bain } from "../../../scenarios/synthetic/bain/index.js";
import { feraneScenario as ferane } from "../../../scenarios/synthetic/ferane/index.js";
import { wrenScenario as wren } from "../../../scenarios/synthetic/wren/index.js";

type Base = typeof ferane;

const LINE_20 = "1.line.20_section_965_net_tax_liability_installment";
const OLD_LINE_20 =
  "No section 965 / Form 965-A scenario yet; the deferred installment amount is informational and is not added into line 21.";
const KEY_2018 = makeSection965InclusionFactKey(2018);
const KEY_2017 = makeSection965InclusionFactKey(2017);
const KEY_2020 = makeSection965InclusionFactKey(2020);
const TRIGGERED = makeSection965OtherLiabilityFactKey("tillicum-triggered");

const valueOf = <T>(key: string): T => ferane.facts.find((fact) => fact.key === key)!.value as T;

function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = ferane.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const row = (key: string, value: unknown): TaxFactRow => ({
  ...ferane.facts[0]!,
  id: `f-${key}`,
  category: "foreign",
  key,
  value,
});

function evaluate(
  base: Pick<Base, "taxYear" | "facts" | "decisions">,
  facts: TaxFactRow[] = base.facts,
  decisions: AIDecisionRow[] = base.decisions,
) {
  const result = evaluateScenario({
    filing: { id: "form-965-a-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-965-a", id);
  const missing = result.forms.get("form-965-a")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;
const reasonOf = (result: unknown) => (result as { reason?: string } | undefined)?.reason;

describe("Form 965-A: no facts, nothing changes", () => {
  it("a return with no section 965 facts files no Form 965-A and keeps Schedule 2 line 20's old reason", () => {
    expect(evaluate(wren).files("form-965-a")).toBe(false);
    // bain files Schedule 2 for other taxes and has no section 965 fact.
    const { files, field } = evaluate(bain);
    expect(files("form-965-a")).toBe(false);
    expect(files("schedule-2")).toBe(true);
    const line20 = field("schedule-2", LINE_20);
    expect(isGap(line20)).toBe(true);
    expect(reasonOf(line20)).toBe(OLD_LINE_20);
  });

  it("the decision false keeps the form off, and Schedule 2 with it", () => {
    const decisions = [
      ...ferane.decisions,
      decisionRow({
        userId: ferane.userId,
        taxYear: ferane.taxYear,
        key: "decisions.scope.must_file_965_a",
        decision: false,
        rationale: "test",
      }),
    ];
    const { files } = evaluate(ferane, ferane.facts, decisions);
    expect(files("form-965-a")).toBe(false);
    expect(files("schedule-2")).toBe(false);
  });
});

describe("Form 965-A: who files (irs-965a-inst-2025::sec::who-must-file::b01)", () => {
  it("any section 965 fact files the form", () => {
    expect(evaluate(ferane).files("form-965-a")).toBe(true);
    const onlyDeferred = [
      ...wren.facts,
      row(makeSection965DeferredFactKey("one"), {
        electionOrTransferYear: 2018,
        name: "Example S Corp",
        ein: "00-0000001",
        beginningDeferred: 5000,
      }),
    ];
    const { files, line, value } = evaluate(wren, onlyDeferred);
    expect(files("form-965-a")).toBe(true);
    expect(line("2.part4.1_s_corp_liability_col_i")).toBe(5000);
    // A deferred liability alone has no installment: Schedule 2 does not file for it.
    expect(value("form-1040", "line.23")).toBeUndefined();
  });

  it("a fully paid liability with nothing due still reports, and Schedule 2 does not file for it", () => {
    // 2020, no installment election: paid in full with the 2020 return.
    const facts = [...wren.facts, row(KEY_2020, valueOf(KEY_2020))];
    const { files, line } = evaluate(wren, facts);
    expect(files("form-965-a")).toBe(true);
    expect(line("0.part2.4_liability_paid_col_b")).toBe(2225);
    expect(line("1.part2.4_net_965_tax_liability_col_j")).toBe(0);
    expect(line("1.part2.totals_net_965_tax_liability_col_k")).toBeUndefined();
    expect(files("schedule-2")).toBe(false);
  });
});

describe("Form 965-A: the made-up return (ferane)", () => {
  it("Schedule 2 line 20 is Part II Totals column (k), the sum of the lines' 2025 payments", () => {
    const { line, value, files } = evaluate(ferane);
    const paid = [2, 3, 5, 6].map((each) => line(`1.part2.${each}_net_965_tax_liability_col_k`));
    expect(paid).toEqual([9512, 1350, 25000, 992]);
    expect(line("1.part2.totals_net_965_tax_liability_col_k")).toBe(36854);
    expect(value("schedule-2", LINE_20)).toBe(36854);
    expect(files("schedule-2")).toBe(true);
    // Line 20 is not part of line 21, so the total tax is the line 16 tax alone.
    expect(value("form-1040", "line.24")).toBe(value("form-1040", "line.16"));
  });

  it("Part I column (e) is the year's Part III column (g) total", () => {
    const { line } = evaluate(ferane);
    expect(line("0.part1.1_net_965_liability_col_e")).toBe(line("1.part3.1_total_col_g"));
    expect(line("0.part1.2_net_965_liability_col_e")).toBe(line("1.part3.2_total_col_g"));
  });

  it("a stated payment for 2025 replaces the scheduled one", () => {
    const value2019 = valueOf<Section965InclusionValue>(makeSection965InclusionFactKey(2019));
    const facts = factsWith({
      [makeSection965InclusionFactKey(2019)]: { ...value2019, paidThisYear: 2700 },
    });
    const { line } = evaluate(ferane, facts);
    expect(line("1.part2.3_net_965_tax_liability_col_h")).toBe(2700);
    expect(line("1.part2.3_net_965_tax_liability_col_j")).toBe(6750 - 2700 - 1013 - 2700);
  });
});

describe("Form 965-A: missing answers and gaps", () => {
  it("a Part III row waits for its year's Part I line (column (d) is Part I column (c))", () => {
    const { missing, line } = evaluate(ferane, factsWith({ [KEY_2018]: undefined }));
    expect(missing).toContain(KEY_2018);
    expect(line("1.part3.2_row1_col_c")).toBe(254300);
    expect(line("1.part3.2_row1_col_d")).toBeUndefined();
    expect(line("1.part3.2_total_col_g")).toBeUndefined();
  });

  it("a triggered liability without its amount waits, and the totals with it", () => {
    const triggered = valueOf<Section965OtherLiabilityValue>(TRIGGERED);
    const facts = factsWith({ [TRIGGERED]: { ...triggered, triggeredLiability: undefined } });
    const { missing, line } = evaluate(ferane, facts);
    expect(missing).toContain(TRIGGERED);
    expect(line("1.part2.totals_net_965_tax_liability_col_k")).toBeUndefined();
  });

  it("a 2025 triggering event is a gap on its Part II line, the totals and Schedule 2 line 20", () => {
    const triggered = valueOf<Section965OtherLiabilityValue>(TRIGGERED);
    const facts = factsWith({
      [TRIGGERED]: { ...triggered, year: 2025, paidByInstallmentYear: undefined },
    });
    const { field, line } = evaluate(ferane, facts);
    expect(line("0.part1.6_net_965_liability_col_i")).toBe(12400);
    expect(isGap(field("form-965-a", "1.part2.6_net_965_tax_liability_col_k"))).toBe(true);
    expect(isGap(field("form-965-a", "1.part2.totals_net_965_tax_liability_col_k"))).toBe(true);
    expect(isGap(field("schedule-2", LINE_20))).toBe(true);
  });

  it("a Part IV amount triggered in 2025 is a gap on columns (f) and (i) and the total", () => {
    const key = makeSection965DeferredFactKey("halvard-ridge");
    const facts = factsWith({ [key]: { ...valueOf<object>(key), triggeredThisYear: 3000 } });
    const { field } = evaluate(ferane, facts);
    expect(isGap(field("form-965-a", "2.part4.1_s_corp_liability_col_f"))).toBe(true);
    expect(isGap(field("form-965-a", "2.part4.1_s_corp_liability_col_i"))).toBe(true);
    expect(isGap(field("form-965-a", "2.part4.total_s_corp_liability_col_i"))).toBe(true);
  });

  it("last year's payments that name 2025 are a gap on that line", () => {
    const value2019 = valueOf<Section965InclusionValue>(makeSection965InclusionFactKey(2019));
    const paid = { ...value2019.paidByInstallmentYear, 7: 1350 };
    const facts = factsWith({
      [makeSection965InclusionFactKey(2019)]: { ...value2019, paidByInstallmentYear: paid },
    });
    expect(
      isGap(evaluate(ferane, facts).field("form-965-a", "1.part2.3_net_965_tax_liability_col_j")),
    ).toBe(true);
  });

  it("a balance still unpaid after year 8 is a gap: 2017 without its Part III deferral", () => {
    const facts = [...wren.facts, row(KEY_2017, valueOf(KEY_2017))];
    const { field, files } = evaluate(wren, facts);
    expect(reasonOf(field("form-965-a", "1.part2.1_net_965_tax_liability_col_j"))).toBe(
      PAST_SCHEDULE,
    );
    expect(files("schedule-2")).toBe(true);
    expect(isGap(field("schedule-2", LINE_20))).toBe(true);
  });

  it("five S corporations in one year need a second form: every line is a gap", () => {
    const extra = [1, 2, 3, 4, 5].map((each) =>
      row(makeSection965SCorporationFactKey(`extra-${each}`), {
        inclusionYear: 2019,
        name: `Extra ${each} Inc`,
        ein: "00-0000002",
        netTaxWithThisSCorporation: 91000,
        deferralElection: false,
      }),
    );
    const { field } = evaluate(ferane, factsWith({}, extra));
    const cell = field("form-965-a", "0.part1.1_net_965_liability_col_b");
    expect(reasonOf(cell)).toBe(MORE_THAN_ONE_FORM);
    expect(isGap(field("schedule-2", LINE_20))).toBe(true);
  });
});
