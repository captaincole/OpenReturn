import { getNoncashGiftFacts, makeNoncashGiftFactKey } from "@openreturn/engine/facts";
import { describe, expect, it } from "vitest";
import { form1098CSkill } from "../../../../src/mastra/skills/form1098C.js";
import {
  vehicleDescription,
  vehicleGiftFrom,
  type Form1098CInput,
} from "../../../../src/mastra/tools/ingest1098C.js";

/* The boxes of the sample form (engine/tests/scenarios/documents/samples/1098-c-valley-wheels.pdf). */
const FORM: Form1098CInput = {
  donee: {
    name: "Valley Wheels for Charity",
    street: "418 Mission Ridge Rd",
    city: "Fresno",
    state: "CA",
    zip: "93721",
  },
  box1: "03/14/2025",
  box2a: "118,420",
  box2b: "2016",
  box2c: "Honda",
  box2d: "Accord",
  box3: "1SAMPLE2VEH000417",
  box4c: 2850,
  box5a: false,
  box5b: false,
  box6a: false,
};

const ANSWERS = {
  fairMarketValue: 4200,
  valuationMethod: "Catalog",
  condition: "fair condition",
  dateAcquired: "06/10/2016",
  howAcquired: "Purchase",
  costBasis: 21500,
};

describe("vehicleGiftFrom", () => {
  it("makes the noncash gift fact from the boxes and the answers", () => {
    const result = vehicleGiftFrom(FORM, ANSWERS);
    expect(result).toEqual({
      kind: "gift",
      giftSlug: "valley-wheels-for-charity-vehicle-2025-03-14",
      gift: {
        donee: FORM.donee,
        propertyType: "vehicle",
        description: "2016 Honda Accord, 118,420 miles, fair condition",
        contributionDate: "03/14/2025",
        dateAcquired: "06/10/2016",
        howAcquired: "Purchase",
        costBasis: 21500,
        fairMarketValue: 4200,
        valuationMethod: "Catalog",
        vehicle: {
          vin: "1SAMPLE2VEH000417",
          acknowledgmentAttached: true,
          grossProceeds: 2850,
          fmvException: false,
        },
      },
    });
  });

  it("writes a key the engine reads as a noncash gift", () => {
    const result = vehicleGiftFrom(FORM, ANSWERS);
    if (result.kind !== "gift") throw new Error("expected a gift");
    const key = makeNoncashGiftFactKey(result.giftSlug);
    const read = getNoncashGiftFacts([{ key, value: result.gift, category: "charitable" }]);
    expect(read.map((fact) => fact.gift.vehicle?.grossProceeds)).toEqual([2850]);
  });

  it("records nothing without the stated value and its method", () => {
    expect(vehicleGiftFrom(FORM, {})).toEqual({
      kind: "missing",
      missingAnswers: ["fairMarketValue", "valuationMethod"],
    });
    expect(vehicleGiftFrom(FORM, { fairMarketValue: 4200, valuationMethod: " " })).toEqual({
      kind: "missing",
      missingAnswers: ["valuationMethod"],
    });
  });

  it("reads box 5a or 5b as the exception that allows the fair market value", () => {
    const result = vehicleGiftFrom({ ...FORM, box4c: undefined, box5b: true }, ANSWERS);
    if (result.kind !== "gift") throw new Error("expected a gift");
    expect(result.gift.vehicle).toMatchObject({ fmvException: true, grossProceeds: undefined });
  });

  it("refuses a vehicle the donee gave goods or services for, unless only religious benefits", () => {
    expect(vehicleGiftFrom({ ...FORM, box6a: true }, ANSWERS).kind).toBe("unsupported");
    expect(vehicleGiftFrom({ ...FORM, box6a: true, box6c: true }, ANSWERS).kind).toBe("gift");
  });
});

describe("vehicleDescription", () => {
  it("leaves out the mileage a boat or airplane has none of", () => {
    const boat = { ...FORM, box2a: undefined, box2c: "Bayliner", box2d: "Element E16" };
    expect(vehicleDescription(boat, undefined)).toBe("2016 Bayliner Element E16");
  });
});

describe("form-1098-c skill", () => {
  it("names its tool for load_tool", () => {
    expect(form1098CSkill.skill.instructions).toContain('"ingest-1098-c"');
  });
});
