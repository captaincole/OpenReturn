import { describe, expect, it } from "vitest";
import { CARD, MAX_WIDTH, drawLanes, lanesOf, linkPath, rowsFor } from "./formGraphLayout";

describe("lanesOf", () => {
  const { main, lanes } = lanesOf([
    { formId: "schedule-b", section: "income", rank: 1 },
    { formId: "form-1116", section: "credits" },
    { formId: "schedule-3", section: "credits", rank: 0 },
    { formId: "form-1040", section: "main", rank: 0 },
    { formId: "schedule-1", section: "income", rank: 0 },
    { formId: "form-0000", section: "not a section", rank: 0 },
  ]);

  it("finds the main form", () => {
    expect(main).toBe("form-1040");
  });

  it("makes one lane for each section that has a form, in the order of the return", () => {
    expect(lanes.map((lane) => lane.section)).toEqual(["income", "credits", "other"]);
  });

  it("orders a lane by rank, with a form that has no rank last", () => {
    expect(lanes[0].formIds).toEqual(["schedule-1", "schedule-b"]);
    expect(lanes[1].formIds).toEqual(["schedule-3", "form-1116"]);
  });
});

describe("drawLanes", () => {
  const seven = ["a", "b", "c", "d", "e", "f", "g"];
  const drawing = drawLanes(
    "form-1040",
    [
      { section: "income", formIds: seven },
      { section: "tax", formIds: ["schedule-2"] },
    ],
    { formId: "other-return", side: "right" },
  );
  const at = (formId: string) => drawing.slots.find((slot) => slot.formId === formId);

  it("puts the main form above the lanes, at the center", () => {
    const main = at("form-1040");
    expect(main?.y).toBeLessThan(drawing.lanes[0].y);
    expect((main?.x ?? 0) + CARD.width / 2).toBe(drawing.width / 2);
  });

  it("puts the box of the other return at the side of the main form", () => {
    expect(at("other-return")?.y).toBe(at("form-1040")?.y);
    expect(at("other-return")?.x).toBeGreaterThan((at("form-1040")?.x ?? 0) + CARD.width);
  });

  it("fills a lane of more forms than rows in two columns, each row from the left", () => {
    expect(at("b")?.y).toBe(at("a")?.y);
    expect(at("b")?.x).toBeGreaterThan(at("a")?.x ?? 0);
    expect(at("c")?.x).toBe(at("a")?.x);
    expect(at("c")?.y).toBeGreaterThan(at("a")?.y ?? 0);
  });

  it("keeps each form inside its lane", () => {
    const [income, tax] = drawing.lanes;
    expect(income.x + income.width).toBeLessThan(tax.x);
    expect(at("schedule-2")?.x).toBeGreaterThan(tax.x);
    expect((at("g")?.y ?? 0) + CARD.height).toBeLessThan(income.y + income.height);
  });

  it("draws one line to each lane", () => {
    expect(drawing.trunk).toHaveLength(2 + drawing.lanes.length);
  });
});

describe("rowsFor", () => {
  const lane = (section: string, count: number) => ({
    section,
    formIds: Array.from({ length: count }, (_, index) => `${section}-${index}`),
  });

  it("uses four rows when the lanes fit", () => {
    expect(rowsFor([lane("income", 7), lane("tax", 2)], MAX_WIDTH)).toBe(4);
  });

  it("adds rows, not width, for 200 forms", () => {
    const lanes = [
      lane("income", 80),
      lane("deductions", 30),
      lane("tax", 40),
      lane("credits", 50),
    ];
    const drawing = drawLanes("form-1040", lanes);
    expect(rowsFor(lanes, MAX_WIDTH)).toBeGreaterThan(4);
    expect(drawing.width).toBeLessThanOrEqual(MAX_WIDTH);
    expect(drawing.slots).toHaveLength(201);
  });
});

describe("linkPath", () => {
  it("ends with a straight part into the bottom of a form above", () => {
    expect(linkPath({ x: 300, y: 300 }, { x: 0, y: 0 }).endsWith(`V ${CARD.height}`)).toBe(true);
  });

  it("ends with a straight part into the side of a form in the next row", () => {
    const path = linkPath({ x: 300, y: 52 }, { x: 0, y: 0 });
    expect(path.endsWith(`H ${CARD.width}`)).toBe(true);
  });

  it("goes over the row to the top of a form in the same row", () => {
    expect(linkPath({ x: 0, y: 100 }, { x: 300, y: 100 }).endsWith("V 100")).toBe(true);
  });
});
