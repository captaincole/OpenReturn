import { jwtVerify, type JWTVerifyGetKey } from "jose";

/*
 * The check of a Cloudflare Access application token, as Cloudflare's
 * "Validate JWTs" page describes it: the signature against the team's public
 * keys, the issuer (the team domain) and the audience (the application's AUD
 * tag). The email is the person Access signed in. A service token has no
 * email, so it is no user.
 */

export interface AccessSettings {
  /* The team domain, for example https://<team>.cloudflareaccess.com */
  issuer: string;
  /* The Access application's AUD tag. */
  audience: string;
  keys: JWTVerifyGetKey;
}

/* The signed-in person's email in lower case, or null when the token fails any check. */
export async function accessEmail(
  token: string,
  settings: AccessSettings,
  now: Date = new Date(),
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, settings.keys, {
      issuer: settings.issuer,
      audience: settings.audience,
      algorithms: ["RS256"],
      requiredClaims: ["exp"],
      currentDate: now,
    });
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}
