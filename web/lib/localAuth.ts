import { getOwnerAuthRow, insertOwnerRow, type OwnerAuthRow } from "@/lib/serverDb";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/*
 * Single-user auth. The owner row holds the scrypt hash and the cookie HMAC
 * secret (made at setup, no env var). Keep this module small enough to audit.
 * Only getOwnerSession() verifies; proxy.ts checks cookie presence only.
 */

export const SESSION_COOKIE = "openreturn_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface OwnerSession {
  userId: string;
  email: string;
  displayName: string;
}

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

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function mintToken(userId: string, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token: string, secret: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      uid?: string;
      exp?: number;
    };
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed.uid;
  } catch {
    return null;
  }
}

export async function ownerExists(): Promise<boolean> {
  return (await getOwnerAuthRow()) !== null;
}

export async function createOwner(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<OwnerSession> {
  if (await ownerExists()) throw new Error("owner already exists");
  const row: OwnerAuthRow = {
    id: crypto.randomUUID(),
    email: input.email,
    displayName: input.displayName,
    passwordHash: hashPassword(input.password),
    sessionSecret: randomBytes(32).toString("hex"),
  };
  await insertOwnerRow(row);
  return { userId: row.id, email: row.email, displayName: row.displayName };
}

export async function login(password: string): Promise<OwnerSession | null> {
  const owner = await getOwnerAuthRow();
  if (!owner || !verifyPassword(password, owner.passwordHash)) return null;
  await setSessionCookie(owner);
  return { userId: owner.id, email: owner.email, displayName: owner.displayName };
}

export async function setSessionCookie(owner: OwnerAuthRow): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, mintToken(owner.id, owner.sessionSecret), {
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

export async function getOwnerSession(): Promise<OwnerSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const owner = await getOwnerAuthRow();
  if (!owner) return null;
  const uid = verifyToken(token, owner.sessionSecret);
  if (!uid || uid !== owner.id) return null;
  return { userId: owner.id, email: owner.email, displayName: owner.displayName };
}
