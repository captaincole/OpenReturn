import { claimedUserId, mintToken, SESSION_TTL_MS, verifyToken } from "@/lib/sessionToken";
import {
  getLocalLogin,
  getOnlyLocalLogin,
  hasLocalLogin,
  insertLocalUser,
  toSession,
  type LocalLogin,
  type UserSession,
} from "@/lib/userStore";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/*
 * Password sign-in. A user's local_logins row holds the scrypt hash and the
 * cookie HMAC secret (made at setup, no env var). Keep this module small
 * enough to audit. Only getLocalSession() verifies; proxy.ts checks cookie
 * presence only. Callers ask lib/session.ts, which picks the sign-in mode.
 */

export const SESSION_COOKIE = "openreturn_session";

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export { hasLocalLogin };

/* The /setup screen's one account. Refused when the instance has a password user. */
export async function createLocalUser(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<UserSession> {
  if (await hasLocalLogin()) throw new Error("a user already exists");
  const login: LocalLogin = {
    id: crypto.randomUUID(),
    email: input.email,
    displayName: input.displayName,
    passwordHash: hashPassword(input.password),
    sessionSecret: randomBytes(32).toString("hex"),
  };
  await insertLocalUser(login);
  return toSession(login);
}

export async function login(password: string): Promise<UserSession | null> {
  const found = await getOnlyLocalLogin();
  if (!found || !verifyPassword(password, found.passwordHash)) return null;
  await setSessionCookie(found);
  return toSession(found);
}

async function setSessionCookie(user: LocalLogin): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, mintToken(user.id, user.sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
    // localhost is http. Mark the cookie secure only when served over https.
    secure: process.env.NODE_ENV === "production" && process.env.FORCE_INSECURE_COOKIE !== "1",
  });
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/* The token names its user; that user's secret must have signed it. */
export async function getLocalSession(): Promise<UserSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claimed = claimedUserId(token);
  if (!claimed) return null;
  const found = await getLocalLogin(claimed);
  if (!found || verifyToken(token, found.sessionSecret) !== found.id) return null;
  return toSession(found);
}
