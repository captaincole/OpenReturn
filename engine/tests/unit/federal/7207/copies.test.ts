/*
 * One facility's Form 7207: Part I, the gaps the engine names (a section 48C
 * project at the facility, an inverter on the wrong line, more than 49
 * vessels), the elections and the passive column on Form 3800.
 */

import { describe, expect, it } from "vitest";
import { facilityCopy } from "../../../../src/federal/7207/copies.js";
import { form7207CreditSources } from "../../../../src/federal/7207/form3800.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import {
  PLANT,
  PLANT_ADDRESS,
  PLANT_KEY,
  bran,
  evaluate,
  isGap,
  section48cProperty,
  vessel,
  withPlant,
} from "./fixtures.js";

type Plant = typeof PLANT;

const copyFor = (plant: Plant, extra = [] as typeof bran.facts) => {
  const inputs = makeResolverInputs({
    facts: [...withPlant(plant), ...extra],
    decisions: bran.decisions,
  });
  return facilityCopy(inputs, { key: PLANT_KEY, value: plant });
};

const sourceFor = (plant: Plant) => {
  const inputs = makeResolverInputs({ facts: withPlant(plant), decisions: bran.decisions });
  return form7207CreditSources(inputs)[0]!.credit;
};

const LINE_8A = "1.line.8a_total_credit";

describe("Part I", () => {
  it("prints the registration number, the date, the address, the coordinates and both answers", () => {
    const { cells } = copyFor(PLANT);
    expect(cells["0.part1.1_facility_registration_number"]).toBe("AMP-25-0007207");
    expect(cells["0.part1.2_facility_placed_in_service_date"]).toBe("09/13/2021");
    expect(cells["0.part1.3a_facility_address"]).toBe(PLANT_ADDRESS);
    expect(cells["0.part1.3b_owner_name"]).toBeUndefined();
    expect(cells["0.part1.4_latitude_sign"]).toBe("+");
    expect(cells["0.part1.4_latitude_degrees"]).toBe("32");
    expect(cells["0.part1.4_latitude_decimal"]).toBe("534871");
    expect(cells["0.part1.4_longitude_sign"]).toBe("-");
    expect(cells["0.part1.4_longitude_degrees"]).toBe("094");
    expect(cells["0.part1.4_longitude_decimal"]).toBe("351562");
    expect(cells["0.part1.5_section_45x_a3b_election_no"]).toBe(true);
    expect(cells["0.part1.6_section_48c_facility_no"]).toBe(true);
  });

  it("with no election, line 1 is blank", () => {
    const { cells } = copyFor({ ...PLANT, transfer: undefined });
    expect(cells["0.part1.1_facility_registration_number"]).toBeUndefined();
  });
});

describe("a section 48C project (line-6::b01)", () => {
  it("at the same address with line 6 No: line 8a and Form 3800 line 1b are gaps", () => {
    const run = evaluate([...bran.facts, section48cProperty(PLANT_ADDRESS.toUpperCase())]);
    expect(run.files("form-3468")).toBe(true);
    expect(isGap(run.field("form-7207", LINE_8A))).toBe(true);
    expect(isGap(run.field("form-3800", "2.part3.1b_form_7207_col_e"))).toBe(true);
  });

  it("line 6 Yes: the stated sales leave the project's components out, so no gap", () => {
    const copy = copyFor({ ...PLANT, section48cProperty: true }, [
      section48cProperty(PLANT_ADDRESS),
    ]);
    expect(copy.total).toBe(203_365);
    expect(copy.cells["0.part1.6_section_48c_facility_yes"]).toBe(true);
  });

  it("at another address: no gap", () => {
    const copy = copyFor(PLANT, [section48cProperty("9 Other Road, Tyler, TX 75701")]);
    expect(copy.total).toBe(203_365);
  });

  it("with no address on the project: the facts cannot tell, a gap", () => {
    expect(isGap(copyFor(PLANT, [section48cProperty(undefined)]).total)).toBe(true);
  });
});

