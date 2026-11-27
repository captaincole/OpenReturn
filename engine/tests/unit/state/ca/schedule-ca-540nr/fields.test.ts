/*
 * Schedule CA (540NR): every field has a rule, the column D and E fields of
 * each line are the catalog's, and each field that runs Schedule CA (540)'s
 * rule maps to a Schedule CA (540) field.
 */

import { describe, expect, it } from "vitest";
import { bindingKind } from "../../../../../src/engine.js";
import { CA_STATED_AMOUNT_LINES } from "../../../../../src/facts/index.js";
import { registerAllForms } from "../../../../../src/registry.js";
import catalog from "../../../../../src/state/ca/schedule-ca-540nr/catalog.json";
import { fieldOf } from "../../../../../src/state/ca/schedule-ca-540nr/columns.js";
import { SCHEDULE_CA_FIELD_OF } from "../../../../../src/state/ca/schedule-ca-540nr/fromScheduleCa.js";
import scheduleCaCatalog from "../../../../../src/state/ca/schedule-ca/catalog.json";

const FORM = "schedule-ca-540nr.";
const fields = catalog.fields.map((field) => field.fieldId.slice(FORM.length));

describe("Schedule CA (540NR) fields", () => {
  it("every field is bound or unsupported", () => {
    registerAllForms();
    const missing = fields.filter((field) => bindingKind(`${FORM}${field}`) === undefined);
    expect(missing).toEqual([]);
  });

  it("each stated line and each total has its column D and E fields in the catalog", () => {
    const lines = [...CA_STATED_AMOUNT_LINES, "1z", "b9a", "b10", "c25", "c26", "c27"] as const;
    const absent = lines.flatMap((line) =>
      ["total_ca_law", "ca_amounts"]
        .map((column) => fieldOf(line, column))
        .filter((field) => !fields.includes(field)),
    );
    expect(absent).toEqual([]);
  });

  it("maps 252 fields to Schedule CA (540) fields that exist", () => {
    const scheduleCa = new Set(
      scheduleCaCatalog.fields.map((field) => field.fieldId.slice("schedule-ca.".length)),
    );
    expect(SCHEDULE_CA_FIELD_OF.size).toBe(252);
    expect([...SCHEDULE_CA_FIELD_OF.values()].filter((field) => !scheduleCa.has(field))).toEqual(
      [],
    );
  });

  it("maps Part III to Schedule CA (540) Part II", () => {
    expect(SCHEDULE_CA_FIELD_OF.get("3.part3.5a_taxes_subtractions")).toBe(
      "4.page2.taxes_5a_subtractions",
    );
    expect(SCHEDULE_CA_FIELD_OF.get("4.part3.30_itemized_or_standard_deduction")).toBe(
      "5.page2.total_itemized_30_standard_or_itemized",
    );
    expect(SCHEDULE_CA_FIELD_OF.get("1.line.b5_federal")).toBe("0.line.b5_federal");
  });
});
