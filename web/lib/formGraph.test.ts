import { describe, expect, it } from "vitest";
import {
  OUTSIDE_ID,
  graphHref,
  shortFieldId,
  splitByJurisdiction,
  tier1Only,
  type FormNode,
  type MissingFormNode,
} from "./formGraph";

const link = (source: string, reader: string) => ({ source, reader });

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
    section: "income",
    rank: 0,
    tier1: false,
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
    section: "credits",
    tier1: false,
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

  it("keeps a tier 1 form that the engine lacks when no form waits for it", () => {
    const [part] = splitByJurisdiction({
      forms: [form("1040", "Federal 2025")],
      edges: [],
      missing: [
        {
          ...lacks("form-7203", "Federal 2025", "1040"),
          tier1: true,
          waiting: [],
          waitingCount: 0,
        },
      ],
    });
    expect(part.missing.map((node) => node.formId)).toEqual(["form-7203"]);
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

describe("tier1Only", () => {
  const form = (formId: string, tier1: boolean): FormNode => ({
    formId,
    displayName: formId,
    jurisdiction: "Federal 2025",
    section: "income",
    rank: 0,
    tier1,
    scenarios: [],
    fieldCount: 0,
    states: { verified: 0, locked: 0, not_run: 0, unsupported: 0 },
    reads: [],
    feeds: [],
  });
  const lacks = (formId: string, tier1: boolean, waits: string[]): MissingFormNode => ({
    formId,
    displayName: formId,
    about: "",
    jurisdiction: "Federal 2025",
    section: "credits",
    tier1,
    waiting: waits.map((waitingForm) => ({ formId: waitingForm, fieldIds: [] })),
    waitingCount: waits.length,
    feeds: 0,
  });
  const outside = {
    formId: OUTSIDE_ID,
    displayName: "State return",
    jurisdiction: "California 2025",
    formCount: 2,
  } as const;
  const part = {
    jurisdiction: "Federal 2025",
    forms: [form("1040", true), form("schedule-1", true), form("schedule-f", false)],
    links: [link("schedule-1", "1040"), link("schedule-f", "schedule-1"), link("1040", OUTSIDE_ID)],
    outside,
    missing: [
      lacks("form-8824", true, ["schedule-f", "1040"]),
      lacks("form-3468", false, ["1040"]),
    ],
  };

  it("keeps the tier 1 forms and the links between them", () => {
    const shown = tier1Only(part);
    expect(shown.forms.map((node) => node.formId)).toEqual(["1040", "schedule-1"]);
    expect(shown.links).toEqual([link("schedule-1", "1040"), link("1040", OUTSIDE_ID)]);
    expect(shown.outside).toBe(outside);
  });

  it("keeps a tier 1 form that the engine lacks, with only the waiting forms still drawn", () => {
    expect(tier1Only(part).missing).toMatchObject([
      { formId: "form-8824", waiting: [{ formId: "1040" }] },
    ]);
  });

  it("drops the box for the other return when no tier 1 form reads across", () => {
    const shown = tier1Only({ ...part, links: [link("schedule-f", OUTSIDE_ID)] });
    expect(shown.outside).toBeUndefined();
  });
});

describe("graphHref", () => {
  it("is the page with no query when nothing is chosen", () => {
    expect(graphHref({})).toBe("/library/graph");
  });

  it("names the view, the form and the tier 1 filter", () => {
    expect(graphHref({ view: "california-2025", tier1: true })).toBe(
      "/library/graph?view=california-2025&tier=1",
    );
    expect(graphHref({ form: "form-8582", tier1: false })).toBe("/library/graph?form=form-8582");
  });
});
