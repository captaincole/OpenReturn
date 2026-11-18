import { describe, expect, it } from "vitest";
import { isCrossSiteWrite } from "./crossSite";

const HOST = "taxes.example.com";

describe("a write from another site", () => {
  it("lets the app's own pages write", () => {
    expect(isCrossSiteWrite("POST", `https://${HOST}`, HOST)).toBe(false);
    expect(isCrossSiteWrite("DELETE", "http://localhost:3000", "localhost:3000")).toBe(false);
  });

  it("refuses a write from another site", () => {
    expect(isCrossSiteWrite("POST", "https://evil.example", HOST)).toBe(true);
    expect(isCrossSiteWrite("post", `https://sub.${HOST}`, HOST)).toBe(true);
    expect(isCrossSiteWrite("DELETE", `https://${HOST}:8443`, HOST)).toBe(true);
  });

  it("refuses an origin it cannot read", () => {
    expect(isCrossSiteWrite("POST", "null", HOST)).toBe(true);
    expect(isCrossSiteWrite("POST", `https://${HOST}`, null)).toBe(true);
  });

  it("lets a read through, and a caller that sends no Origin", () => {
    expect(isCrossSiteWrite("GET", "https://evil.example", HOST)).toBe(false);
    expect(isCrossSiteWrite("POST", null, HOST)).toBe(false);
  });
});
