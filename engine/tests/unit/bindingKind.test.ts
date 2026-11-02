import { describe, expect, it } from "vitest";
import { bindingKind } from "../../src/index.js";

describe("bindingKind", () => {
  it("tells a binding from an unsupported line and a line with neither", () => {
    expect(bindingKind("form-8959.0.line.1_medicare_wages_tips")).toBe("binding");
    expect(bindingKind("form-8959.0.line.2_unreported_tips")).toBe("unsupported");
    expect(bindingKind("form-8959.0.line.no_such_line")).toBeUndefined();
  });
});
