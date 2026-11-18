/*
 * Behind Cloudflare Access the browser's proof of sign-in is Cloudflare's
 * cookie, which Cloudflare turns into the token on each request. The password
 * mode's own cookie is SameSite=Lax, so another site cannot post with it;
 * nothing gives Cloudflare's cookie that rule. So a request that changes
 * something must come from the app's own pages: its Origin, when the browser
 * sends one, must name the host the request was sent to.
 */

const READ_METHODS = ["GET", "HEAD", "OPTIONS"];

function hostOf(origin: string): string | null {
  return URL.canParse(origin) ? new URL(origin).host : null;
}

export function isCrossSiteWrite(method: string, origin: string | null, host: string | null) {
  if (READ_METHODS.includes(method.toUpperCase()) || origin === null) return false;
  return host === null || hostOf(origin) !== host;
}
