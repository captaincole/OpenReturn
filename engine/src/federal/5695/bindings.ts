/* Each line group takes the most expensive items first, as the form asks. */

import { defineForm } from "../../defineForm.js";
import type { EnergyItemKind } from "../../facts/index.js";
import { SSN } from "../../values.js";
import { computeEnergyCreditLimit } from "../../worksheets/energyCreditLimit.js";
import type { Form5695FilingInfo } from "./filingInfo.js";
import {
  costOf,
  credit,
  hasSectionA,
  hasSectionB,
  itemsOf,
  sectionAApplies,
  sectionAQualifies,
  sectionBQualifies,
  total,
} from "./partII.js";
import type { Form5695 } from "./types.js";

type Info = Form5695FilingInfo;

const num = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);

const a = (info: Info, kind: EnergyItemKind) =>
  sectionAQualifies(info) ? itemsOf(info, kind) : [];
const b = (info: Info, kind: EnergyItemKind) =>
  sectionBQualifies(info) ? itemsOf(info, kind) : [];

const yesBox = (show: (i: Info) => boolean, v: (i: Info) => boolean | undefined) => (i: Info) =>
  show(i) ? v(i) : undefined;
const noBox = (show: (i: Info) => boolean, v: (i: Info) => boolean | undefined) => (i: Info) => {
  const answer = show(i) ? v(i) : undefined;
  return answer === undefined ? undefined : !answer;
};

const fullName = (info: Info) =>
  info.taxpayerFirstName && info.taxpayerLastName
    ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
    : undefined;

const nth = (items: (i: Info) => ReturnType<typeof itemsOf>, n: number) => ({
  qmid: (_: unknown, info: Info) => items(info)[n]?.qmid,
  cost: (_: unknown, info: Info) => costOf(items(info).slice(n, n + 1)),
});

const PART_I = "Part I (residential clean energy credit) is not modeled.";
const QMID_EXT =
  "Boxes 5–17 after the 4-character QMID: the 2025 instructions use only the 4 characters.";
const OTHER_HOMES = "Section B property at more than one home: OpenReturn records one home.";
const ENABLING = "Enabling property (panelboards, branch circuits, feeders) is not modeled.";

const doors = (info: Info) => a(info, "exterior_door");
const windows = (info: Info) => a(info, "window_skylight");
const waterHeaters = (info: Info) => b(info, "water_heater");

