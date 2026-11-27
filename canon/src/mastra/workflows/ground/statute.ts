import { searchStatute, STATUTE_SKIP_WHY, statuteSearchLog } from "../statute";
import type {
  ConsultStatuteOutput,
  GroundStepLog,
  LoopCarrier,
  RuleOutput,
  SettledRuleOutput,
} from "./schemas";

/*
 * The rule judge's consult_statute, handled in code: one statute search per
 * run, its passages added to the evidence, and one more rule call in the same
 * iteration. When the search cannot run, the next call gets a note instead.
 */

export const STATUTE_NOT_AVAILABLE =
  "The statute is not available in this review. Rule, or ask for more evidence.";
export const STATUTE_ALREADY_CONSULTED =
  "The statute was already consulted in this review; its passages are above. Rule, or ask for more evidence.";

export interface StatuteRound {
  carrier: LoopCarrier;
  /** For the next rule prompt, when the statute was not searched. */
  note?: string;
}

export async function consultStatute(
  carrier: LoopCarrier,
  ask: ConsultStatuteOutput,
  steps: GroundStepLog[],
  hitsPerQuery: number,
): Promise<StatuteRound> {
  const t0 = Date.now();
  const input = { reason: ask.reason, statuteQueries: ask.statuteQueries };
  const log = (output: unknown) =>
    steps.push({
      iteration: carrier.iteration,
      kind: "statute",
      durationMs: Date.now() - t0,
      input,
      output,
    });

  if (carrier.statuteConsulted) {
    log({ skipped: "already_consulted", why: STATUTE_SKIP_WHY.already_consulted });
    return { carrier, note: STATUTE_ALREADY_CONSULTED };
  }
  const search = await searchStatute(ask.statuteQueries, {
    hitsPerQuery,
    jurisdictions: carrier.jurisdictions,
  });
  log(statuteSearchLog(search));
  if (search.status === "skipped") return { carrier, note: STATUTE_NOT_AVAILABLE };
  return {
    carrier: {
      ...carrier,
      statuteConsulted: true,
      evidence: { ...carrier.evidence!, statuteBlocks: search.blocks },
    },
  };
}

/* The call after a statute round may not ask again: that becomes a request for more evidence. */
export function settleAfterStatute(ruleOutput: RuleOutput): SettledRuleOutput {
  if (ruleOutput.kind !== "consult_statute") return ruleOutput;
  return {
    kind: "need_more_evidence",
    reason: ruleOutput.reason,
    suggestedQueries: ruleOutput.statuteQueries,
  };
}
