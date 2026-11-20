import { isIsoExerciseFactKey, makeIsoExerciseFactKey } from "@openreturn/engine/facts";
import { describe, expect, it } from "vitest";
import { keyDateOf } from "../../../../src/mastra/tools/ingest3921.js";

describe("keyDateOf", () => {
  it("turns the form's date into the key's date", () => {
    expect(keyDateOf("06/16/2025")).toBe("2025-06-16");
    expect(keyDateOf("6/2/2025")).toBe("2025-06-02");
  });

  it("keeps a date of another shape as a slug, so each exercise still has its own key", () => {
    const key = makeIsoExerciseFactKey("employers-name", keyDateOf("June 16, 2025"));
    expect(key).toBe("employer.employers-name.iso_exercise.june-16-2025");
    expect(isIsoExerciseFactKey(key)).toBe(true);
  });
});