export function register(): void {
  defineForm<Form5695, Form5695FilingInfo>("form-5695", {
    bindings: {
      "0.header.name_shown_on_return": (_, info) => fullName(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      "1.header.name_shown_on_return": (_, info) => fullName(info),
      "1.header.ssn": (_, info) => info.taxpayerSSN,

      "1.line.17a_yes": (_, i) => yesBox(hasSectionA, (x) => x.homeEnergyMainHomeInUs)(i),
      "1.line.17a_no": (_, i) => noBox(hasSectionA, (x) => x.homeEnergyMainHomeInUs)(i),
      "1.line.17b_yes": (_, i) => yesBox(hasSectionA, (x) => x.homeEnergyOriginalUser)(i),
      "1.line.17b_no": (_, i) => noBox(hasSectionA, (x) => x.homeEnergyOriginalUser)(i),
      "1.line.17c_yes": (_, i) => yesBox(hasSectionA, (x) => x.homeEnergyLastsFiveYears)(i),
      "1.line.17c_no": (_, i) => noBox(hasSectionA, (x) => x.homeEnergyLastsFiveYears)(i),
      // Line 17d uses the home address on the return.
      "1.line.17d_street": (_, i) => (sectionAApplies(i) ? i.homeAddressLine1 : undefined),
      "1.line.17d_unit": (_, i) => (sectionAApplies(i) ? i.homeAddressApt : undefined),
      "1.line.17d_city": (_, i) => (sectionAApplies(i) ? i.homeAddressCity : undefined),
      "1.line.17d_state": (_, i) => (sectionAApplies(i) ? i.homeAddressState : undefined),
      "1.line.17d_zip": (_, i) => (sectionAApplies(i) ? i.homeAddressZip : undefined),
      "1.line.17e_yes": (_, i) => yesBox(sectionAApplies, (x) => x.homeEnergyNewConstruction)(i),
      "1.line.17e_no": (_, i) => noBox(sectionAApplies, (x) => x.homeEnergyNewConstruction)(i),

      "1.line.18a": (_, i) => costOf(a(i, "insulation")),
      "1.line.18b": (f) => credit(f["1.line.18a"], 1200),

      "1.line.19a": (_, i) => costOf(doors(i).slice(0, 1)),
      "1.line.19b_mfr_id": (_, i) => doors(i)[0]?.qmid,
      "1.line.19c": (f) => credit(f["1.line.19a"], 250),
      "1.line.19d_i_mfr_id": nth(doors, 1).qmid,
      "1.line.19d_i_cost": nth(doors, 1).cost,
      "1.line.19d_ii_mfr_id": nth(doors, 2).qmid,
      "1.line.19d_ii_cost": nth(doors, 2).cost,
      "1.line.19d": (_, i) => costOf(doors(i).slice(1, 3)),
      "1.line.19e": (_, i) => costOf(doors(i).slice(3)),
      "1.line.19f": (f) => total(f["1.line.19d"], f["1.line.19e"]),
      "1.line.19g": (f) => credit(f["1.line.19f"], Infinity),
      "1.line.19h": (f) => {
        const v = total(f["1.line.19c"], f["1.line.19g"]);
        return v === undefined ? undefined : Math.min(v, 500);
      },

      "1.line.20a_i_mfr_id": nth(windows, 0).qmid,
      "1.line.20a_i_cost": nth(windows, 0).cost,
      "1.line.20a_ii_mfr_id": nth(windows, 1).qmid,
      "1.line.20a_ii_cost": nth(windows, 1).cost,
      "1.line.20a_iii_mfr_id": nth(windows, 2).qmid,
      "1.line.20a_iii_cost": nth(windows, 2).cost,
      "1.line.20a_iv_mfr_id": nth(windows, 3).qmid,
      "1.line.20a_iv_cost": nth(windows, 3).cost,
      "1.line.20a": (_, i) => costOf(windows(i).slice(0, 4)),
      "1.line.20b": (_, i) => costOf(windows(i).slice(4)),
      "1.line.20c": (f) => total(f["1.line.20a"], f["1.line.20b"]),
      "1.line.20d": (f) => credit(f["1.line.20c"], 600),

      "2.line.21a_yes": (_, i) => yesBox(hasSectionB, (x) => x.homeEnergyMainHomeInUs)(i),
      "2.line.21a_no": (_, i) => noBox(hasSectionB, (x) => x.homeEnergyMainHomeInUs)(i),
      "2.line.21b_yes": (_, i) => yesBox(hasSectionB, (x) => x.homeEnergyOriginalUser)(i),
      "2.line.21b_no": (_, i) => noBox(hasSectionB, (x) => x.homeEnergyOriginalUser)(i),
      "2.line.21c_home1_street": (_, i) => (sectionBQualifies(i) ? i.homeAddressLine1 : undefined),
      "2.line.21c_home1_unit": (_, i) => (sectionBQualifies(i) ? i.homeAddressApt : undefined),
      "2.line.21c_home1_city": (_, i) => (sectionBQualifies(i) ? i.homeAddressCity : undefined),
      "2.line.21c_home1_state": (_, i) => (sectionBQualifies(i) ? i.homeAddressState : undefined),
      "2.line.21c_home1_zip": (_, i) => (sectionBQualifies(i) ? i.homeAddressZip : undefined),

      "2.line.22a": (_, i) => costOf(b(i, "central_air_conditioner").slice(0, 1)),
      "2.line.22a_mfr_id": (_, i) => b(i, "central_air_conditioner")[0]?.qmid,
      "2.line.22b": (_, i) => costOf(b(i, "central_air_conditioner").slice(1)),
      "2.line.22c": (f) => total(f["2.line.22a"], f["2.line.22b"]),
      "2.line.22d": (f) => credit(f["2.line.22c"], 600),

      "2.line.23a_i_mfr_id": nth(waterHeaters, 0).qmid,
      "2.line.23a_i_cost": nth(waterHeaters, 0).cost,
      "2.line.23a_ii_mfr_id": nth(waterHeaters, 1).qmid,
      "2.line.23a_ii_cost": nth(waterHeaters, 1).cost,
      "2.line.23a": (_, i) => costOf(waterHeaters(i).slice(0, 2)),
      "2.line.23b": (_, i) => costOf(waterHeaters(i).slice(2)),
      "2.line.23c": (f) => total(f["2.line.23a"], f["2.line.23b"]),
      "2.line.23d": (f) => credit(f["2.line.23c"], 600),

      "2.line.24a": (_, i) => costOf(b(i, "furnace_boiler").slice(0, 1)),
      "2.line.24a_mfr_id": (_, i) => b(i, "furnace_boiler")[0]?.qmid,
      "2.line.24b": (_, i) => costOf(b(i, "furnace_boiler").slice(1)),
      "2.line.24c": (f) => total(f["2.line.24a"], f["2.line.24b"]),
      "2.line.24d": (f) => credit(f["2.line.24c"], 600),

      // No item kind records enabling property, so line 25a is always No.
      "2.line.25a_no": (_, i) => (sectionBQualifies(i) ? true : undefined),

      // Line 26a is inferred from the invoices, not asked.
      "3.line.26a_yes": (_, i) =>
        sectionBQualifies(i) ? b(i, "home_energy_audit").length > 0 : undefined,
      "3.line.26a_no": (_, i) =>
        sectionBQualifies(i) ? b(i, "home_energy_audit").length === 0 : undefined,
      "3.line.26b": (_, i) => costOf(b(i, "home_energy_audit")),
      "3.line.26c": (f) => credit(f["3.line.26b"], 150),

      "3.line.27": (f) =>
        total(
          f["1.line.18b"],
          f["1.line.19h"],
          f["1.line.20d"],
          f["2.line.22d"],
          f["2.line.23d"],
          f["2.line.24d"],
          f["2.line.25e"],
          f["3.line.26c"],
        ),
      "3.line.28": (f) =>
        f["3.line.27"] === undefined ? undefined : Math.min(f["3.line.27"], 1200),

      "3.line.29a": (_, i) => costOf(b(i, "heat_pump").slice(0, 1)),
      "3.line.29a_mfr_id": (_, i) => b(i, "heat_pump")[0]?.qmid,
      "3.line.29b": (_, i) => costOf(b(i, "heat_pump").slice(1)),
      "3.line.29c": (_, i) => costOf(b(i, "heat_pump_water_heater").slice(0, 1)),
      "3.line.29c_mfr_id": (_, i) => b(i, "heat_pump_water_heater")[0]?.qmid,
      "3.line.29d": (_, i) => costOf(b(i, "heat_pump_water_heater").slice(1)),
      "3.line.29e": (_, i) => costOf(b(i, "biomass_stove_boiler").slice(0, 1)),
      "3.line.29e_mfr_id": (_, i) => b(i, "biomass_stove_boiler")[0]?.qmid,
      "3.line.29f": (_, i) => costOf(b(i, "biomass_stove_boiler").slice(1)),
      "3.line.29g": (f) =>
        total(
          f["3.line.29a"],
          f["3.line.29b"],
          f["3.line.29c"],
          f["3.line.29d"],
          f["3.line.29e"],
          f["3.line.29f"],
        ),
      "3.line.29h": (f) => credit(f["3.line.29g"], 2000),
      "3.line.30": (f) => total(f["3.line.28"], f["3.line.29h"]),
      "3.line.31": (f) => {
        const tax = f["form-1040.line.18"];
        if (f["3.line.30"] === undefined || typeof tax !== "number") return undefined;
        return computeEnergyCreditLimit({
          tax,
          form8978Amount: num(f["schedule-3.0.line.6l"]),
          foreignTaxCredit: num(f["schedule-3.0.line.1"]),
          dependentCareCredit: num(f["schedule-3.0.line.2"]),
          elderlyOrDisabledCredit: num(f["schedule-3.0.line.6d"]),
          educationCredits: num(f["schedule-3.0.line.3"]),
          retirementSavingsCredit: num(f["schedule-3.0.line.4"]),
        }).line3;
      },
      "3.line.32": (f) =>
        f["3.line.30"] === undefined || f["3.line.31"] === undefined
          ? undefined
          : Math.min(f["3.line.30"], f["3.line.31"]),
    },

    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "1.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      "0.header.home_address": PART_I,
      "0.header.apartment": PART_I,
      "0.header.city": PART_I,
      "0.header.state": PART_I,
      "0.header.zip": PART_I,
      "0.line.1": PART_I,
      "0.line.2": PART_I,
      "0.line.3": PART_I,
      "0.line.4": PART_I,
      "0.line.5a_yes": PART_I,
      "0.line.5a_no": PART_I,
      "0.line.5b": PART_I,
      "0.line.6a": PART_I,
      "0.line.6b": PART_I,
      "0.line.7a_yes": PART_I,
      "0.line.7a_no": PART_I,
      "0.line.7b_zip": PART_I,
      "0.line.7b_street": PART_I,
      "0.line.7b_unit": PART_I,
      "0.line.7b_city": PART_I,
      "0.line.7b_state": PART_I,
      "0.line.7c": PART_I,
      "0.line.8": PART_I,
      "0.line.9": PART_I,
      "0.line.10_whole_kw": PART_I,
      "0.line.10_decimal_kw": PART_I,
      "0.line.10_kw_result": PART_I,
      "0.line.11": PART_I,
      "0.line.12": PART_I,
      "0.line.13": PART_I,
      "0.line.14": PART_I,
      "0.line.15": PART_I,
      "0.line.16": PART_I,
      "1.line.19b_mfr_id_ext": QMID_EXT,
      "1.line.19d_i_mfr_id_ext": QMID_EXT,
      "1.line.19d_ii_mfr_id_ext": QMID_EXT,
      "1.line.20a_i_mfr_id_ext": QMID_EXT,
      "1.line.20a_ii_mfr_id_ext": QMID_EXT,
      "1.line.20a_iii_mfr_id_ext": QMID_EXT,
      "1.line.20a_iv_mfr_id_ext": QMID_EXT,
      "2.line.22a_mfr_id_ext": QMID_EXT,
      "2.line.23a_i_mfr_id_ext": QMID_EXT,
      "2.line.23a_ii_mfr_id_ext": QMID_EXT,
      "2.line.24a_mfr_id_ext": QMID_EXT,
      "3.line.29a_mfr_id_ext": QMID_EXT,
      "3.line.29c_mfr_id_ext": QMID_EXT,
      "3.line.29e_mfr_id_ext": QMID_EXT,
      "2.line.21c_home2_street": OTHER_HOMES,
      "2.line.21c_home2_unit": OTHER_HOMES,
      "2.line.21c_home2_city": OTHER_HOMES,
      "2.line.21c_home2_state": OTHER_HOMES,
      "2.line.21c_home2_zip": OTHER_HOMES,
      "2.line.21c_home3_street": OTHER_HOMES,
      "2.line.21c_home3_unit": OTHER_HOMES,
      "2.line.21c_home3_city": OTHER_HOMES,
      "2.line.21c_home3_state": OTHER_HOMES,
      "2.line.21c_home3_zip": OTHER_HOMES,
      "2.line.21c_home4_street": OTHER_HOMES,
      "2.line.21c_home4_unit": OTHER_HOMES,
      "2.line.21c_home4_city": OTHER_HOMES,
      "2.line.21c_home4_state": OTHER_HOMES,
      "2.line.21c_home4_zip": OTHER_HOMES,
      "2.line.25a_yes": ENABLING,
      "2.line.25b_code_1": ENABLING,
      "2.line.25b_code_2": ENABLING,
      "2.line.25b_code_3": ENABLING,
      "2.line.25b_code_4": ENABLING,
      "2.line.25b_code_5": ENABLING,
      "2.line.25b_code_6": ENABLING,
      "2.line.25b_code_7": ENABLING,
      "2.line.25c": ENABLING,
      "2.line.25d_i_mfr_id": ENABLING,
      "2.line.25d_ii_mfr_id": ENABLING,
      "2.line.25e": ENABLING,
      "3.line.32a": "Joint occupants of one home: no scenario shares a home's credit yet.",
      "3.line.32b": "Condominium or cooperative fractional share: no scenario yet.",
    },
  });
}
