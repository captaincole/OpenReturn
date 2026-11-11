/* The steps every test takes through the web app: the owner, a filing, chat turns. */

import { expect, type Page } from "@playwright/test";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { agentStreamErrors } from "./agentLog";
import { unreviewedDecisions, verdictCounts } from "./appDb";
import { RUN_DIR } from "./run";
import { check, note } from "./summary";

export interface Owner {
  name: string;
  email: string;
  password: string;
}

export interface Turn {
  text: string;
  file?: string;
}

const REVIEW_WAIT_MS = 20 * 60_000;
const TURN_MS = 15 * 60_000; // one Cade turn on a local model, tool calls included
const TRANSCRIPT = join(RUN_DIR, "transcript.md");

export async function createOwner(page: Page, owner: Owner) {
  await page.goto("/setup");
  await page.getByPlaceholder("Your name").fill(owner.name);
  await page.getByPlaceholder("Email (used on your tax forms)").fill(owner.email);
  await page.getByPlaceholder("Password (8+ characters)").fill(owner.password);
  await page.getByPlaceholder("Confirm password").fill(owner.password);
  await page.getByRole("button", { name: "Create owner account" }).click();
  const firstName = owner.name.split(" ")[0];
  await expect(page.getByRole("heading", { name: `Hi, ${firstName}.` })).toBeVisible();
}

export async function startFiling(page: Page): Promise<string> {
  await page
    .getByRole("button", { name: /Start filing/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/r\/2025/);
  await expect(page.getByLabel("Message Cade")).toBeEnabled();
  return new URL(page.url()).pathname;
}

/* Waits for Cade's whole turn: the box is disabled while he works. */
export async function waitForCade(page: Page): Promise<string> {
  const box = page.getByLabel("Message Cade");
  await expect(box).toBeDisabled();
  await expect(box).toBeEnabled({ timeout: TURN_MS });
  await expect(page.locator('[data-message-role="assistant"]').first()).toBeAttached();
  return page.locator('[data-message-role="assistant"]').last().innerText();
}

export async function send(page: Page, turn: Turn): Promise<string> {
  const box = page.getByLabel("Message Cade");
  if (turn.file) await page.getByLabel("Attach a file for Cade").setInputFiles(turn.file);
  await box.fill(turn.text);
  await box.press("Enter");
  return waitForCade(page);
}

/* A tap on an answer button sends it as a user message, as typing does. */
export async function tap(page: Page, name: string): Promise<string> {
  await page.getByRole("button", { name, exact: true }).click();
  return waitForCade(page);
}

export function noAgentErrors(turn: string) {
  const errors = agentStreamErrors();
  if (errors.length === 0) return;
  check("agent turns run without errors", "plumbing", [`${turn}: ${errors[0]}`]);
  throw new Error(`${turn}: agent error`);
}

export function logTurn(heading: string, who: string, sent: Turn, reply: string) {
  const file = sent.file ? ` [attached ${sent.file.split("/").pop()}]` : "";
  appendFileSync(
    TRANSCRIPT,
    `## ${heading}\n\n**${who}:** ${sent.text}${file}\n\n**Cade:** ${reply}\n\n`,
  );
}

/*
 * Reviews stop when the servers stop: wait, so run time and API cost include
 * them. An unreached or broken review is a broken app, not a model mistake.
 */
export async function waitForReviews() {
  const start = Date.now();
  await expect
    .poll(() => unreviewedDecisions(), { timeout: REVIEW_WAIT_MS, intervals: [5_000] })
    .toBe(0)
    .catch(() => note(`reviews: ${unreviewedDecisions()} still without a verdict`));
  note(`reviews: waited ${Math.round((Date.now() - start) / 1000)} s`);
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
