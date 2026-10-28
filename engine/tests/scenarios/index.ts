import type { Scenario } from "../types.js";
import { alejandroScenario } from "./alejandro/index.js";
import { alexScenario } from "./alex/index.js";
import { carterScenario } from "./carter/index.js";
import { jordanScenario } from "./jordan/index.js";
import { marcusScenario } from "./marcus/index.js";
import { taraScenario } from "./tara/index.js";

export {
  alejandroScenario,
  alexScenario,
  carterScenario,
  jordanScenario,
  marcusScenario,
  taraScenario,
};
export type { Scenario };

export const SCENARIOS: Scenario[] = [
  alexScenario,
  alejandroScenario,
  marcusScenario,
  jordanScenario,
  carterScenario,
  taraScenario,
];
