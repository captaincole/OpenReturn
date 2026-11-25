/*
 * filesOnlyWithAmountOn: which field results keep a form on the return.
 * Another form's line (Form 8888 names Form 1040 line 35a) keeps it only with
 * an amount above 0, as before Form 2210 named several fields. The form's own
 * fields (Form 2210's Part II boxes) also keep it while blank or a gap.
 */

import { describe, expect, it } from "vitest";
import { keepsFormOnReturn } from "../../src/engine.js";
import { blocked, ok, unsupported } from "../../src/types.js";

const OTHER_FORM = false;
const OWN = true;

describe("Another form's line (Form 8888: Form 1040 line 35a)", () => {
  it("an amount above 0 keeps the form", () => {
    expect(keepsFormOnReturn(ok(3385, "", []), OTHER_FORM)).toBe(true);
  });

  it("0, a blank line, a gap or no result takes the form off", () => {
    expect(keepsFormOnReturn(ok(0, "", []), OTHER_FORM)).toBe(false);
    expect(keepsFormOnReturn(ok(undefined, "", []), OTHER_FORM)).toBe(false);
    expect(keepsFormOnReturn(blocked("waits"), OTHER_FORM)).toBe(false);
    expect(keepsFormOnReturn(unsupported("gap"), OTHER_FORM)).toBe(false);
    expect(keepsFormOnReturn(undefined, OTHER_FORM)).toBe(false);
  });
});

describe("The form's own box (Form 2210: Part II boxes A–E)", () => {
  it("a checked box keeps the form; an unchecked one does not", () => {
    expect(keepsFormOnReturn(ok(true, "", []), OWN)).toBe(true);
    expect(keepsFormOnReturn(ok(false, "", []), OWN)).toBe(false);
  });

  it("a blank box, a gap or no result keeps it, so its questions stay in sight", () => {
    expect(keepsFormOnReturn(blocked("waits"), OWN)).toBe(true);
    expect(keepsFormOnReturn(unsupported("gap"), OWN)).toBe(true);
    expect(keepsFormOnReturn(undefined, OWN)).toBe(true);
  });
});
