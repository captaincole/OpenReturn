/* The one db-to-engine bridge: all I/O stays here, so the engine never touches a database. */

import { evaluateScenario, type EngineFiling, type EvaluatedScenario } from "@openreturn/engine";
import { listDecisions } from "./db/aiDecisions";
import type { Scope } from "./db/appDb";
import { listFacts } from "./db/taxFacts";

export async function loadAndEvaluateScenario(
  scope: Scope,
  filing: EngineFiling,
  authEmail: string | null = null,
): Promise<EvaluatedScenario> {
  const [facts, decisions] = await Promise.all([
    listFacts(scope, { filingId: filing.id, limit: 500 }),
    listDecisions(scope, { filingId: filing.id, limit: 500 }),
  ]);
  return evaluateScenario({ filing, facts, decisions, authEmail });
}
