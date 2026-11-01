/* Source: 2025 Form 8959, line 6. */

import { describe, expect, it } from "vitest";
import { excessMedicareWages } from "../../../../src/federal/8959/lines.js";

describe("Form 8959 line 6", () => {
  it.each([
    // label, line 4, line 5, line 6
    ["wages over the threshold", 243500, 200000, 43500],
    ["wages under the threshold", 150000, 200000, 0],
    ["no threshold yet: blank, not all wages", 243500, undefined, undefined],
  ] as Array<[string, number, number | undefined, number | undefined]>)(
    "%s",
    (_, line4, line5, expected) => {
      expect(excessMedicareWages(line4, line5)).toBe(expected);
    },
  );
});
