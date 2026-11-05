import { describe, expect, it } from "vitest";
import { default1099KFormId } from "../../../../src/mastra/tools/ingest1099K.js";
import { defaultWinId } from "../../../../src/mastra/tools/ingestW2G.js";
import { businessIdCandidates } from "../../../../src/mastra/tools/recordBusiness.js";

describe("defaultWinId", () => {
  it("gives two wins from one payer two ids", () => {
    const march = defaultWinId({ box1: 1250, box2: "03/14/2025" });
    const july = defaultWinId({ box1: 1250, box2: "07/02/2025" });
    expect(march).toBe("03-14-2025-125000");
    expect(march).not.toBe(july);
  });

  it("gives the same form read twice the same id", () => {
    expect(defaultWinId({ box1: 50000, box2: "10/10/2025" })).toBe(
      defaultWinId({ box1: 50000, box2: "10/10/2025" }),
    );
  });

  it("works with no date", () => {
    expect(defaultWinId({ box1: 600.5 })).toBe("undated-60050");
  });
});

describe("businessIdCandidates", () => {
  it("starts with the activity's slug, then numbers it", () => {
    expect(businessIdCandidates("consulting").slice(0, 3)).toEqual([
      "consulting",
      "consulting-2",
      "consulting-3",
    ]);
  });
});

describe("default1099KFormId", () => {
  it("uses the account number", () => {
    expect(default1099KFormId({ accountNumber: "MR-20417", box1a: 100000 })).toBe("mr-20417");
  });

  it("uses the box 1a cents with no account number", () => {
    expect(default1099KFormId({ box1a: 21500.25 })).toBe("gross-2150025");
  });
});
