import { expect, test, type Page } from "@playwright/test";
import { OPENING_TURNS, replyTo } from "./alexAnswers";
import { decisionProblems, fieldProblems, latestSidecar, w2Problems } from "./alexChecks";
import { findFiles } from "./appDb";
import { askTheTaxCode } from "./ask";
import { notePromptSizes } from "./prompts";
import {
  createOwner,
  logTurn,
  noAgentErrors,
  send,
  startFiling,
  waitForReviews,
  type Turn,
} from "./session";
import { check, failedStages, note, plumbing, writeSummary } from "./summary";

const OWNER = { name: "Alex Morales", email: "alex@morales.com", password: "e2e-alex-password" };
const MAX_TURNS = 10;
const EXPECTED_FORMS = ["form-1040", "form-540"];
const started = Date.now();

test.afterEach(async ({}, testInfo) => {
  await notePromptSizes();
  writeSummary({
    title: "Alex E2E",
    durationMs: Date.now() - started,
    testError: testInfo.error?.message,
  });
});

test("Alex: intake through generated forms", async ({ page }) => {
  test.setTimeout(90 * 60_000);
  await plumbing("setup page creates the owner", () => createOwner(page, OWNER));
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
      logTurn(`Turn ${turn}`, "Alex", next, cadeSaid);
      noAgentErrors(`turn ${turn}`);
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
