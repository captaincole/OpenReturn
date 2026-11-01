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
import { unreviewedDecisions, verdictCounts } from "./appDb";
import { askTheTaxCode } from "./ask";
import { RUN_DIR } from "./run";
import { check, failedStages, note, plumbing, writeSummary } from "./summary";

const OWNER = { name: "Alex Morales", email: "alex@morales.com", password: "e2e-alex-password" };
const MAX_TURNS = 10;
const REVIEW_WAIT_MS = 20 * 60_000;
const TURN_MS = 15 * 60_000; // one Cade turn on a local model, tool calls included
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

async function startFiling(page: Page): Promise<string> {
  await page
    .getByRole("button", { name: /Start filing/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/r\/2025/);
  await expect(page.getByLabel("Message Cade")).toBeEnabled();
  return new URL(page.url()).pathname;
}

async function runIntake(page: Page): Promise<boolean> {
  const script = [...OPENING_TURNS];
  let cadeSaid = "";
  try {
    for (let turn = 1; turn <= MAX_TURNS; turn++) {
      const next: Turn | undefined = script.shift() ?? toTurn(replyTo(cadeSaid));
      if (!next) throw new Error(`turn ${turn}: no answer-sheet rule for Cade's question`);
      cadeSaid =
        turn === 1
          ? await plumbing("chat returns a reply", () => send(page, next))
          : next.file
            ? await plumbing("upload is sent", () => send(page, next))
            : await send(page, next);
      log(turn, next, cadeSaid);
      noAgentErrors(turn);
      if (!cadeSaid.trim()) note(`turn ${turn}: empty reply from Cade`);
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
    if (failedStages().some((stage) => stage.startsWith("plumbing"))) throw err;
    check("intake reaches generated forms", "model", [(err as Error).message.split("\n")[0]]);
    return false;
  }
}

const toTurn = (text: string | undefined): Turn | undefined => (text ? { text } : undefined);

/*
 * Reviews stop when the servers stop: wait, so run time and API cost include
 * them. An unreached or broken review is a broken app, not a model mistake.
 */
async function waitForReviews() {
  const start = Date.now();
  await expect
    .poll(() => unreviewedDecisions(), { timeout: REVIEW_WAIT_MS, intervals: [5_000] })
    .toBe(0)
    .catch(() => note(`reviews: ${unreviewedDecisions()} still without a verdict`));
  note(`reviews: waited ${Math.round((Date.now() - start) / 1000)} s after the forms`);
  const counts = verdictCounts();
  note(
    `reviews: ${Object.entries(counts)
      .map(([verdict, count]) => `${verdict} ${count}`)
      .join(", ")}`,
  );
  check(
    "reviews reach Canon",
    "plumbing",
    ["review_unreached", "review_failed"]
      .filter((verdict) => counts[verdict])
      .map((verdict) => `${counts[verdict]} ${verdict}`),
  );
}

function noAgentErrors(turn: number) {
  const errors = agentStreamErrors();
  if (errors.length === 0) return;
  check("agent turns run without errors", "plumbing", [`turn ${turn}: ${errors[0]}`]);
  throw new Error(`turn ${turn}: agent error`);
}

async function send(page: Page, turn: Turn): Promise<string> {
  const box = page.getByLabel("Message Cade");
  if (turn.file) await page.getByLabel("Attach a file for Cade").setInputFiles(turn.file);
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

async function checkFormsPage(page: Page, filingPath: string) {
  await page.goto(filingPath);
  const open = page.getByRole("region", { name: "Tax forms" }).getByRole("link", { name: "Open" });
  await expect
    .poll(() => open.count(), { timeout: 30_000 })
    .toBeGreaterThanOrEqual(EXPECTED_FORMS.length);
  const types: string[] = [];
  for (const href of await open.evaluateAll((els) =>
    els.map((link) => link.getAttribute("href")!),
  )) {
    const res = await page.request.get(href);
    expect(res.ok(), `GET ${href}`).toBe(true);
    types.push(res.headers()["content-type"] ?? "");
  }
  const pdfs = types.filter((contentType) => contentType.includes("pdf")).length;
  expect(pdfs, `PDF links (content types: ${types.join(", ")})`).toBeGreaterThanOrEqual(
    EXPECTED_FORMS.length,
  );
}

function log(turn: number, sent: Turn, reply: string) {
  const file = sent.file ? ` [attached ${sent.file.split("/").pop()}]` : "";
  appendFileSync(
    TRANSCRIPT,
    `## Turn ${turn}\n\n**Alex:** ${sent.text}${file}\n\n**Cade:** ${reply}\n\n`,
  );
}
