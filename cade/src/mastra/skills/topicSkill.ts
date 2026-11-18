import { createSkill, type InlineSkill } from "@mastra/core/skills";

/* The part of a tool a skill needs: the id Cade loads and calls it by. */
type LoadableTool = { id: string };

/*
 * The rules for one document type or one topic, with the tools that record
 * it. Cade's prompt carries only the skill's name and description. He loads
 * the rules with the `skill` tool and the tools with `load_tool`
 * (agents/cade.ts), so a turn pays for a topic only when it comes up.
 */
export type TopicSkill<Tools extends Record<string, LoadableTool>> = {
  skill: InlineSkill;
  tools: Tools;
};

const quoted = (toolIds: string[]) => toolIds.map((id) => `\`${id}\``).join(", ");

/* The first line of a skill that has tools: they are not in the prompt until loaded. */
const loadLine = (toolIds: string[]) =>
  `Before the first call, load this skill's tools with \`load_tool\`: toolNames ${JSON.stringify(toolIds)}. The tools are ${quoted(toolIds)}.\n\n`;

export function topicSkill<Tools extends Record<string, LoadableTool>>(input: {
  name: string;
  description: string;
  tools: Tools;
  instructions: string;
}): TopicSkill<Tools> {
  const toolIds = Object.values(input.tools).map((tool) => tool.id);
  const instructions =
    toolIds.length === 0 ? input.instructions : loadLine(toolIds) + input.instructions;
  return {
    skill: createSkill({ name: input.name, description: input.description, instructions }),
    tools: input.tools,
  };
}
