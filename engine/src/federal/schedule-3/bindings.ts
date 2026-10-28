import { defineForm } from "../../defineForm.js";
import { sum } from "../../money.js";
import { SSN } from "../../values.js";
import type { Schedule3FilingInfo } from "./filingInfo.js";
import type { Schedule3 } from "./types.js";

const NO_SCENARIO = "No scenario uses this credit or payment yet.";

export function register(): void {
  defineForm<Schedule3, Schedule3FilingInfo>("schedule-3", {
    bindings: {
      "0.header.name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      "0.line.5b": (f) => {
        const v = f["form-5695.3.line.32"];
        return typeof v === "number" ? v : undefined;
      },
      "0.line.7": (f) => {
        const parts = [
          f["0.line.6a"],
          f["0.line.6b"],
          f["0.line.6c"],
          f["0.line.6d"],
          f["0.line.6f"],
          f["0.line.6g"],
          f["0.line.6h"],
          f["0.line.6i"],
          f["0.line.6j"],
          f["0.line.6k"],
          f["0.line.6l"],
          f["0.line.6m"],
          f["0.line.6z_amount"],
        ];
        return parts.every((v) => v === undefined) ? undefined : sum(...parts);
      },
      "0.line.8": (f) => {
        const parts = [
          f["0.line.1"],
          f["0.line.2"],
          f["0.line.3"],
          f["0.line.4"],
          f["0.line.5a"],
          f["0.line.5b"],
          f["0.line.7"],
        ];
        return parts.every((v) => v === undefined) ? undefined : sum(...parts);
      },
    },

    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      "0.line.1": "Foreign tax credit (Form 1116): no scenario has foreign tax paid yet.",
      "0.line.2": "Child and dependent care credit (Form 2441): no scenario has dependents yet.",
      "0.line.3": "Education credits (Form 8863): no scenario yet.",
      "0.line.4": "Retirement savings contributions credit (Form 8880): no scenario yet.",
      "0.line.5a": "Residential clean energy credit (Form 5695 Part I) is not modeled.",
      "0.line.6a": NO_SCENARIO,
      "0.line.6b": NO_SCENARIO,
      "0.line.6c": NO_SCENARIO,
      "0.line.6d": NO_SCENARIO,
      "0.line.6e": "Reserved for future use.",
      "0.line.6f": NO_SCENARIO,
      "0.line.6g": NO_SCENARIO,
      "0.line.6h": NO_SCENARIO,
      "0.line.6i": NO_SCENARIO,
      "0.line.6j": NO_SCENARIO,
      "0.line.6k": NO_SCENARIO,
      "0.line.6l": NO_SCENARIO,
      "0.line.6m": NO_SCENARIO,
      "0.line.6z_description": NO_SCENARIO,
      "0.line.6z_amount": NO_SCENARIO,
      "0.line.9": "Net premium tax credit (Form 8962): no Marketplace coverage scenario yet.",
      "0.line.10": "Extension payment: no estimated or extension payment facts yet.",
      "0.line.11":
        "Excess social security tax withheld (two or more employers): no scenario reaches the wage base yet.",
      "0.line.12": NO_SCENARIO,
      "0.line.13a": NO_SCENARIO,
      "0.line.13b": NO_SCENARIO,
      "0.line.13c": NO_SCENARIO,
      "0.line.13d": NO_SCENARIO,
      "0.line.13z_description": NO_SCENARIO,
      "0.line.13z_amount": NO_SCENARIO,
      "0.line.14": "Total of lines 13a–13z, which are not modeled.",
      "0.line.15": "Total of lines 9–14, which are not modeled.",
    },

    todos: {},
  });
}
