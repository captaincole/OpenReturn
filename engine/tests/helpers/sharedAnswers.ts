/*
 * The required-inputs check removes one answer at a time and evaluates the
 * whole return again. Most answers of a scenario are shared ones (the name,
 * the address, the filing status, the main filing decisions): almost every
 * scenario has them, so removing them from every scenario repeats one check
 * about 190 times. This module picks, for each shared answer, a fixed sample
 * of scenarios that the everyday run removes it from. The full run
 * (`npm run test:inputs`) removes every answer from every scenario.
 */

/* An answer that this many scenarios or more have is a shared answer. */
export const SHARED_FROM = 20;

/* The number of scenarios the everyday run removes a shared answer from. */
export const SAMPLE_SIZE = 10;

export interface ScenarioAnswers {
  name: string;
  /* The keys of the answers the check can remove from this scenario. */
  keys: string[];
  /* Scenarios of one kind (filing status, state return) share a group. */
  group: string;
  /* The number of facts: the sample prefers the largest return of a group. */
  size: number;
}

function byGroup(holders: ScenarioAnswers[]): ScenarioAnswers[][] {
  const groups = new Map<string, ScenarioAnswers[]>();
  for (const holder of holders) {
    groups.set(holder.group, [...(groups.get(holder.group) ?? []), holder]);
  }
  return [...groups.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([, members]) =>
      members.sort((one, other) => other.size - one.size || one.name.localeCompare(other.name)),
    );
}

/*
 * Takes one scenario from each group in turn, the largest first, until the
 * sample is full. The order depends only on the scenarios, so two runs pick
 * the same sample.
 */
function sampleOf(holders: ScenarioAnswers[]): string[] {
  const groups = byGroup(holders);
  const longest = Math.max(...groups.map((members) => members.length));
  const inTurn = Array.from({ length: longest }, (_, round) =>
    groups.flatMap((members) => (round < members.length ? [members[round]] : [])),
  ).flat();
  return inTurn.slice(0, SAMPLE_SIZE).map((holder) => holder.name);
}

/*
 * For each shared answer, the names of the scenarios in its sample. An answer
 * that is not in the map is not shared: every scenario that has it is checked.
 */
export function sampledScenariosByKey(all: ScenarioAnswers[]): Map<string, Set<string>> {
  const holdersByKey = new Map<string, ScenarioAnswers[]>();
  for (const scenario of all) {
    for (const key of new Set(scenario.keys)) {
      holdersByKey.set(key, [...(holdersByKey.get(key) ?? []), scenario]);
    }
  }
  return new Map(
    [...holdersByKey.entries()]
      .filter(([, holders]) => holders.length >= SHARED_FROM)
      .map(([key, holders]) => [key, new Set(sampleOf(holders))]),
  );
}
