/*
 * Alex, end to end: create the owner, ask the tax code one question
 * (ask.ts), start a filing, talk Luca through
 * the intake with the W-2 upload, and wait for the generated forms. Then
 * check what the model stored and generated against Alex's fixtures
 * (packages/engine/tests/scenarios/alex).
 *
 * Results go to <runDir>/summary.md, one row per stage. See summary.ts
 * for the plumbing / model split.
 */

import { expect, test, type Page } from "@playwright/test";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { agentStreamErrors } from "./agentLog";
import { OPENING_TURNS, replyTo, type Turn } from "./alexAnswers";
import {
  decisionProblems,
  fieldProblems,
  findFiles,
  latestSidecar,
  w2Problems,
} from "./alexChecks";
import { unreviewedDecisions } from "./appDb";
import { askTheTaxCode } from "./ask";
import { RUN_DIR } from "./run";
import { check, failedStages, note, plumbing, writeSummary } from "./summary";

const OWNER = { name: "Alex Morales", email: "alex@morales.com", password: "e2e-alex-password" };
const MAX_TURNS = 10;
const REVIEW_WAIT_MS = 20 * 60_000;
const TURN_MS = 15 * 60_000; // one Luca turn on a local model, tool calls included
const TRANSCRIPT = join(RUN_DIR, "transcript.md");
const EXPECTED_FORMS = ["form-1040", "form-540"];
const started = Date.now();

test.afterEach(({}, testInfo) => {
  writeSummary({ durationMs: Date.now() - started, testError: testInfo.error?.message });
});

test("Alex: intake through generated forms", async ({ page }) => {
  test.setTimeout(90 * 60_000);
  await plumbing("setup page creates the owner", () => createOwner(page));
  await askTheTaxCode(page);
  const filingPath = await plumbing("start a filing", () => startFiling(page));
  const generated = await runIntake(page);
  if (generated)
    await plumbing("forms page serves the PDFs", () => checkFormsPage(page, filingPath));
  if (process.env.E2E_DECISION_REVIEW === "on") await waitForReviews();

  check("W-2 read matches the PDF", "model", w2Problems());
  check("required decisions recorded", "model", decisionProblems());
  check("form values match goldens", "model", generated ? fieldProblems() : ["no forms generated"]);
  expect(failedStages()).toEqual([]);
});

async function createOwner(page: Page) {
  await page.goto("/setup");
  await page.getByPlaceholder("Your name").fill(OWNER.name);
  await page.getByPlaceholder("Email (used on your tax forms)").fill(OWNER.email);
  await page.getByPlaceholder("Password (8+ characters)").fill(OWNER.password);
  await page.getByPlaceholder("Confirm password").fill(OWNER.password);
  await page.getByRole("button", { name: "Create owner account" }).click();
  await expect(page.getByRole("heading", { name: "Hi, Alex." })).toBeVisible();
}

