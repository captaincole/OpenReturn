import { describe, expect, it } from "vitest";
import { evaluateScenario, pendingInputs } from "../../src";
import {
  isK1HoldingFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
} from "../../src/facts";
import type { TaxFactRow } from "../../src/facts/rows";
import { bayleScenario } from "../scenarios/synthetic/bayle";
import { cadsuaneScenario } from "../scenarios/synthetic/cadsuane";
import { tamScenario } from "../scenarios/synthetic/tam";
import { tcbUs005Scenario } from "../scenarios/tcb-us-005";
import type { Scenario } from "../types";

function run(scenario: Scenario, facts: TaxFactRow[] = scenario.facts) {
  const result = evaluateScenario({
    filing: { id: scenario.name, taxYear: scenario.taxYear },
    facts,
    decisions: scenario.decisions,
    authEmail: null,
  });
  const field = (fieldId: string) => {
    const formId = fieldId.split(".")[0];
    return result.forms.get(formId)?.fields.find((entry) => entry.fieldId === fieldId)?.result;
  };
  const value = (fieldId: string) => {
    const found = field(fieldId);
    return found?.ok ? found.value : undefined;
  };
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok === true && form.mustFile.value === true;
  };
  return { result, field, value, files };
}

/* The scenario's holding facts with their values changed. */
const editHoldings = (
  facts: TaxFactRow[],
  edit: (holding: K1HoldingFactValue, key: string) => K1HoldingFactValue,
): TaxFactRow[] =>
  facts.map((fact) =>
    isK1HoldingFactKey(fact.key)
      ? { ...fact, value: edit(fact.value as K1HoldingFactValue, fact.key) }
      : fact,
  );

const k1Fact = (category: string, key: string, value: unknown): TaxFactRow => ({
  id: `f-${key}`,
  userId: "partnership-test",
  taxYear: 2025,
  category,
  key,
  value,
  sourceNote: "made up for this test",
  createdAt: "2026-11-23T00:00:00Z",
});

describe("a passive partner's income (tam)", () => {
  const passive = run(tamScenario);
  const working = run(
    tamScenario,
    editHoldings(tamScenario.facts, (holding) => ({ ...holding, materiallyParticipated: true })),
  );

  it("is passive income in column (h), and net investment income with no line 4b adjustment", () => {
    expect(passive.value("schedule-e.1.line.28_row_a_col_h_passive_income")).toBe(40000);
    expect(passive.value("form-8960.0.line.4a")).toBe(40000);
    expect(passive.value("form-8960.0.line.4b")).toBeUndefined();
  });

  it("moves to column (k) and comes out on line 4b when the partner materially participates", () => {
    expect(working.value("schedule-e.1.line.28_row_a_col_k_nonpassive_income")).toBe(40000);
    expect(working.value("schedule-e.1.line.28_row_a_col_h_passive_income")).toBeUndefined();
    expect(working.value("form-8960.0.line.4b")).toBe(-40000);
    expect(working.value("form-8960.0.line.12")).toBe(10200);
  });

  it("is ready to file with nothing pending", () => {
    expect(pendingInputs(passive.result).pendingFacts).toEqual([]);
  });
});

describe("a passive loss held back by Form 8582 (cadsuane)", () => {
  const withoutIncome = run(
    cadsuaneScenario,
    cadsuaneScenario.facts.filter((fact) => !fact.key.endsWith("caemlyn-apartments")),
  );

  it("allows none of the loss with no passive income, and Form 8995 counts none of its QBI", () => {
    expect(withoutIncome.files("form-8582")).toBe(true);
    expect(withoutIncome.value("form-8582.1.part8.row_1_col_c_allowed_loss")).toBe(0);
    expect(withoutIncome.value("schedule-e.1.line.28_row_a_col_g_passive_loss_allowed")).toBe(
      undefined,
    );
    expect(withoutIncome.value("schedule-e.1.line.41_total_income_or_loss")).toBe(0);
    expect(withoutIncome.value("form-8995.0.line.1i_c")).toBe(0);
  });

  it("asks for the partner's basis when the holding does not give it", () => {
    const facts = editHoldings(cadsuaneScenario.facts, (holding) => ({
      ...holding,
      partnershipBasisAtStart: undefined,
    }));
    const pending = pendingInputs(run(cadsuaneScenario, facts).result).pendingFacts;
    expect(pending).toContain(makeK1HoldingFactKey("tar-valon-boatworks"));
  });
});

