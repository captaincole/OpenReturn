import { describe, expect, it } from "vitest";
import { topicSkills } from "../../../../src/mastra/skills";
import { ingestTools } from "../../../../src/mastra/tools/ingestTools";

const toolIdsOf = (tools: Record<string, { id: string }>) =>
  Object.values(tools).map((tool) => tool.id);

/*
 * The ingest tools are not in Cade's prompt: he loads one by the id its
 * skill names. A tool that no skill names can never be called.
 */
describe("topic skills", () => {
  it("names every ingest tool in a skill", () => {
    const named = new Set(topicSkills.flatMap((topic) => toolIdsOf(topic.tools)));
    const missing = toolIdsOf(ingestTools).filter((id) => !named.has(id));
    expect(missing).toEqual([]);
  });

  it("uses only tools Cade can load", () => {
    const loadable = new Set(toolIdsOf(ingestTools));
    const unknown = topicSkills
      .flatMap((topic) => toolIdsOf(topic.tools))
      .filter((id) => !loadable.has(id));
    expect(unknown).toEqual([]);
  });

  it("tells Cade to load each of a skill's tools", () => {
    for (const topic of topicSkills) {
      for (const id of toolIdsOf(topic.tools)) {
        expect(topic.skill.instructions, topic.skill.name).toContain(`"${id}"`);
      }
    }
  });

  it("gives each skill its own name", () => {
    const names = topicSkills.map((topic) => topic.skill.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
