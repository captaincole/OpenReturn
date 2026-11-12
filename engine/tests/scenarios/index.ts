import type { Scenario } from "../types.js";
import { alejandroScenario } from "./alejandro/index.js";
import { alexScenario } from "./alex/index.js";
import { carterScenario } from "./carter/index.js";
import { jordanScenario } from "./jordan/index.js";
import { marcusScenario } from "./marcus/index.js";
import { taraScenario } from "./tara/index.js";
import { tcbCa005Scenario } from "./tcb-ca-005/index.js";
import { tcbUs001Scenario } from "./tcb-us-001/index.js";
import { tcbUs002Scenario } from "./tcb-us-002/index.js";
import { tcbUs003Scenario } from "./tcb-us-003/index.js";
import { tcbUs004Scenario } from "./tcb-us-004/index.js";
import { tcbUs005Scenario } from "./tcb-us-005/index.js";
import { tcbUs006Scenario } from "./tcb-us-006/index.js";
import { tcbUs007Scenario } from "./tcb-us-007/index.js";
import { tcbUs008Scenario } from "./tcb-us-008/index.js";
import { tcbUs009Scenario } from "./tcb-us-009/index.js";

export {
  alejandroScenario,
  alexScenario,
  carterScenario,
  jordanScenario,
  marcusScenario,
  taraScenario,
  tcbCa005Scenario,
  tcbUs001Scenario,
  tcbUs002Scenario,
  tcbUs003Scenario,
  tcbUs004Scenario,
  tcbUs005Scenario,
  tcbUs006Scenario,
  tcbUs007Scenario,
  tcbUs008Scenario,
  tcbUs009Scenario,
};
export type { Scenario };

export const SCENARIOS: Scenario[] = [
  alexScenario,
  alejandroScenario,
  marcusScenario,
  jordanScenario,
  carterScenario,
  taraScenario,
  tcbUs002Scenario,
  tcbUs003Scenario,
  tcbUs006Scenario,
  tcbUs004Scenario,
  tcbUs005Scenario,
  tcbCa005Scenario,
  tcbUs008Scenario,
  tcbUs001Scenario,
  tcbUs009Scenario,
  tcbUs007Scenario,
];
