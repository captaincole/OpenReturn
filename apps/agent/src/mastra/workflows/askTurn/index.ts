import type { Mastra } from "@mastra/core";
import { answerQuestion, type AskHistoryTurn, type AskStepLog } from "@openreturn/canon";
import {
  completeAskTurn,
  failAskTurn,
  getAskThread,
  setAskTurnStage,
  type AskTurn,
} from "../../db/askThreads";

/*
 * One Ask The Tax Code turn, Cade's side: the thread rows in app.db are
 * the user's; the answer comes from Canon (answerQuestion, in-process for
 * now). The routes in server/routes/ask.ts fire this in the background and
 * the page polls the turn's stage, which Canon reports as it goes.
 */

function history(earlier: AskTurn[]): AskHistoryTurn[] {
  return earlier
    .filter((t) => t.status === "completed" && t.answer)
    .map((t) => ({ question: t.question, answer: t.answer ?? "" }));
}

export async function runAskTurn(
  mastra: Mastra,
  userId: string,
  threadId: string,
  turnId: string,
): Promise<void> {
  const started = Date.now();
  /* Cade owns the query log: a failed turn keeps the steps that ran. */
  const steps: AskStepLog[] = [];
  try {
    const thread = await getAskThread(userId, threadId);
    const turn = thread?.turns.find((t) => t.id === turnId);
    if (!thread || !turn) throw new Error(`ask turn ${turnId} not found`);
    const earlier = thread.turns.filter((t) => t.index < turn.index);

    const result = await answerQuestion(mastra, {
      question: turn.question,
      history: history(earlier),
      onStage: (stage) => setAskTurnStage(turn.id, stage),
      steps,
    });
    await completeAskTurn(turnId, {
      answer: result.answer,
      coverage: result.coverage,
      citations: result.citations,
      missingDocuments: result.missingDocuments,
      log: { steps },
      durationMs: Date.now() - started,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await failAskTurn(turnId, `The answer failed: ${reason}`, { steps }, Date.now() - started);
    throw err;
  }
}
