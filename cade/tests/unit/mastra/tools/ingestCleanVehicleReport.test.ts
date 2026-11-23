import { isCleanVehicleFactKey } from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import {
  CleanVehicleReportSchema,
  cleanVehicleFactOf,
  isoDateOf,
} from "../../../../src/mastra/tools/ingestCleanVehicleReport.js";

const birgitte = await loadScenario("birgitte");
const elayne = await loadScenario("elayne");

const factIn = (facts: typeof birgitte.facts, key: string) =>
  facts.find((fact) => fact.key === key);

/* What Cade passes after reading birgitte's docs/01-seller-report-new-vehicle.pdf and asking. */
const newVehicleReport = CleanVehicleReportSchema.parse({
  year: 2025,
  kind: "new",
  vin: "7AUSN2SX8SA008938",
  modelYear: 2025,
  make: "Aurelle",
  model: "Sona S2",
  dateOfSale: "2025-02-08",
  placedInServiceDate: "2025-02-08",
  maximumCredit: 7500,
  creditTransferred: 7500,
  answers: { acquiredForUse: true, resoldWithin30Days: false, businessUsePercent: 0 },
});

/* elayne's docs/02-seller-report-previously-owned-vehicle.pdf: no credit transferred. */
const usedVehicleReport = CleanVehicleReportSchema.parse({
  year: 2025,
  kind: "previously_owned",
  vin: "3PLMSTEV1MN008937",
  modelYear: 2021,
  make: "Pellam",
  model: "Strata EV",
  dateOfSale: "06/20/2025",
  placedInServiceDate: "06/21/2025",
  salesPrice: 14600,
  answers: {
    acquiredForUse: true,
    resoldWithin30Days: false,
    claimedUsedCreditInPrior3Years: false,
  },
});

describe("ingest-clean-vehicle-report", () => {
  it("records birgitte's new vehicle as her scenario holds it", () => {
    const { key, value } = cleanVehicleFactOf(newVehicleReport);
    expect(isCleanVehicleFactKey(key)).toBe(true);
    expect(value).toEqual(factIn(birgitte.facts, key)?.value);
  });

  it("records elayne's previously owned vehicle, with no transfer, as her scenario holds it", () => {
    const { key, value } = cleanVehicleFactOf(usedVehicleReport);
    expect(value).toEqual(factIn(elayne.facts, key)?.value);
    expect(value).not.toHaveProperty("creditTransferredToDealer");
  });

  it("writes the dates in the fact's shape", () => {
    expect(isoDateOf("6/2/2025")).toBe("2025-06-02");
    expect(isoDateOf(" 2025-06-02 ")).toBe("2025-06-02");
  });
});
