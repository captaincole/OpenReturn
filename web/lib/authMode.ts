/*
 * How a person signs in to this instance (AUTH_MODE):
 *
 * - "local" (the default): the one password of lib/localAuth.ts.
 * - "cloudflare-access": the instance is behind Cloudflare Access, which
 *   signs each person in by email (lib/accessAuth.ts). No password, no
 *   /setup, and more than one user.
 *
 * Env is read per call: proxy.ts and the server both use this.
 */

export type AuthMode = "local" | "cloudflare-access";

export const authMode = (): AuthMode =>
  process.env.AUTH_MODE === "cloudflare-access" ? "cloudflare-access" : "local";

export const behindAccess = (): boolean => authMode() === "cloudflare-access";

/* The request header that carries the token Cloudflare Access signed. */
export const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

/* Cloudflare serves this path on the application's own domain. */
export const ACCESS_SIGN_OUT_PATH = "/cdn-cgi/access/logout";