describe("a K-1's passive income frees a royalty's passive loss (tcb-us-005)", () => {
  const before = run(tcbUs005Scenario);
  const k1: PartnershipK1FactValue = {
    form: "1065",
    entityName: "Maple Hollow Partners LP",
    entityEin: "00-0005065",
    partnerType: "limited",
    boxes: [{ box: "1", amount: 2000 }],
  };
  const holding: K1HoldingFactValue = {
    owner: "taxpayer",
    materiallyParticipated: false,
    partnershipBasisAtStart: 5000,
  };
  const after = run(tcbUs005Scenario, [
    ...tcbUs005Scenario.facts,
    k1Fact("k1", makePartnershipK1FactKey("maple-hollow"), k1),
    k1Fact("k1", makeK1HoldingFactKey("maple-hollow"), holding),
  ]);

  it("leaves the rentals' results as they are without the K-1", () => {
    expect(before.value("form-8582.1.part8.row_1_col_c_allowed_loss")).toBe(0);
    expect(before.value("schedule-e.0.line.25_losses")).toBe(29000);
  });

  it("adds the K-1 to Part V and allows the royalty's loss up to the K-1's income", () => {
    expect(after.value("form-8582.1.part5.row_2_name")).toBe("Maple Hollow Partners LP");
    expect(after.value("form-8582.1.part5.row_2_col_a_net_income")).toBe(2000);
    expect(after.value("form-8582.0.line.3_combined")).toBe(-1000);
    expect(after.value("form-8582.1.part8.row_1_col_c_allowed_loss")).toBe(2000);
    expect(after.value("schedule-e.0.line.25_losses")).toBe(31000);
    expect(after.value("schedule-e.1.line.28_row_a_col_h_passive_income")).toBe(2000);
    expect(after.value("schedule-e.1.line.41_total_income_or_loss")).toBe(-29000);
  });
});

describe("a holding that ended (bayle)", () => {
  const sold = run(bayleScenario);
  const kept = run(
    bayleScenario,
    editHoldings(bayleScenario.facts, (holding) => ({
      ...holding,
      disposedOfEntirely: false,
      gainOnDisposition: undefined,
    })).map((fact) =>
      fact.category === "k1" && !isK1HoldingFactKey(fact.key)
        ? { ...fact, value: { ...(fact.value as PartnershipK1FactValue), finalK1: false } }
        : fact,
    ),
  );

  it("releases the carried passive loss in full, off Form 8582, on its own PYA row", () => {
    expect(sold.files("form-8582")).toBe(false);
    expect(sold.value("schedule-e.1.line.28_row_a_col_g_passive_loss_allowed")).toBe(6000);
    expect(sold.value("schedule-e.1.line.28_row_b_col_a_name")).toBe("PYA Snow Goose Shipping LP");
    expect(sold.value("schedule-e.1.line.28_row_b_col_g_passive_loss_allowed")).toBe(9000);
    expect(sold.value("schedule-e.1.line.28_row_a_col_i_nonpassive_loss_allowed")).toBeUndefined();
    expect(sold.value("schedule-e.1.line.32_total_partnership_s_corp_income")).toBe(-15000);
    expect(sold.value("schedule-e.1.line.27_yes")).toBe(true);
  });

  /*
   * irs-8960-inst-2025::sec::disposition-of-entire-interest::b01: "If you
   * dispose of an activity that's always been a passive activity, the
   * suspended passive losses from that activity are allowed in full as a
   * properly allocable deduction." The released losses stay in NII: line 4a
   * takes them with Schedule 1 line 5, and line 4b does not take them out.
   */
  it("keeps the released passive losses in net investment income (no line 4b adjustment)", () => {
    const highWages = run(
      bayleScenario,
      bayleScenario.facts.map((fact) =>
        fact.category === "wages"
          ? { ...fact, value: { ...(fact.value as object), box1: 260000, box5: 260000 } }
          : fact,
      ),
    );
    expect(highWages.files("form-8960")).toBe(true);
    expect(highWages.value("form-8960.0.line.4a")).toBe(-15000);
    expect(highWages.value("form-8960.0.line.4b")).toBeUndefined();
    expect(highWages.value("form-8960.0.line.5a")).toBe(4000);
    expect(highWages.value("form-8960.0.line.8")).toBe(-11000);
  });

  it("holds every loss back on Form 8582 while the interest is still held", () => {
    expect(kept.files("form-8582")).toBe(true);
    expect(kept.value("form-8582.1.part5.row_1_col_b_net_loss")).toBe(6000);
    expect(kept.value("form-8582.1.part5.row_1_col_c_unallowed_loss")).toBe(9000);
    expect(kept.value("form-8582.1.part8.row_1_col_c_allowed_loss")).toBe(0);
    expect(kept.value("schedule-e.1.line.28_row_a_col_g_passive_loss_allowed")).toBeUndefined();
    expect(kept.value("schedule-e.1.line.27_no")).toBe(true);
  });
});

