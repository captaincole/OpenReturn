import { describe, expect, it } from "vitest";
import { sectionOf } from "../../../scripts/formGraph/sections.js";
import { FORMS } from "../../../src/registry.js";

describe("sectionOf", () => {
  it("gives a form its section and its place in the section", () => {
    expect(sectionOf("form-1040")).toEqual({ section: "main", rank: 0 });
    expect(sectionOf("schedule-2")).toEqual({ section: "tax", rank: 0 });
    expect(sectionOf("schedule-b")).toEqual({ section: "income", rank: 1 });
  });

  it("puts a form on no list in the other section", () => {
    expect(sectionOf("form-0000")).toEqual({ section: "other", rank: 0 });
  });

  it("has a section for each form of the engine but Form 3532, Form 540NR, Schedule X and Form 540 2EZ", () => {
    const other = FORMS.filter((spec) => sectionOf(spec.formId).section === "other");
    expect(other.map((spec) => spec.formId)).toEqual([
      "form-3532",
      "form-540nr",
      "schedule-x",
      "form-540-2ez",
    ]);
  });
});
