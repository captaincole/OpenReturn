/*
 * An instance behind Cloudflare Access: two guests sign in by email, each
 * reads the first-visit notice, and neither can read the other's
 * conversation. No model call: the run checks sign-in and separation only.
 * `npm run e2e:access` sets AUTH_MODE for the web server.
 */

import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { Server } from "node:http";
import { accessToken, forgedToken, startFakeAccess } from "./fakeAccess";
import { startFiling } from "./session";
import { failedStages, plumbing, writeSummary } from "./summary";

const BASE_URL = "http://localhost:3000";
const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";
const TAX_YEAR = 2025;
const GUEST_A = "guest-a@example.com";
const GUEST_B = "guest-b@example.com";
const started = Date.now();

let fakeAccess: Server;

test.beforeAll(async () => {
  fakeAccess = await startFakeAccess();
});

test.afterAll(() => {
  fakeAccess.close();
});

test.afterEach(async ({}, testInfo) => {
  writeSummary({
    title: "Access E2E",
    durationMs: Date.now() - started,
    testError: testInfo.error?.message,
  });
});

/* A browser whose every request carries this token, as a request through Access does. */
const browserWith = (browser: Browser, token?: string): Promise<BrowserContext> =>
  browser.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: token ? { [ACCESS_JWT_HEADER]: token } : {},
  });

const messagesPath = (userId: string): string =>
  `/api/agent/api/memory/threads/${encodeURIComponent(`${userId}::${TAX_YEAR}`)}/messages?agentId=cade`;

async function userIdOf(page: Page): Promise<string> {
  const me = await page.request.get("/api/auth/me");
  expect(me.status(), "GET /api/auth/me").toBe(200);
  return ((await me.json()) as { userId: string }).userId;
}

async function expectRefusedWithoutToken(browser: Browser) {
  const outside = await browserWith(browser);
  expect((await outside.request.get("/")).status(), "no token").toBe(403);
  expect((await outside.request.get("/api/auth/me")).status(), "no token, API").toBe(403);
  await outside.close();

  const forged = await browserWith(browser, forgedToken(GUEST_A));
  expect((await forged.request.get("/api/auth/me")).status(), "a forged token").toBe(401);
  expect((await forged.request.get("/api/agent/app/state")).status(), "forged, agent").toBe(401);
  await forged.close();
}

/* The first visit: the notice, nothing forwarded to the agent before it is accepted, then home. */
async function acceptNotice(page: Page, email: string) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/notice$/);
  await expect(page.getByText(`You are signed in as ${email}.`)).toBeVisible();
  expect((await page.request.get("/api/agent/app/state")).status(), "before the notice").toBe(403);
  await page.getByRole("button", { name: "I understand" }).click();
  await expect(page.getByRole("heading", { name: `Hi, ${email}.` })).toBeVisible();
  await page.goto("/notice");
  await expect(page).toHaveURL(`${BASE_URL}/`);
}

/* Also: a write from another site is refused, and sign-out is Cloudflare's. */
async function expectNoPasswordScreens(page: Page) {
  for (const path of ["/login", "/setup"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(`${BASE_URL}/`);
  }
  const setup = await page.request.post("/api/auth/setup", {
    data: { email: "x@example.com", displayName: "X", password: "a-long-password" },
  });
  expect(setup.status(), "POST /api/auth/setup").toBe(404);
  expect((await page.request.post("/api/auth/login", { data: {} })).status(), "login").toBe(404);
  const crossSite = await page.request.post("/api/notice", {
    headers: { origin: "https://another-site.example" },
    data: {},
  });
  expect(crossSite.status(), "a write from another site").toBe(403);
  const signOut = await page.request.post("/api/auth/logout");
  expect(((await signOut.json()) as { next: string }).next).toBe("/cdn-cgi/access/logout");
}

async function expectSeparate(first: Page, second: Page) {
  const firstId = await userIdOf(first);
  const secondId = await userIdOf(second);
  expect(secondId, "two emails, two users").not.toBe(firstId);

  expect((await first.request.get(messagesPath(firstId))).status(), "its own thread").toBe(200);
  expect((await second.request.get(messagesPath(firstId))).status(), "another's thread").toBe(403);

  /* The first guest has a filing now; the second guest's home still offers to start one. */
  await second.goto("/");
  await expect(second.getByRole("button", { name: /Start filing/ }).first()).toBeVisible();
}

test("Access: two guests, each with their own data", async ({ browser }) => {
  test.setTimeout(10 * 60_000);
  await plumbing("a request that did not come through Access is refused", () =>
    expectRefusedWithoutToken(browser),
  );

  const first = await (await browserWith(browser, accessToken(GUEST_A))).newPage();
  await plumbing("the first visit shows the notice", () => acceptNotice(first, GUEST_A));
  await plumbing("no password screens, no write from another site", () =>
    expectNoPasswordScreens(first),
  );
  await plumbing("start a filing", () => startFiling(first));

  const second = await (await browserWith(browser, accessToken(GUEST_B))).newPage();
  await plumbing("a second guest gets the notice too", () => acceptNotice(second, GUEST_B));
  await plumbing("a guest cannot read another guest's conversation", () =>
    expectSeparate(first, second),
  );
  expect(failedStages()).toEqual([]);
});
