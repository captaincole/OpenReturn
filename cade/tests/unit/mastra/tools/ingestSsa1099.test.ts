import { makeSocialSecurityFactKey } from "@openreturn/engine/facts";
import { describe, expect, it } from "vitest";
import { ssaSlug } from "../../../../src/mastra/tools/ingestSsa1099.js";

describe("ssaSlug", () => {
  it("keeps the taxpayer's SSA-1099 on the key it always had", () => {
    expect(makeSocialSecurityFactKey(ssaSlug("taxpayer"))).toBe("payer.ssa.social_security");
  });

  it("gives the spouse's SSA-1099 its own key on a joint return", () => {
    expect(makeSocialSecurityFactKey(ssaSlug("spouse"))).toBe("payer.ssa-spouse.social_security");
  });
});
