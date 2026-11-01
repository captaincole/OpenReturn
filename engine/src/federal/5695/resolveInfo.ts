import {
  HOME_ENERGY_KEYS,
  isEnergyInvoiceFactKey,
  type EnergyInvoiceFactValue,
} from "../../facts/index.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form5695FilingInfo } from "./filingInfo.js";
import { hasSectionA } from "./partII.js";

/*
 * TODO: ask for a missing QMID. The 2025 instructions require one per item
 * of specified property; missingInputs cannot ask for one item's field yet.
 */
export function resolve5695Info(inputs: ResolverInputs): Form5695FilingInfo {
  const rows = factsInCategory(inputs, "home_energy").filter((row) =>
    isEnergyInvoiceFactKey(row.key),
  );
  const energyItems = rows.flatMap((row) => (row.value as EnergyInvoiceFactValue).items ?? []);
  const answer = (key: string): boolean | undefined => {
    const value = inputs.factByKey.get(key);
    return typeof value === "boolean" ? value : undefined;
  };
  const info: Form5695FilingInfo = {
    energyItems: energyItems.length > 0 ? energyItems : undefined,
    homeEnergyMainHomeInUs: answer(HOME_ENERGY_KEYS.mainHomeInUs),
    homeEnergyOriginalUser: answer(HOME_ENERGY_KEYS.originalUser),
    homeEnergyLastsFiveYears: answer(HOME_ENERGY_KEYS.lastsFiveYears),
    homeEnergyNewConstruction: answer(HOME_ENERGY_KEYS.newConstruction),
  };
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_5695",
    fallbacks: [
      {
        rule: "fallback: an energy improvement invoice with an item is recorded",
        value: energyItems.length > 0,
        triggeredByFactKeys: rows.map((row) => row.key),
      },
    ],
  });
  const required =
    energyItems.length === 0
      ? {}
      : {
          [HOME_ENERGY_KEYS.mainHomeInUs]: info.homeEnergyMainHomeInUs,
          [HOME_ENERGY_KEYS.originalUser]: info.homeEnergyOriginalUser,
          ...(hasSectionA(info)
            ? {
                [HOME_ENERGY_KEYS.lastsFiveYears]: info.homeEnergyLastsFiveYears,
                [HOME_ENERGY_KEYS.newConstruction]: info.homeEnergyNewConstruction,
              }
            : {}),
        };
  return {
    ...info,
    mustFile: { "form-5695": resolution },
    missingInputs: { "form-5695": missingInputs(required) },
  };
}
