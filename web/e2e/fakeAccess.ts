/*
 * A stand-in for Cloudflare Access: it serves a team's public keys where the
 * web app looks for them, and signs the token Access adds to each request.
 * The web app's own check runs unchanged (lib/accessAuth.ts).
 */

import { createSign, generateKeyPairSync, type KeyObject } from "node:crypto";
import { createServer, type Server } from "node:http";
import { ACCESS_AUD, ACCESS_ISSUER_PORT, ACCESS_TEAM_DOMAIN } from "./run";

const KEY_ID = "e2e-access-key";
const TOKEN_LIFE_SECONDS = 60 * 60;

const newKeys = () => generateKeyPairSync("rsa", { modulusLength: 2048 });
const team = newKeys();

const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");

function sign(email: string, key: KeyObject): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "RS256", kid: KEY_ID, typ: "JWT" });
  const payload = encode({
    iss: ACCESS_TEAM_DOMAIN,
    aud: [ACCESS_AUD],
    email,
    sub: email,
    iat: now,
    exp: now + TOKEN_LIFE_SECONDS,
  });
  const signature = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(key);
  return `${header}.${payload}.${signature.toString("base64url")}`;
}

/* The token Access gives a signed-in person. */
export const accessToken = (email: string): string => sign(email, team.privateKey);

/* The same claims, signed by a key the team does not have. */
export const forgedToken = (email: string): string => sign(email, newKeys().privateKey);

export function startFakeAccess(): Promise<Server> {
  const keys = {
    keys: [{ ...team.publicKey.export({ format: "jwk" }), kid: KEY_ID, alg: "RS256" }],
  };
  const server = createServer((request, response) => {
    const found = request.url === "/cdn-cgi/access/certs";
    response.writeHead(found ? 200 : 404, { "content-type": "application/json" });
    response.end(found ? JSON.stringify(keys) : "{}");
  });
  return new Promise((done) => server.listen(ACCESS_ISSUER_PORT, "127.0.0.1", () => done(server)));
}
