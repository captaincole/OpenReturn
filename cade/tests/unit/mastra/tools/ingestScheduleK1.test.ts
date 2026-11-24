import { RequestContext } from "@mastra/core/request-context";
import {
  isK1HoldingFactKey,
  makePartnershipK1FactKey,
  readK1Facts,
  readK1HoldingFacts,
  type K1FactValue,
  type PartnershipK1FactValue,
} from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CadeRequestContext } from "../../../../src/mastra/server/requestContext";

type StoredFact = { key: string; value: unknown; category: string };

/* The facts the tools wrote, newest last; the filing lookup and the DB are stubs. */
const written = vi.hoisted(() => [] as StoredFact[]);

vi.mock("../../../../src/mastra/db/filings", () => ({
  resolveOwnerFilingForYear: async () => ({ id: "filing-test" }),
}));

vi.mock("../../../../src/mastra/db/taxFacts", () => ({
  recordFact: async (_scope: unknown, fact: StoredFact) => {
    written.push({ key: fact.key, value: fact.value, category: fact.category });
  },
  listFactsByKeys: async (_scope: unknown, _year: number, keys: string[]) =>
    keys.flatMap((key) => written.filter((fact) => fact.key === key).slice(-1)),
}));

const { boxCodeOf, boxLabelOf, ingestScheduleK1 } =
  await import("../../../../src/mastra/tools/ingestScheduleK1");
const { recordK1Holding } = await import("../../../../src/mastra/tools/recordK1Holding");

const context = {
  requestContext: new RequestContext<CadeRequestContext>([
    ["userId", "owner-test"],
    ["userEmail", "owner@example.test"],
  ]),
};

type Execute = (input: unknown, context: unknown) => Promise<Record<string, unknown>>;
const ingest = (input: unknown) => (ingestScheduleK1.execute as unknown as Execute)(input, context);
const recordHolding = (input: unknown) =>
  (recordK1Holding.execute as unknown as Execute)(input, context);

const PART = { "1120-S": "sCorporation", "1065": "partnership", "1041": "trust" } as const;

/* The tool's input for a K-1 fact: what a model reads off the K-1, in the tool's parts. */
function inputFor(entityId: string, value: K1FactValue) {
  const { form, entityName, entityEin, finalK1, amendedK1, boxes, section199A, ...own } = value;
  return {
    year: 2025,
    form,
    entityId,
    entityName,
    entityEin,
    finalK1,
    amendedK1,
    boxes,
    section199A,
    [PART[form]]: own,
  };
}

/* The scenario's K-1 fact, and its holding, by the scenario's name. */
async function scenarioK1(name: string) {
  const { facts } = await loadScenario(name);
  const [k1] = readK1Facts(facts).k1s;
  const holdingKey = facts.find((fact) => isK1HoldingFactKey(fact.key))!.key;
  const holding = readK1HoldingFacts(facts).holdings.get(holdingKey)!;
  const entityId = k1.key.slice(k1.key.lastIndexOf(".") + 1);
  return { k1, entityId, holdingKey, holding };
}

/* A partnership K-1 as the engine's fact holds it; no scenario has one yet. */
const partnershipK1: PartnershipK1FactValue = {
  form: "1065",
  entityName: "Cairhien Builders LP",
  entityEin: "00-0001065",
  finalK1: false,
  amendedK1: false,
  publiclyTraded: false,
  partnerType: "limited",
  profitPercent: 10,
  lossPercent: 10,
  capitalPercent: 10,
  liabilitiesAtEnd: { nonrecourse: 5000, recourse: 0 },
  capitalAccount: { beginning: 40000, currentYearNetIncome: 6000, ending: 46000 },
  boxes: [
    { box: "1", amount: 6000 },
    { box: "5", amount: 120 },
    { box: "20", code: "Z" },
  ],
  section199A: { businessName: "Cairhien Builders LP", qualifiedBusinessIncome: 6000 },
};

beforeEach(() => {
  written.length = 0;
});

describe("ingest-schedule-k1", () => {
  it.each(["gareth", "elaida", "lan", "min", "mat"])(
    "records the K-1 fact of scenario %s",
    async (name) => {
      const { k1, entityId, holdingKey } = await scenarioK1(name);
      const result = await ingest(inputFor(entityId, k1.value));
      expect(result).toEqual({ factKey: k1.key, entityId, holdingKey });
      expect(written).toEqual([{ key: k1.key, value: k1.value, category: "k1" }]);
    },
  );

  it("records a partnership K-1 fact", async () => {
    const key = makePartnershipK1FactKey("cairhien-builders");
    await ingest(inputFor("cairhien-builders", partnershipK1));
    expect(written).toEqual([{ key, value: partnershipK1, category: "k1" }]);
    expect(readK1Facts(written).malformedKeys).toEqual([]);
  });

  it("refuses a call that fills another form's part, and records nothing", async () => {
    const input = { ...inputFor("cairhien-builders", partnershipK1), trust: { isEstate: false } };
    await expect(ingest(input)).rejects.toThrow(/Nothing was recorded/);
    expect(written).toEqual([]);
  });

  it("spells a box and a code the way the box tables do", () => {
    expect(boxLabelOf(" Box 4A ")).toBe("4a");
    expect(boxLabelOf("17")).toBe("17");
    expect(boxCodeOf(" zz")).toBe("ZZ");
    expect(boxCodeOf(" ")).toBeUndefined();
  });
});

describe("record-k1-holding", () => {
  it("records the holding fact of scenario gareth", async () => {
    const { entityId, holdingKey, holding } = await scenarioK1("gareth");
    await recordHolding({ year: 2025, entityId, ...holding });
    expect(written).toEqual([{ key: holdingKey, value: holding, category: "k1" }]);
  });

  it("keeps the earlier answers when a later call gives others", async () => {
    const { entityId, holdingKey, holding } = await scenarioK1("elaida");
    const { owner, materiallyParticipated, ...basis } = holding;
    await recordHolding({ year: 2025, entityId, owner, materiallyParticipated });
    await recordHolding({ year: 2025, entityId, ...basis });
    expect(readK1HoldingFacts(written).holdings.get(holdingKey)).toEqual(holding);
  });
});
