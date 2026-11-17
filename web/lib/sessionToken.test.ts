import { describe, expect, it } from "vitest";
import { claimedUserId, mintToken, SESSION_TTL_MS, verifyToken } from "./sessionToken";

const NOW = 1_800_000_000_000;
const token = mintToken("user-a", "secret-a", NOW);

describe("the session token", () => {
  it("names its user before the check, and proves it after", () => {
    expect(claimedUserId(token)).toBe("user-a");
    expect(verifyToken(token, "secret-a", NOW)).toBe("user-a");
  });

  it("fails against another user's secret", () => {
    expect(verifyToken(token, "secret-b", NOW)).toBeNull();
  });

  it("fails when the payload names another user", () => {
    const [, signature] = token.split(".");
    const payload = Buffer.from(JSON.stringify({ uid: "user-b", exp: NOW + 1000 })).toString(
      "base64url",
    );
    const forged = `${payload}.${signature}`;
    expect(claimedUserId(forged)).toBe("user-b");
    expect(verifyToken(forged, "secret-a", NOW)).toBeNull();
    expect(verifyToken(forged, "secret-b", NOW)).toBeNull();
  });

  it("fails after it expires", () => {
    expect(verifyToken(token, "secret-a", NOW + SESSION_TTL_MS - 1)).toBe("user-a");
    expect(verifyToken(token, "secret-a", NOW + SESSION_TTL_MS + 1)).toBeNull();
  });

  it("reads no user from text that is not a token", () => {
    for (const text of ["", "abc", "abc.def", `${Buffer.from("[]").toString("base64url")}.x`]) {
      expect(claimedUserId(text)).toBeNull();
      expect(verifyToken(text, "secret-a", NOW)).toBeNull();
    }
  });
});
