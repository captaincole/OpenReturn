/*
 * Form 5695 must-file and the home answers it asks for.
 */

import { describe, expect, it } from "vitest";
import {
  HOME_ENERGY_KEYS,
  makeEnergyInvoiceFactKey,
  type EnergyImprovementItem,
} from "../../../../../src/engine/facts/index.js";
import { resolve5695Info } from "../../../../../src/engine/federal/5695/resolveInfo.js";
import { makeResolverInputs } from "../../../../../src/engine/resolverInputs.js";

function resolve(items: EnergyImprovementItem[]) {
  const facts = [
    {
      key: makeEnergyInvoiceFactKey("test-vendor-1"),
      category: "home_energy",
      value: { vendorName: "Test Vendor", items },
    },
  ];
  const info = resolve5695Info(makeResolverInputs({ facts, decisions: [] }));
  return {
    mustFile: info.mustFile?.["form-5695"]?.value,
    missing: info.missingInputs?.["form-5695"],
  };
}

describe("Form 5695 must-file", () => {
  it("files and asks the four home questions for a door", () => {
    expect(resolve([{ kind: "exterior_door", cost: 800 }])).toEqual({
      mustFile: true,
      missing: [
        HOME_ENERGY_KEYS.mainHomeInUs,
        HOME_ENERGY_KEYS.originalUser,
        HOME_ENERGY_KEYS.lastsFiveYears,
        HOME_ENERGY_KEYS.newConstruction,
      ],
    });
  });

  it("asks only lines 21a and 21b for Section B property", () => {
    expect(resolve([{ kind: "heat_pump", cost: 6000 }]).missing).toEqual([
      HOME_ENERGY_KEYS.mainHomeInUs,
      HOME_ENERGY_KEYS.originalUser,
    ]);
  });

  it("does not file or ask for an invoice with no items", () => {
    expect(resolve([])).toEqual({ mustFile: false, missing: [] });
  });
});
