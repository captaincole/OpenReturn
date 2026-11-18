import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { accessEmail, type AccessSettings } from "./accessToken";

const ISSUER = "https://team.cloudflareaccess.com";
const AUDIENCE = "aud-of-this-application";
const NOW = new Date("2026-01-15T12:00:00Z");
const NOW_SECONDS = NOW.getTime() / 1000;

const team = await generateKeyPair("RS256");
const stranger = await generateKeyPair("RS256");
const keys = createLocalJWKSet({ keys: [{ ...(await exportJWK(team.publicKey)), kid: "team" }] });
const settings: AccessSettings = { issuer: ISSUER, audience: AUDIENCE, keys };

interface TokenParts {
  email?: unknown;
  issuer?: string;
  audience?: string;
  expires?: number;
  key?: CryptoKey;
}

function token(parts: TokenParts = {}): Promise<string> {
  const claims = "email" in parts ? { email: parts.email } : { email: "Guest@Example.com" };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "team" })
    .setIssuer(parts.issuer ?? ISSUER)
    .setAudience(parts.audience ?? AUDIENCE)
    .setExpirationTime(parts.expires ?? NOW_SECONDS + 60)
    .sign(parts.key ?? team.privateKey);
}

const emailOf = async (parts?: TokenParts) => accessEmail(await token(parts), settings, NOW);

describe("the Cloudflare Access token", () => {
  it("gives the signed-in person's email, in lower case", async () => {
    expect(await emailOf()).toBe("guest@example.com");
  });

  it("fails when another key signed it", async () => {
    expect(await emailOf({ key: stranger.privateKey })).toBeNull();
  });

  it("fails for another Access application", async () => {
    expect(await emailOf({ audience: "aud-of-another-application" })).toBeNull();
  });

  it("fails for another team", async () => {
    expect(await emailOf({ issuer: "https://other.cloudflareaccess.com" })).toBeNull();
  });

  it("fails after it expires", async () => {
    expect(await emailOf({ expires: NOW_SECONDS - 1 })).toBeNull();
  });

  it("fails with no email: a service token is not a person", async () => {
    expect(await emailOf({ email: undefined })).toBeNull();
    expect(await emailOf({ email: "" })).toBeNull();
  });

  it("fails for text that is not a token", async () => {
    expect(await accessEmail("not-a-token", settings, NOW)).toBeNull();
  });

  it("fails for a token with no signature check", async () => {
    const [, payload] = (await token()).split(".");
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    expect(await accessEmail(`${header}.${payload}.`, settings, NOW)).toBeNull();
  });
});
