/*
 * Ask The Tax Code, end to end: one definitive question from the home
 * search box, answered from the reference corpus with a citation.
 *
 * The question has one right answer in the Form 8889 instructions
 * (self-only HSA limit, $4,300 for 2025), so a miss is easy to read.
 * Stages, as in summary.ts:
 *   plumbing — the box opens an /ask page and the turn finishes; the
 *              first reference's PDF link serves a PDF.
 *   model    — the answer cites at least one reference and states $4,300.
 */

import { expect, type Locator, type Page } from "@playwright/test";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { RUN_DIR } from "./run";
import { check, plumbing } from "./summary";

const QUESTION = "What is the maximum HSA contribution for self-only coverage in 2025?";
const EXPECTED_AMOUNT = "4,300";
const ASK_MS = 5 * 60_000; // two judge calls on a local model
const TRANSCRIPT = join(RUN_DIR, "transcript.md");

export async function askTheTaxCode(page: Page): Promise<void> {
  const turn = await plumbing("tax-code question gets an answer", () => askQuestion(page));
  const answer = await turn.innerText();
  appendFileSync(TRANSCRIPT, `## Ask The Tax Code\n\n**Q:** ${QUESTION}\n\n**A:** ${answer}\n\n`);

  if ((await turn.getAttribute("data-turn-status")) === "failed") {
    check("tax-code answer cites a reference", "model", [`turn failed: ${answer.split("\n")[1]}`]);
    return;
  }
  const pdfLinks = turn.getByRole("link", { name: /Open PDF/ });
  // The answer text only: the reference quotes also contain the amount.
  const answerText = await turn.locator("[data-answer]").innerText();
  const problems: string[] = [];
  if ((await pdfLinks.count()) === 0) problems.push("no reference card");
  if (!answerText.includes(EXPECTED_AMOUNT)) {
    problems.push(`answer does not state $${EXPECTED_AMOUNT}`);
  }
  check("tax-code answer cites a reference", "model", problems);

  if ((await pdfLinks.count()) > 0) {
    await plumbing("reference PDF opens", () => expectPdf(page, pdfLinks.first()));
  }
}

/* Returns the finished turn's <article> (status completed or failed). */
async function askQuestion(page: Page): Promise<Locator> {
  await page.goto("/");
  const box = page.getByPlaceholder(/Ask the tax code/);
  const ask = page.getByRole("button", { name: "Ask", exact: true });
  // Retry the fill: text typed before hydration is lost, and Ask stays disabled.
  await expect(async () => {
    await box.fill(QUESTION);
    await expect(ask).toBeEnabled({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
  await ask.click();
  await expect(page).toHaveURL(/\/ask\//, { timeout: 30_000 });

  const turn = page.locator("article[data-turn-status]").first();
  await expect(turn).toBeAttached({ timeout: 30_000 });
  await expect(turn).not.toHaveAttribute("data-turn-status", "running", { timeout: ASK_MS });
  return turn;
}

async function expectPdf(page: Page, link: Locator) {
  const href = (await link.getAttribute("href"))!.split("#")[0];
  const res = await page.request.get(href);
  expect(res.ok(), `GET ${href}`).toBe(true);
  expect(res.headers()["content-type"], `content type of ${href}`).toContain("pdf");
}