describe("partnership items the engine does not handle are named", () => {
  const withBox = (box: { box: string; code?: string; amount: number }) =>
    run(
      tamScenario,
      tamScenario.facts.map((fact) =>
        fact.category === "k1" && !isK1HoldingFactKey(fact.key)
          ? {
              ...fact,
              value: {
                ...(fact.value as PartnershipK1FactValue),
                boxes: [...(fact.value as PartnershipK1FactValue).boxes, box],
              },
            }
          : fact,
      ),
    );

  it.each([
    [
      { box: "14", code: "A", amount: 5000 },
      "net earnings (loss) from self-employment (box 14 code A)",
    ],
    [{ box: "7", amount: 300 }, "royalties (box 7)"],
    [{ box: "10", amount: 800 }, "net section 1231 gain (loss) (box 10)"],
    [{ box: "12", amount: 700 }, "section 179 deduction (box 12)"],
  ])("%o makes Schedule E line 41 a gap that names it", (box, named) => {
    const line41 = withBox(box).field("schedule-e.1.line.41_total_income_or_loss");
    expect(line41?.ok).toBe(false);
    if (line41 && !line41.ok) {
      expect(line41.reason).toContain("Two Rivers Timber Fund LP (partnership K-1)");
      expect(line41.reason).toContain(named);
    }
  });

  it("puts guaranteed payments in column (k), and makes Form 8960 line 4b a gap", () => {
    const paid = withBox({ box: "4a", amount: 5000 });
    // irs-1040se-inst-2025::sec::line-28::b01: a related item on a separate line, described.
    expect(paid.value("schedule-e.1.line.28_row_a_col_h_passive_income")).toBe(40000);
    expect(paid.value("schedule-e.1.line.28_row_a_col_k_nonpassive_income")).toBeUndefined();
    expect(paid.value("schedule-e.1.line.28_row_b_col_a_name")).toBe(
      "Two Rivers Timber Fund LP, guaranteed payments",
    );
    expect(paid.value("schedule-e.1.line.28_row_b_col_k_nonpassive_income")).toBe(5000);
    expect(paid.value("schedule-e.1.line.32_total_partnership_s_corp_income")).toBe(45000);
    const line4b = paid.field("form-8960.0.line.4b");
    expect(line4b?.ok).toBe(false);
    if (line4b && !line4b.ok) expect(line4b.reason).toContain("guaranteed payments");
  });

  it("makes Schedule 3 line 1 a gap for box 21 foreign taxes: the credit needs Schedule K-3", () => {
    const line1 = withBox({ box: "21", amount: 90 }).field("schedule-3.0.line.1");
    expect(line1?.ok).toBe(false);
    if (line1 && !line1.ok) expect(line1.reason).toContain("Schedule K-3");
  });
});
