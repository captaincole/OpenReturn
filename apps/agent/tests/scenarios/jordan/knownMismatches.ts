/*
 * Jordan — known mismatches (the ratchet).
 *
 * Lines where the engine and the provisional expected values disagree
 * today. A disagreement is something to investigate, not proof the
 * engine is wrong: the expected values are not an answer key (see
 * expected.ts). The causes below are the current best reading. Each
 * listed line is reported, not failed. When a listed line starts to match, the run FAILS with
 * "now matches — remove from knownMismatches", so this list can only
 * shrink. Any mismatch NOT listed here fails as usual.
 *
 * Empty since 2026-10-15: every asserted line matches. Keep the file;
 * a new mismatch is recorded here with its cause.
 */

export const jordanKnownMismatches: Record<string, string> = {};
