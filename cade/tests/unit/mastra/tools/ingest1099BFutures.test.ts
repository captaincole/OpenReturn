import { isSection1256StatementFactKey } from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import {
  section1256StatementFact,
  type Ingest1099BFuturesInput,
} from "../../../../src/mastra/tools/ingest1099BFutures.js";

/* What Cade passes after reading each of hollis's made 1099-Bs (docs/01 and docs/02). */
const ridgelineCall: Ingest1099BFuturesInput = {
  year: 2025,
  accountSlug: "ridgeline-futures",
  payer: { name: "Ridgeline Futures LLC", tin: "00-0006782" },
  accountNumber: "RF-20417",
  box8: 9840,
  box9: -1250,
  box10: 2115,
  box11: 13205,
};

const mesaCall: Ingest1099BFuturesInput = {
  year: 2025,
  accountSlug: "mesa-commodity",
  payer: { name: "Mesa Commodity Partners", tin: "00-0006783" },
  accountNumber: "MCP-5531",
  box8: -4318,
  box11: -4318,
};

async function hollisFact(key: string) {
  const scenario = await loadScenario("hollis");
  const fact = scenario.facts.find((row) => row.key === key);
  if (!fact) throw new Error(`hollis has no fact ${key}`);
  return { category: fact.category, key: fact.key, value: fact.value };
}

describe("ingest-1099-b-futures", () => {
  it.each([
    ["Ridgeline, every box", ridgelineCall],
    ["Mesa, boxes 9 and 10 blank", mesaCall],
  ])("records the fact hollis holds: %s", async (_, call) => {
    const fact = section1256StatementFact(call);
    expect(isSection1256StatementFactKey(fact.key)).toBe(true);
    expect(fact).toEqual(await hollisFact(fact.key));
  });

  it("keys the account by the payer's name when no slug is given", () => {
    const { key } = section1256StatementFact({ ...mesaCall, accountSlug: undefined });
    expect(key).toBe("account.mesa-commodity-partners.section_1256");
  });

  it("leaves out an account number the form does not print", () => {
    const { value } = section1256StatementFact({ ...mesaCall, accountNumber: undefined });
    expect(value).toEqual({ brokerName: "Mesa Commodity Partners", box8: -4318, box11: -4318 });
  });
});
