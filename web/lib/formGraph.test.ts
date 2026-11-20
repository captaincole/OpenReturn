import { describe, expect, it } from "vitest";
import { layoutForms, orderForms, shortFieldId } from "./formGraph";

const link = (source: string, reader: string) => ({ source, reader });

describe("orderForms", () => {
  it("puts a form after the forms it reads", () => {
    const links = [link("w2", "1040"), link("1040", "540"), link("w2", "540")];
    expect(orderForms(["540", "1040", "w2"], links)).toEqual(["w2", "1040", "540"]);
  });

  it("ends when two forms read each other", () => {
    const links = [link("1040", "schedule-1"), link("schedule-1", "1040"), link("w2", "1040")];
    const order = orderForms(["1040", "schedule-1", "w2"], links);
    expect([...order].sort()).toEqual(["1040", "schedule-1", "w2"]);
    expect(order[0]).toBe("w2");
  });
});

describe("layoutForms", () => {
  const links = [link("b", "1040"), link("d", "1040"), link("1040", "540"), link("ghost", "540")];
  const layout = layoutForms(["b", "d", "1040", "540", "4562"], links);
  const at = (formId: string) => layout.placed.find((node) => node.formId === formId);

  it("gives each form a column to the right of the forms it reads", () => {
    expect(at("b")?.column).toBe(0);
    expect(at("d")?.column).toBe(0);
    expect(at("1040")?.column).toBe(1);
    expect(at("540")?.column).toBe(2);
    expect(layout.columns).toBe(3);
  });

  it("gives the forms of one column different rows", () => {
    expect([at("b")?.row, at("d")?.row].sort()).toEqual([0, 1]);
    expect(layout.rows).toBe(2);
  });

  it("sets apart a form with no read, and drops a link to a form it does not know", () => {
    expect(layout.alone).toEqual(["4562"]);
    expect(at("ghost")).toBeUndefined();
  });

  it("returns no columns when no form reads another", () => {
    expect(layoutForms(["a", "b"], [])).toEqual({
      placed: [],
      alone: ["a", "b"],
      columns: 0,
      rows: 0,
    });
  });
});

describe("shortFieldId", () => {
  it("drops the form from the field id", () => {
    expect(shortFieldId({ fieldId: "form-1040.line.11b", formId: "form-1040" })).toBe("line.11b");
  });
});
