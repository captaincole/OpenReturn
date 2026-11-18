import { accessEmail, type AccessSettings } from "@/lib/accessToken";
import { ACCESS_JWT_HEADER } from "@/lib/authMode";
import { getOrCreateUserByEmail, toSession, type UserSession } from "@/lib/userStore";
import { createRemoteJWKSet } from "jose";
import { headers } from "next/headers";

/*
 * Sign-in for an instance behind Cloudflare Access. Access signs each person
 * in and adds a signed token to every request. This module checks the token
 * (lib/accessToken.ts) and maps its email to a users row; the first visit
 * makes the row. A request that did not come through Access has no valid
 * token, so it has no session.
 *
 * CF_ACCESS_TEAM_DOMAIN is https://<team>.cloudflareaccess.com and
 * CF_ACCESS_AUD is the application's AUD tag. With either one missing, nobody
 * signs in.
 */

const LOOPBACK_HOSTS = ["127.0.0.1", "localhost", "[::1]"];

/* The keys must come over https. A loopback address is the exception, for a local check. */
function teamDomainUrl(value: string): URL | null {
  if (!URL.canParse(value)) return null;
  const url = new URL(value);
  const allowed = url.protocol === "https:" || LOOPBACK_HOSTS.includes(url.hostname);
  return allowed ? url : null;
}

/* jose keeps the fetched keys on this object, so one is kept for each team domain. */
const keysByDomain = new Map<string, AccessSettings["keys"]>();

function teamKeys(domain: URL): AccessSettings["keys"] {
  const found = keysByDomain.get(domain.origin);
  if (found) return found;
  const keys = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", domain));
  keysByDomain.set(domain.origin, keys);
  return keys;
}

function accessSettings(): AccessSettings | null {
  const audience = process.env.CF_ACCESS_AUD;
  const domain = teamDomainUrl(process.env.CF_ACCESS_TEAM_DOMAIN ?? "");
  if (!audience || !domain) return null;
  return { issuer: domain.origin, audience, keys: teamKeys(domain) };
}

export async function getAccessSession(): Promise<UserSession | null> {
  const settings = accessSettings();
  const token = (await headers()).get(ACCESS_JWT_HEADER);
  if (!settings || !token) return null;
  const email = await accessEmail(token, settings);
  return email ? toSession(await getOrCreateUserByEmail(email)) : null;
}
