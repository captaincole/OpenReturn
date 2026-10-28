import { askCanon } from "../../canon/client";
import type { AskHistoryTurn } from "../../canon/schemas";
import {
  completeAskTurn,
  failAskTurn,
  getAskThread,
  setAskTurnStage,
  type AskTurn,
} from "../../db/askThreads";

function history(earlier: AskTurn[]): AskHistoryTurn[] {
  return earlier
    .filter((t) => t.status === "completed" && t.answer)
    .map((t) => ({ question: t.question, answer: t.answer ?? "" }));
}

export async function runAskTurn(userId: string, threadId: string, turnId: string): Promise<void> {
  const started = Date.now();
  try {
    const thread = await getAskThread(userId, threadId);
    const turn = thread?.turns.find((t) => t.id === turnId);
    if (!thread || !turn) throw new Error(`ask turn ${turnId} not found`);
    const earlier = thread.turns.filter((t) => t.index < turn.index);

    await setAskTurnStage(turn.id, "retrieving");
    const result = await askCanon({ question: turn.question, history: history(earlier) });
    if (result.status === "failed") {
      await failAskTurn(
        turnId,
        `The answer failed: ${result.error}`,
        result.log,
        Date.now() - started,
      );
      return;
    }
    await completeAskTurn(turnId, {
      answer: result.answer,
      coverage: result.coverage,
      citations: result.citations,
      missingDocuments: result.missingDocuments,
      log: { steps: result.log.steps },
      durationMs: Date.now() - started,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await failAskTurn(turnId, `The answer failed: ${reason}`, { steps: [] }, Date.now() - started);
    throw err;
  }
}