describe("the gaps of a row", () => {
  it("an inverter whose capacity does not fit its line is a gap on the row and on line 8a", () => {
    const misplaced = {
      ...PLANT,
      capacitySales: {
        ...PLANT.capacitySales,
        central_inverter: [{ count: 1, capacityEach: 1_000_000 }],
      },
    };
    const { cells, total } = copyFor(misplaced);
    expect(isGap(cells["1.line.3a_central_inverter_col_d"])).toBe(true);
    expect(isGap(cells["1.line.3a_central_inverter_col_e"])).toBe(true);
    expect(isGap(total)).toBe(true);
  });

  it("each inverter range edge: 20 kW is commercial and residential, 650 W a microinverter", () => {
    const edges = {
      ...PLANT,
      capacitySales: {
        commercial_inverter: [{ count: 1, capacityEach: 20_000 }],
        residential_inverter: [{ count: 1, capacityEach: 20_000 }],
        microinverter: [{ count: 1, capacityEach: 650 }],
        utility_inverter: [{ count: 1, capacityEach: 1_000_000 }],
      },
    };
    expect(isGap(copyFor(edges).total)).toBe(false);
    const over = { ...PLANT, capacitySales: { microinverter: [{ count: 1, capacityEach: 651 }] } };
    expect(isGap(copyFor(over).total)).toBe(true);
  });

  it("more than 49 vessels need another Part III: the total is a gap", () => {
    const vessels = Array.from({ length: 50 }, (_, index) => vessel(index + 1, false));
    const { cells } = copyFor({ ...PLANT, vessels });
    expect(cells["2.part3.row49_vessel_name"]).toBe("Vessel 49");
    expect(isGap(cells["2.part3.total_sales_prices"])).toBe(true);
    expect(isGap(cells["0.part2.2a_offshore_wind_vessel_col_e"])).toBe(true);
  });

  it("line 6b is blank: metallurgical coal does not count for a 2025 calendar year", () => {
    const { cells } = copyFor(PLANT);
    expect(cells["1.line.6b_metallurgical_coal_col_d"]).toBeUndefined();
    expect(cells["1.line.6b_metallurgical_coal_col_e"]).toBeUndefined();
  });

  it("a facility with no sales prints no Part II row and no line 8a", () => {
    const empty: Plant = {
      ...PLANT,
      capacitySales: undefined,
      unitSales: undefined,
      batterySales: undefined,
      electrodeActiveMaterialCosts: undefined,
      vessels: undefined,
      criticalMineralCosts: undefined,
    };
    const copy = copyFor(empty);
    expect(copy.total).toBeUndefined();
    expect(copy.cells["0.part2.1a_thin_film_pv_cell_col_e"]).toBeUndefined();
  });
});

describe("Form 3800 line 1b", () => {
  it("a transfer goes to column (f); more than the credit is a gap", () => {
    expect(sourceFor(PLANT).transfer?.amount).toBe(50_000);
    const tooMuch = { ...PLANT, transfer: { ...PLANT.transfer!, amount: 203_366 } };
    expect(isGap(sourceFor(tooMuch).amount)).toBe(true);
  });

  it("a purchased credit, or both elections, is a gap", () => {
    const purchased = {
      ...PLANT,
      transfer: { ...PLANT.transfer!, direction: "purchased" as const },
    };
    expect(isGap(sourceFor(purchased).amount)).toBe(true);
    const both = { ...PLANT, electivePayment: { registrationNumber: "AMP-EPE" } };
    expect(isGap(sourceFor(both).amount)).toBe(true);
  });

  it("an elective payment is for the whole credit; columns (h) and (j) stay gaps on Form 3800", () => {
    const elected = {
      ...PLANT,
      transfer: undefined,
      electivePayment: { registrationNumber: "AMP-EPE-1" },
    };
    expect(sourceFor(elected).electivePayment).toEqual({
      registrationNumber: "AMP-EPE-1",
      amount: 203_365,
    });
    const run = evaluate(withPlant(elected));
    expect(run.value("form-7207", "0.part1.1_facility_registration_number")).toBe("AMP-EPE-1");
    expect(isGap(run.field("form-3800", "2.part3.1b_form_7207_col_h"))).toBe(true);
  });

  it("a passive facility goes to column (d)", () => {
    const passive = {
      ...PLANT,
      transfer: undefined,
      passive: true,
      passiveActivity: { name: "Marshall plant", rentalRealEstate: false },
    };
    const run = evaluate(withPlant(passive));
    expect(run.value("form-3800", "2.part3.1b_form_7207_col_d")).toBe(203_365);
    expect(run.files("form-8582-cr")).toBe(true);
  });
});
