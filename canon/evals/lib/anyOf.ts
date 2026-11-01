/* A group passes when any one option matches. A case passes when every group passes. */
export type AnyOf = string[];

export const anyOf = (...options: string[]): AnyOf => options;

export const hitsAll = (groups: AnyOf[], found: Set<string>) =>
  groups.every((group) => group.some((option) => found.has(option)));
