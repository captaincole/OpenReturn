import type { Scenario } from "../types.js";
import { alejandroScenario } from "./alejandro/index.js";
import { alexScenario } from "./alex/index.js";
import { carterScenario } from "./carter/index.js";
import { jordanScenario } from "./jordan/index.js";
import { marcusScenario } from "./marcus/index.js";
import { taraScenario } from "./tara/index.js";
import { tcbCa005Scenario } from "./tcb-ca-005/index.js";
import { tcbUs003Scenario } from "./tcb-us-003/index.js";
import { tcbUs004Scenario } from "./tcb-us-004/index.js";
import { tcbUs006Scenario } from "./tcb-us-006/index.js";
import { tcbUs008Scenario } from "./tcb-us-008/index.js";

export {
  alejandroScenario,
  alexScenario,
  carterScenario,
  jordanScenario,
  marcusScenario,
  taraScenario,
  tcbCa005Scenario,
  tcbUs003Scenario,
  tcbUs004Scenario,
  tcbUs006Scenario,
  tcbUs008Scenario,
};
export type { Scenario };

export const SCENARIOS: Scenario[] = [
  alexScenario,
  alejandroScenario,
  marcusScenario,
  jordanScenario,
  carterScenario,
  taraScenario,
  tcbUs003Scenario,
  tcbUs006Scenario,
  tcbUs004Scenario,
  tcbCa005Scenario,
  tcbUs008Scenario,
];
