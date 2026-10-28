/*
 * The ratchet: a listed line is reported, not failed. A listed line that starts
 * to match FAILS, so the list only shrinks. Keep the file even when empty.
 */

export const jordanKnownMismatches: Record<string, string> = {};
