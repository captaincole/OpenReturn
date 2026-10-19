/*
 * Home energy improvement fact kind (Form 5695, Part II). One fact =
 * one contractor invoice or receipt, with one item per piece of
 * qualifying property.
 *
 * Convention:
 *   category: "home_energy"
 *   key:      "vendor.{vendorSlug}.energy_invoice"
 *   value:    EnergyInvoiceFactValue
 *
 * Four verbal answers go with it (HOME_ENERGY_KEYS), one boolean fact
 * each. They answer Form 5695 lines 17a–17c, 17e, 21a, and 21b.
 *
 * Not modeled: Part I (solar, wind, geothermal, battery, fuel cell) and
 * enabling property (line 25: panelboards, branch circuits, feeders).
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

/* Form 5695 Part II property types. Each maps to one line group. */
export const ENERGY_ITEM_KINDS = [
  "insulation", // line 18
  "exterior_door", // line 19
  "window_skylight", // line 20
  "central_air_conditioner", // line 22
  "water_heater", // line 23: natural gas, propane, or oil
  "furnace_boiler", // line 24: natural gas, propane, or oil furnace or hot water boiler
  "home_energy_audit", // line 26
  "heat_pump", // line 29a–b: electric or natural gas
  "heat_pump_water_heater", // line 29c–d
  "biomass_stove_boiler", // line 29e–f
] as const;

export type EnergyItemKind = (typeof ENERGY_ITEM_KINDS)[number];

export interface EnergyImprovementItem {
  kind: EnergyItemKind;
  description?: string;
  /* Qualified manufacturer identification number: 4 characters. */
  qmid?: string;
  /* Cost in dollars. Lines 22–29 include onsite labor; lines 18–20 exclude it. */
  cost: number;
}

export interface EnergyInvoiceFactValue {
  vendorName: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  items: EnergyImprovementItem[];
}

export const HOME_ENERGY_KEYS = {
  /* Lines 17a and 21a: installed on the taxpayer's main home in the United States. */
  mainHomeInUs: "home_energy.main_home_in_us",
  /* Lines 17b and 21b: the taxpayer is the original user and placed it in service. */
  originalUser: "home_energy.original_user",
  /* Line 17c: components expected to last at least 5 years. */
  lastsFiveYears: "home_energy.lasts_five_years",
  /* Line 17e: improvements are related to the construction of the main home. */
  newConstruction: "home_energy.new_home_construction",
} as const;

const HE_CATEGORY = "home_energy";
const HE_KEY_RE = /^vendor\.([^.]+)\.energy_invoice$/;

export function makeEnergyInvoiceFactKey(vendorSlug: string): string {
  return `vendor.${vendorSlug}.energy_invoice`;
}

export function isEnergyInvoiceFactKey(key: string): boolean {
  return HE_KEY_RE.test(key);
}

export function isEnergyInvoiceFact(f: TaxFactRow): boolean {
  return f.category === HE_CATEGORY && HE_KEY_RE.test(f.key);
}

export function getEnergyInvoiceFacts(facts: FactsView): EnergyInvoiceFactValue[] {
  return facts
    .byCategory(HE_CATEGORY)
    .filter(isEnergyInvoiceFact)
    .map((f) => f.value as EnergyInvoiceFactValue);
}
