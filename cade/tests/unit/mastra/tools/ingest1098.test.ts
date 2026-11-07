import { describe, expect, it } from "vitest";
import { form1098Line8a } from "../../../../src/mastra/tools/ingest1098.js";

describe("form1098Line8a", () => {
  it("records the interest alone when the 1098 reports no points", () => {
    expect(form1098Line8a(8059)).toBe(8059);
  });

  it("adds the points reported in box 6 to the interest", () => {
    expect(form1098Line8a(8059, 1200)).toBe(9259);
  });
});
