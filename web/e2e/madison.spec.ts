import { expect, test, type Page } from "@playwright/test";
import { basename } from "node:path";
import { findFiles } from "./appDb";
import {
  amountReply,
  lifeAnswer,
  NAMED_EXPENSE,
  OPENING,
  RETURN_DOCUMENTS,
  returnReply,
} from "./madisonAnswers";
import {
  closingProblems,
  deductionFactProblems,
  documentProblems,
  namedExpenseProblems,
  type DeductionsState,
} from "./madisonChecks";
import { notePromptSizes } from "./prompts";
import {
  createOwner,
  logTurn,
  noAgentErrors,
  send,
  startFiling,
  tap,
  waitForCade,
  waitForReviews,
  type Turn,
} from "./session";
import { check, failedStages, plumbing, writeSummary } from "./summary";

const OWNER = {
  name: "Madison Gray",
  email: "madison@gray.test",
  password: "e2e-madison-password",
};
const MAX_DEDUCTION_TURNS = 14;
const CLOSED = "Deductions are done.";
const started = Date.now();

test.afterEach(async ({}, testInfo) => {
  await notePromptSizes();
  writeSummary({
    title: "Madison E2E",
    durationMs: Date.now() - started,
    testError: testInfo.error?.message,
  });
});

test("Madison: her documents, then the Deductions tab to its close", async ({ page }) => {
  test.setTimeout(150 * 60_000);
  await plumbing("setup page creates the owner", () => createOwner(page, OWNER));
  const filingPath = await plumbing("start a filing", () => startFiling(page));
  await plumbing("the return's seven uploads are sent and stored", () => runReturn(page));
  check("documents read match the PDFs", "model", documentProblems());

  const view = await runDeductions(page, filingPath);
  check("open door: the named expense's outcome", "model", namedExpenseProblems(view));
  check("deduction amounts match the scenario", "model", deductionFactProblems());
  check("the close matches the scenario", "model", closingProblems(view));
  if (view.next.step === "closed") {
    await plumbing("the closing paragraph shows on both pages", () =>
      expectClosingShown(page, filingPath),
    );
  }
  if (process.env.E2E_DECISION_REVIEW === "on") await waitForReviews();
  expect(failedStages()).toEqual([]);
});

/* One message with her answers, then one document in each message. */
async function runReturn(page: Page) {
  let cadeSaid = await send(page, OPENING);
  logTurn("Return 1", "Madison", OPENING, cadeSaid);
  noAgentErrors("return turn 1");
  for (const [index, document] of RETURN_DOCUMENTS.entries()) {
    const turn = returnReply(cadeSaid, document);
    cadeSaid = await send(page, turn);
    logTurn(`Return ${index + 2}`, "Madison", turn, cadeSaid);
    noAgentErrors(`return turn ${index + 2}`);
    expectStored(turn.file!);
  }
}

function expectStored(file: string) {
  const name = new RegExp(basename(file, ".pdf"));
  expect(findFiles("uploads", name), `${basename(file)} in documents/*/uploads`).not.toEqual([]);
}

async function deductionsState(page: Page): Promise<DeductionsState> {
  const res = await page.request.get("/api/agent/app/state");
  expect(res.ok(), "GET /api/agent/app/state").toBe(true);
  return ((await res.json()) as { deductions: DeductionsState }).deductions;
}

/* The flow says what comes next; the test answers it as Madison would. */
async function runDeductions(page: Page, filingPath: string): Promise<DeductionsState> {
  await page.goto(`${filingPath}/deductions`);
  let cadeSaid = await plumbing("the Deductions tab starts on a tap", () =>
    tap(page, "Let's start"),
  );
  logTurn("Deductions 1", "Madison", { text: "Let's start" }, cadeSaid);
  noAgentErrors("deductions turn 1");
  const progress = { sent1098: false, named: false };
  for (let turn = 2; turn <= MAX_DEDUCTION_TURNS; turn++) {
    const view = await deductionsState(page);
    const problem = stopReason(view);
    if (problem !== undefined) return reachedClose(view, problem);
    const sent = await deductionsTurn(page, view, cadeSaid, progress);
    if (typeof sent === "string") return reachedClose(view, `turn ${turn}: ${sent}`);
    cadeSaid = sent.reply;
    logTurn(`Deductions ${turn}`, "Madison", sent.turn, cadeSaid);
    noAgentErrors(`deductions turn ${turn}`);
    if (sent.turn.file) expectStored(sent.turn.file);
  }
  return reachedClose(await deductionsState(page), `not closed after ${MAX_DEDUCTION_TURNS} turns`);
}

/* Empty: closed. Undefined: keep going. */
function stopReason(view: DeductionsState): string | undefined {
  if (view.next.step === "closed") return "";
  if (view.next.step === "wait_for_return") return `waits for the return: ${view.next.why}`;
  return undefined;
}

function reachedClose(view: DeductionsState, problem: string): DeductionsState {
  check("deductions reach the close", "model", problem ? [problem] : []);
  return view;
}

type Progress = { sent1098: boolean; named: boolean };
type Sent = { turn: Turn; reply: string };

/* One turn of the deductions conversation, or why the answer sheet has none. */
async function deductionsTurn(
  page: Page,
  view: DeductionsState,
  cadeSaid: string,
  progress: Progress,
): Promise<Sent | string> {
  const { next } = view;
  if (next.step === "ask_life_questions") return answerLifeQuestions(page, next.questions ?? []);
  if (next.step === "ask_anything_else") {
    const name = progress.named ? next.done! : NAMED_EXPENSE;
    progress.named = true;
    return { turn: { text: `[tap] ${name}` }, reply: await tap(page, name) };
  }
  const turn =
    amountReply(cadeSaid, progress.sent1098) ??
    (next.step === "close" ? { text: "Please close the deductions." } : undefined);
  if (!turn) return `no answer-sheet rule for Cade's message (step ${next.step})`;
  if (turn.file) progress.sent1098 = true;
  return { turn, reply: await send(page, turn) };
}

/* A tap on Yes or No in each question's row, then one message with every answer. */
async function answerLifeQuestions(
  page: Page,
  questions: Array<{ ask: string }>,
): Promise<Sent | string> {
  const words: string[] = [];
  for (const question of questions) {
    const answer = lifeAnswer(question.ask);
    if (answer === undefined) return `no answer-sheet rule for "${question.ask}"`;
    const label = answer ? "Yes" : "No";
    const row = page.locator("li").filter({ hasText: question.ask });
    await row.getByRole("button", { name: label, exact: true }).click();
    words.push(`${question.ask} ${label}`);
  }
  if (questions.length > 1) {
    await page.getByRole("button", { name: /^Send \d+ answers?$/ }).click();
  }
  return { turn: { text: `[tap] ${words.join(" / ")}` }, reply: await waitForCade(page) };
}

/* The paragraph shows on the Deductions tab, and on the return page's Deductions card. */
async function expectClosingShown(page: Page, filingPath: string) {
  await page.goto(`${filingPath}/deductions`);
  await expect(page.locator("section").filter({ hasText: CLOSED }).first()).toBeVisible();
  await page.goto(filingPath);
  const card = page
    .locator("section")
    .filter({ hasText: "Deductions" })
    .filter({ hasText: CLOSED });
  await expect(card.first()).toBeVisible();
}
