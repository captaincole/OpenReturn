/*
 * One user's conversation is closed to every other user. The web app names the
 * session's user to Cade; Cade's Mastra routes then refuse a thread of another
 * user. This stage asks Cade as a second user does, with the web app's token.
 */

import { expect, type Page } from "@playwright/test";
import { addUser, removeUser } from "./appDb";
import { AGENT_TOKEN, AGENT_URL } from "./run";

const USER_ID_HEADER = "x-openreturn-user-id";
const TAX_YEAR = 2025;
const SECOND_USER = { id: "e2e-second-user", email: "second@example.com", name: "Second User" };

const messagesPath = (threadId: string): string =>
  `/api/memory/threads/${encodeURIComponent(threadId)}/messages?agentId=cade`;

/* A call to Cade from the web app's side of the token, for the named user. */
async function statusAs(userId: string | null, path: string, token = AGENT_TOKEN): Promise<number> {
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (userId) headers.set(USER_ID_HEADER, userId);
  return (await fetch(`${AGENT_URL}${path}`, { headers })).status;
}

export async function expectConversationPrivate(page: Page) {
  const me = await page.request.get("/api/auth/me");
  const { userId } = (await me.json()) as { userId: string };
  const thread = messagesPath(`${userId}::${TAX_YEAR}`);

  expect((await page.request.get(`/api/agent${thread}`)).status(), "its user, in the app").toBe(
    200,
  );
  expect(await statusAs(userId, thread), "its user").toBe(200);
  expect(await statusAs("nobody", thread), "a user id not in the table").toBe(401);
  expect(await statusAs(userId, thread, "wrong-token"), "a caller without the token").toBe(401);

  addUser(SECOND_USER);
  try {
    expect(await statusAs(SECOND_USER.id, thread), "a second user").toBe(403);
    expect(await statusAs(null, thread), "two users and no user named").toBe(401);
  } finally {
    removeUser(SECOND_USER.id);
  }
}
