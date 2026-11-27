import { EIC_KEYS, FORM_8862_KEYS } from "@openreturn/engine/facts";
import { describe, expect, it } from "vitest";
import { topicSkills } from "../../../../src/mastra/skills";
import { creditQuestionsSkill } from "../../../../src/mastra/skills/creditQuestions";
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

  /*
   * The engine waits for each EIC and Form 8862 answer; a key the skill does
   * not name is a question Cade cannot ask. The denial question names Form
   * 8862's exception (a credit since allowed again on a Form 8862).
   */
  it("names every EIC and Form 8862 answer in the credit questions", () => {
    const eicKeys = [
      ...Object.values(EIC_KEYS),
      ...Object.values(FORM_8862_KEYS).filter((key) => key.startsWith("eic.")),
    ];
    const missing = eicKeys.filter((key) => !creditQuestionsSkill.skill.instructions.includes(key));
    expect(missing).toEqual([]);
    expect(creditQuestionsSkill.skill.instructions).toContain("not allowed again since");
  });

  it("gives each skill its own name", () => {
    const names = topicSkills.map((topic) => topic.skill.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
