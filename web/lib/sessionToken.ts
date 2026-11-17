import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * The session cookie's value: base64url({ uid, exp }) + "." + its HMAC.
 * Each user has a secret, so the reader first takes the user id from the
 * payload (claimedUserId, not yet trusted), loads that user's secret, and
 * then checks the signature (verifyToken).
 */

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface Payload {
  uid?: string;
  exp?: number;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function readPayload(payload: string): Payload | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof parsed === "object" && parsed !== null ? (parsed as Payload) : null;
  } catch {
    return null;
  }
}

function sameSignature(given: string, expected: string): boolean {
  const givenBytes = Buffer.from(given);
  const expectedBytes = Buffer.from(expected);
  return givenBytes.length === expectedBytes.length && timingSafeEqual(givenBytes, expectedBytes);
}

export function mintToken(userId: string, secret: string, now: number = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: now + SESSION_TTL_MS })).toString(
    "base64url",
  );
  return `${payload}.${sign(payload, secret)}`;
}

/* Whose token this says it is. Not proof: verifyToken decides. */
export function claimedUserId(token: string): string | null {
  const [payload] = token.split(".");
  const uid = payload ? readPayload(payload)?.uid : undefined;
  return typeof uid === "string" && uid.length > 0 ? uid : null;
}

/* The user id, when the secret signed this token and it has not expired. */
export function verifyToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!sameSignature(signature, sign(payload, secret))) return null;
  const parsed = readPayload(payload);
  if (typeof parsed?.uid !== "string" || typeof parsed.exp !== "number") return null;
  return parsed.exp < now ? null : parsed.uid;
}
