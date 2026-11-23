import { describe, expect, it } from "vitest";
import type {
  K1FactValue,
  K1Form,
  K1HoldingFactValue,
  Section199AStatement,
} from "../../../../src/facts/index.js";
import { rowFor, type BoxRow } from "../../../../src/federal/passThrough/boxTable.js";
import { labelOf } from "../../../../src/federal/passThrough/itemTypes.js";
import {
  BOX_TABLES,
  itemsOf,
  type PassThroughEntity,
} from "../../../../src/federal/passThrough/items.js";
import { routeEntities, routeOf } from "../../../../src/federal/passThrough/routing.js";
import { passThroughGaps } from "../../../../src/federal/schedule-e/partII.js";

const FORMS: K1Form[] = ["1120-S", "1065", "1041"];

const STATEMENT: Section199AStatement = {
  qualifiedBusinessIncome: 1000,
  w2Wages: 0,
  qualifiedPropertyUbia: 0,
  specifiedService: false,
};

/* A K-1 holding one box of the row, its owner a material participant. */
function entityFor(form: K1Form, row: BoxRow, amount: number): PassThroughEntity {
  const k1 = {
    form,
    entityName: `Row ${row.box} ${row.code ?? ""} Co.`,
    entityEin: "00-0000000",
    boxes: [{ box: row.box, code: row.code, amount }],
    ...(row.type === "section_199a_information" ? { section199A: STATEMENT } : {}),
  } as K1FactValue;
  const holding: K1HoldingFactValue = {
    owner: "taxpayer",
    materiallyParticipated: true,
    stockBasisAtStart: 50000,
    allInvestmentAtRisk: true,
  };
  const key = `k1.test.${row.box}${row.code ?? ""}`;
  return {
    key,
    holdingKey: "k1.holding.test",
    form,
    name: k1.entityName,
    ein: k1.entityEin,
    k1,
    holding,
    items: itemsOf(key, k1),
    priorYearItems: [],
  };
}

const CONTEXT = {
  filingStatus: "single" as const,
  otherBusinessLosses: { scheduleCLosses: 0, rentalLosses: 0, unknownKeys: [] },
};

const gapInfo = (entity: PassThroughEntity) => ({
  passThroughEntities: [entity],
  passThroughLimitContext: CONTEXT,
});

const rowName = (form: K1Form, row: BoxRow) =>
  `${form} box ${row.box}${row.code ? ` code ${row.code}` : ""} (${row.type})`;

const cases = FORMS.flatMap((form) =>
  BOX_TABLES[form].map((row) => ({ form, row, name: rowName(form, row) })),
);

describe("every row of the three K-1 box tables is routed or reported", () => {
  it.each(cases)("$name", ({ form, row }) => {
    for (const amount of [1000, -1000]) {
      const entity = entityFor(form, row, amount);
      const [routed] = routeEntities([entity], CONTEXT);
      // A full holding never leaves a single box waiting.
      expect(routed.kind).not.toBe("waiting");
      if (routed.kind === "routed") {
        // Only a row with a route, and only an amount the limits let through.
        expect(routeOf(form, row.type)).toBeDefined();
        expect(passThroughGaps(gapInfo(entity))).toEqual([]);
        continue;
      }
      // Reported: line 41's reason names the entity and the item type.
      const gaps = passThroughGaps(gapInfo(entity));
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps.join(" ")).toContain(entity.name);
      expect(gaps.join(" ")).toContain(labelOf(row.type));
    }
  });
});

describe("the box tables", () => {
  it.each(FORMS)("%s lists each box and code once, with a caption", (form) => {
    const seen = new Set<string>();
    for (const row of BOX_TABLES[form]) {
      const id = `${row.box}/${row.code ?? ""}`;
      expect(seen.has(id), id).toBe(false);
      seen.add(id);
      expect(row.label.length).toBeGreaterThan(0);
      expect(row.type).not.toBe("not_modeled");
    }
  });

  it("maps a box or code the table does not know to not_modeled, never to nothing", () => {
    expect(rowFor(BOX_TABLES["1120-S"], "17", "W").type).toBe("not_modeled");
    expect(rowFor(BOX_TABLES["1041"], "14", "A").type).toBe("not_modeled");
    expect(rowFor(BOX_TABLES["1065"], "99", undefined).label).toBe("box 99");
  });

  it("knows a box number only through the tables: the same box means different items", () => {
    expect(rowFor(BOX_TABLES["1120-S"], "1", undefined).type).toBe("ordinary_business_income");
    expect(rowFor(BOX_TABLES["1041"], "1", undefined).type).toBe("interest");
    expect(rowFor(BOX_TABLES["1120-S"], "13", "A").type).toBe("credit");
    expect(rowFor(BOX_TABLES["1065"], "13", "A").type).toBe("charitable_contribution");
  });

  it("routes an S corporation's income, portfolio and basis items, gross receipts, and a trust's income items", () => {
    const routedRows = cases.filter(({ form, row }) => routeOf(form, row.type) !== undefined);
    expect(routedRows.map(({ name }) => name)).toEqual([
      "1120-S box 1 (ordinary_business_income)",
      "1120-S box 4 (interest)",
      "1120-S box 5a (ordinary_dividends)",
      "1120-S box 5b (qualified_dividends)",
      "1120-S box 7 (net_short_term_capital_gain)",
      "1120-S box 8a (net_long_term_capital_gain)",
      "1120-S box 12 code A (charitable_contribution)",
      "1120-S box 12 code B (charitable_contribution)",
      "1120-S box 12 code C (charitable_contribution)",
      "1120-S box 12 code D (charitable_contribution)",
      "1120-S box 12 code E (charitable_contribution)",
      "1120-S box 12 code F (charitable_contribution)",
      "1120-S box 12 code G (charitable_contribution)",
      "1120-S box 16 code A (tax_exempt_interest)",
      "1120-S box 16 code B (other_tax_exempt_income)",
      "1120-S box 16 code C (nondeductible_expenses)",
      "1120-S box 16 code D (distribution)",
      "1120-S box 17 code V (section_199a_information)",
      "1120-S box 17 code AC (gross_receipts_448c)",
      "1065 box 20 code AG (gross_receipts_448c)",
      "1041 box 1 (interest)",
      "1041 box 2a (ordinary_dividends)",
      "1041 box 2b (qualified_dividends)",
      "1041 box 3 (net_short_term_capital_gain)",
      "1041 box 4a (net_long_term_capital_gain)",
      "1041 box 4b (collectibles_gain)",
      "1041 box 4c (unrecaptured_section_1250_gain)",
      "1041 box 5 (other_portfolio_income)",
      "1041 box 6 (ordinary_business_income)",
      "1041 box 7 (net_rental_real_estate_income)",
      "1041 box 8 (other_net_rental_income)",
      "1041 box 14 code B (foreign_tax_paid)",
      "1041 box 14 code H (net_investment_income)",
      "1041 box 14 code I (section_199a_information)",
    ]);
  });

  it("reports an unknown box by its box and code", () => {
    const row = rowFor(BOX_TABLES["1120-S"], "17", "W");
    const gaps = passThroughGaps(gapInfo(entityFor("1120-S", row, 500)));
    expect(gaps.join(" ")).toContain("box 17 code W");
  });
});
