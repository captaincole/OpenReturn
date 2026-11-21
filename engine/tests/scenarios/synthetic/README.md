# Synthetic scenarios

A scenario in this folder is a taxpayer that we made up. It has no outside
source: no filed return, no benchmark case, no IRS test package.

- Nothing checks its expected values from outside. They are the engine's own
  output, read by a person against the form and its instructions, then locked.
- Each one sets `verification: "unverified"` in its `index.ts`. A unit test
  fails when one does not.
- Use one when a form has no answer key and a test must still render the
  filled PDF. Published examples go in unit tests, where they check the rule.

The scripts take the scenario's name, not its path:
`npx tsx scripts/renderScenario.ts --scenario=<name> --golden`.
