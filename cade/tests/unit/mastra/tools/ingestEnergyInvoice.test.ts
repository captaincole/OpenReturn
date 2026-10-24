import { describe, expect, it } from "vitest";
import { energyInvoiceSlug } from "../../../../src/mastra/tools/ingestEnergyInvoice.js";

describe("energyInvoiceSlug", () => {
  it.each([
    ["number", { vendorName: "Cool Air Co", invoiceNumber: "INV-104" }, "cool-air-co-inv-104"],
    [
      "number, not date",
      { vendorName: "Cool Air Co", invoiceNumber: "INV-104", invoiceDate: "03/02/2025" },
      "cool-air-co-inv-104",
    ],
    [
      "date when no number",
      { vendorName: "Cool Air Co", invoiceDate: "03/02/2025" },
      "cool-air-co-03-02-2025",
    ],
    ["vendor only", { vendorName: "Cool Air Co" }, "cool-air-co"],
    ["nothing usable", { vendorName: "***" }, "vendor"],
  ])("%s", (_, input, slug) => {
    expect(energyInvoiceSlug(input)).toBe(slug);
  });

  it("gives two invoices from one vendor two keys", () => {
    const a = energyInvoiceSlug({ vendorName: "Cool Air Co", invoiceDate: "03/02/2025" });
    const b = energyInvoiceSlug({ vendorName: "Cool Air Co", invoiceDate: "06/10/2025" });
    expect(a).not.toBe(b);
  });
});
