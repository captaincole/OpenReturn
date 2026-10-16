/*
 * Fact catalog: the central registry of every "kind" of fact the engine
 * knows. Each kind defines:
 *   - Its category + key-shape convention (one regex, one file)
 *   - Its value-shape type
 *   - A typed read helper (getXFacts) used by form derivations
 *   - A typed key builder (makeXFactKey) used by ingest tools
 *
 * For a new fact kind, add a module under ./kinds/ and re-export it here.
 * This keeps the convention discoverable in one place and prevents
 * convention drift across forms.
 */

export * from "./kinds/dividends.js";
export * from "./kinds/hsaCoverage.js";
export * from "./kinds/hsaDistribution.js";
export * from "./kinds/interest.js";
export * from "./kinds/miscIncome.js";
export * from "./kinds/priorYear.js";
export * from "./kinds/retirementDistribution.js";
export * from "./kinds/trade.js";
export * from "./kinds/wages.js";
export * from "./rows.js";
