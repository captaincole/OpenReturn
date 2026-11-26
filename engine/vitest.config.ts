import { defineConfig } from "vitest/config";

/*
 * A test here may evaluate a whole return several times. The heaviest ones
 * (Form 3800 with Form 8582-CR) take about 1.4 seconds alone, and several
 * agents run the suites at once on one machine, so the default 5 seconds
 * failed on tests that pass alone. The limit guards against a test that hangs,
 * not against a slow one.
 */
export default defineConfig({
  test: {
    testTimeout: 20_000,
  },
});
