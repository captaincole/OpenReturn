import { describe, expect, it } from "vitest";
import {
  OUTSIDE_ID,
  layoutForms,
  orderForms,
  shortFieldId,
  splitByJurisdiction,
  type FormNode,
  type MissingFormNode,
} from "./formGraph";

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

describe("splitByJurisdiction", () => {
  const form = (formId: string, jurisdiction: string): FormNode => ({
    formId,
    displayName: formId,
    jurisdiction,
    scenarios: [],
    fieldCount: 0,
    states: { verified: 0, locked: 0, not_run: 0, unsupported: 0 },
    reads: [],
    feeds: [],
  });
  const edge = (source: string, reader: string) => ({ source, reader, fields: [] });
  const lacks = (formId: string, jurisdiction: string, waits: string): MissingFormNode => ({
    formId,
    displayName: formId,
    about: "",
    jurisdiction,
    waiting: [{ formId: waits, fieldIds: [] }],
    waitingCount: 1,
    feeds: 0,
  });
  const [federal, california] = splitByJurisdiction({
    forms: [
      form("540", "California 2025"),
      form("schedule-ca", "California 2025"),
      form("1040", "Federal 2025"),
      form("schedule-1", "Federal 2025"),
    ],
    edges: [
      edge("schedule-1", "1040"),
      edge("1040", "540"),
      edge("1040", "schedule-ca"),
      edge("schedule-1", "schedule-ca"),
      edge("schedule-ca", "540"),
    ],
    missing: [
      lacks("form-1116", "Federal 2025", "1040"),
      lacks("form-4797", "Federal 2025", "schedule-ca"),
      lacks("schedule-s", "California 2025", "540"),
    ],
  });

  it("puts the federal graph first, with one box for every state form", () => {
    expect(federal.forms.map((node) => node.formId)).toEqual(["1040", "schedule-1"]);
    expect(federal.links).toEqual([
      link("schedule-1", "1040"),
      link("1040", OUTSIDE_ID),
      link("schedule-1", OUTSIDE_ID),
    ]);
    expect(federal.outside).toMatchObject({
      displayName: "State return",
      jurisdiction: "California 2025",
      formCount: 2,
    });
  });

  it("gives the state graph one box for the federal forms", () => {
    expect(california.links).toEqual([
      link(OUTSIDE_ID, "540"),
      link(OUTSIDE_ID, "schedule-ca"),
      link("schedule-ca", "540"),
    ]);
    expect(california.outside?.displayName).toBe("Federal return");
  });

  it("keeps a missing form with the graph of its jurisdiction that waits for it", () => {
    expect(federal.missing.map((node) => node.formId)).toEqual(["form-1116"]);
    expect(california.missing.map((node) => node.formId)).toEqual(["schedule-s"]);
  });

  it("has no box when no form reads across", () => {
    const [alone] = splitByJurisdiction({
      forms: [form("1040", "Federal 2025")],
      edges: [],
      missing: [],
    });
    expect(alone.outside).toBeUndefined();
  });
});