/* Returns the filing's path (for example /r/2025). */
async function startFiling(page: Page): Promise<string> {
  await page
    .getByRole("button", { name: /Start filing/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/r\/2025/);
  await expect(page.getByLabel("Message Luca")).toBeEnabled();
  return new URL(page.url()).pathname;
}

/*
 * Scripted turns first, then answer-sheet replies, until the newest
 * sidecar holds every expected form. The first reply and the stored
 * upload are plumbing stages. Reaching generation is a model stage.
 * Returns true when the forms were generated.
 */
async function runIntake(page: Page): Promise<boolean> {
  const script = [...OPENING_TURNS];
  let lucaSaid = "";
  try {
    for (let turn = 1; turn <= MAX_TURNS; turn++) {
      const next: Turn | undefined = script.shift() ?? toTurn(replyTo(lucaSaid));
      if (!next) throw new Error(`turn ${turn}: no answer-sheet rule for Luca's question`);
      lucaSaid =
        turn === 1
          ? await plumbing("chat returns a reply", () => send(page, next))
          : next.file
            ? await plumbing("upload is sent", () => send(page, next))
            : await send(page, next);
      log(turn, next, lucaSaid);
      noAgentErrors(turn);
      if (!lucaSaid.trim()) note(`turn ${turn}: empty reply from Luca`);
      if (next.file) await plumbing("upload is stored", () => expectUploadStored());
      if (EXPECTED_FORMS.every((formId) => latestSidecar()?.forms[formId])) {
        check("agent turns run without errors", "plumbing", []);
        check("intake reaches generated forms", "model", []);
        return true;
      }
    }
    check("agent turns run without errors", "plumbing", []);
    throw new Error(`forms incomplete after ${MAX_TURNS} turns`);
  } catch (err) {
    if (failedStages().some((s) => s.startsWith("plumbing"))) throw err;
    check("intake reaches generated forms", "model", [(err as Error).message.split("\n")[0]]);
    return false;
  }
}

const toTurn = (text: string | undefined): Turn | undefined => (text ? { text } : undefined);

/*
 * Reviews run in the background and stop when the servers stop. Wait for
 * every verdict, so the run time and the API cost include them.
 */
async function waitForReviews() {
  const start = Date.now();
  await expect
    .poll(() => unreviewedDecisions(), { timeout: REVIEW_WAIT_MS, intervals: [5_000] })
    .toBe(0)
    .catch(() => note(`reviews: ${unreviewedDecisions()} still without a verdict`));
  note(`reviews: waited ${Math.round((Date.now() - start) / 1000)} s after the forms`);
}

/* An agent error is a broken app, not a model mistake: fail plumbing and stop. */
function noAgentErrors(turn: number) {
  const errors = agentStreamErrors();
  if (errors.length === 0) return;
  check("agent turns run without errors", "plumbing", [`turn ${turn}: ${errors[0]}`]);
  throw new Error(`turn ${turn}: agent error`);
}

/* Send one message and return Luca's reply once the turn ends. */
async function send(page: Page, turn: Turn): Promise<string> {
  const box = page.getByLabel("Message Luca");
  if (turn.file) await page.getByLabel("Attach a file for Luca").setInputFiles(turn.file);
  await box.fill(turn.text);
  await box.press("Enter");
  await expect(box).toBeDisabled();
  await expect(box).toBeEnabled({ timeout: TURN_MS });
  await expect(page.locator('[data-message-role="assistant"]').first()).toBeAttached();
  return page.locator('[data-message-role="assistant"]').last().innerText();
}

async function expectUploadStored() {
  expect(findFiles("uploads", /alex-w2/), "uploaded W-2 in documents/*/uploads").not.toEqual([]);
}

/*
 * The Forms section of the return page lists a PDF for each expected form
 * (plus the JSON sidecar), and each link serves its file.
 */
async function checkFormsPage(page: Page, filingPath: string) {
  await page.goto(filingPath);
  const open = page.getByRole("region", { name: "Tax forms" }).getByRole("link", { name: "Open" });
  await expect
    .poll(() => open.count(), { timeout: 30_000 })
    .toBeGreaterThanOrEqual(EXPECTED_FORMS.length);
  const types: string[] = [];
  for (const href of await open.evaluateAll((els) => els.map((e) => e.getAttribute("href")!))) {
    const res = await page.request.get(href);
    expect(res.ok(), `GET ${href}`).toBe(true);
    types.push(res.headers()["content-type"] ?? "");
  }
  const pdfs = types.filter((t) => t.includes("pdf")).length;
  expect(pdfs, `PDF links (content types: ${types.join(", ")})`).toBeGreaterThanOrEqual(
    EXPECTED_FORMS.length,
  );
}

function log(turn: number, sent: Turn, reply: string) {
  const file = sent.file ? ` [attached ${sent.file.split("/").pop()}]` : "";
  appendFileSync(
    TRANSCRIPT,
    `## Turn ${turn}\n\n**Alex:** ${sent.text}${file}\n\n**Luca:** ${reply}\n\n`,
  );
}
