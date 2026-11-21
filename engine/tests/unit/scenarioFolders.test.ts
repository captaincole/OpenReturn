import { describe, expect, it } from "vitest";
import { lockedGoldenPath } from "../helpers/scenarioPdfName.js";
import {
  loadScenario,
  scenarioFolder,
  scenarioNames,
  syntheticScenarioNames,
} from "../scenarios/index.js";

describe("scenario folders", () => {
  it("names each scenario once across the two folders", () => {
    const names = scenarioNames();
    expect(new Set(names).size).toBe(names.length);
  });

  it("marks every synthetic scenario as unverified", async () => {
    const scenarios = await Promise.all(syntheticScenarioNames().map(loadScenario));
    const verified = scenarios.filter((scenario) => scenario.verification !== "unverified");
    expect(verified.map((scenario) => scenario.name)).toEqual([]);
  });

  it("finds a scenario's files in its own folder", () => {
    expect(scenarioFolder("alex")).toBe("alex");
    expect(lockedGoldenPath("alex", "form-1040")).toBe(
      "tests/scenarios/alex/docs/Alex-1040-Golden.pdf",
    );
    for (const name of syntheticScenarioNames()) {
      expect(scenarioFolder(name)).toBe(`synthetic/${name}`);
    }
  });
});
