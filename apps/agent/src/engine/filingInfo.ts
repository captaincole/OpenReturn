/*
 * FilingInfo — the typed boundary between resolved values and form
 * bindings.
 *
 * Three layers:
 *   1. BaseFilingInfo (this file) — slots EVERY form needs: taxpayer
 *      identity (name / SSN / address) plus the small set of scope
 *      decisions that span jurisdictions (filingStatus).
 *   2. <Form>FilingInfo (per-form files, for example
 *      federal/1040/filingInfo.ts) — extends BaseFilingInfo with slots
 *      specific to one form. Each form's bindings import their narrow
 *      type, and TS rejects misreads.
 *   3. FilingInfo (this file) — the runtime intersection of every
 *      per-form type. The resolver produces it; the engine carries it on
 *      DerivationContext.filingInfo. Individual bindings see only their
 *      narrower view via their function signature.
 *
 * To add a new slot:
 *   - Identity / cross-form scope → BaseFilingInfo here.
 *   - Form-specific → that form's filingInfo.ts. Also update the
 *     FilingInfo intersection in this file so the resolver returns the
 *     wider shape, and wire its slots in that form's resolver in
 *     filingInfoResolvers.ts. TS flags any binding that depends on a
 *     stale shape.
 */

import type { Form1040FilingInfo } from "./federal/1040/filingInfo.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import type { Form8959FilingInfo } from "./federal/8959/filingInfo.js";
import type { ScheduleAFilingInfo } from "./federal/schedule-a/filingInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import {
  makeResolverInputs,
  resolve1040Info,
  resolve540Info,
  resolve8949Info,
  resolve8959Info,
  resolveBaseInfo,
  resolveScheduleAInfo,
  resolveScheduleCaInfo,
  resolveScheduleDInfo,
} from "./filingInfoResolvers.js";
import type { Form540FilingInfo } from "./state/ca/540/filingInfo.js";
import type { ScheduleCaFilingInfo } from "./state/ca/schedule-ca/filingInfo.js";
import type { FilingStatus, Phone, SSN } from "./values.js";

// ─── Base (shared across every form) ─────────────────────────────────────

export interface BaseFilingInfo {
  // ─── Scope decisions used by multiple forms ──────────────────────────
  /** Single / MFJ / MFS / HOH / QSS. Drives standard-deduction and tax-table lookups on every jurisdiction's form. */
  filingStatus?: FilingStatus;

  // ─── Taxpayer identity ───────────────────────────────────────────────
  taxpayerFirstName?: string;
  taxpayerMiddleInitial?: string;
  taxpayerLastName?: string;
  taxpayerSSN?: SSN;
  taxpayerDateOfBirth?: string; // plain string; not yet typed as the ISODate brand
  taxpayerOccupation?: string;
  taxpayerPhone?: Phone;
  taxpayerEmail?: string;

  // ─── Spouse (MFJ / MFS) ──────────────────────────────────────────────
  spouseFirstName?: string;
  spouseMiddleInitial?: string;
  spouseLastName?: string;
  spouseSSN?: SSN;
  spouseOccupation?: string;

  // ─── Home address ────────────────────────────────────────────────────
  homeAddressLine1?: string;
  homeAddressApt?: string;
  homeAddressCity?: string;
  homeAddressState?: string;
  homeAddressZip?: string;
  homeAddressCounty?: string;

  // ─── Health coverage ─────────────────────────────────────────────────
  /**
   * Taxpayer had minimum essential coverage every month of the tax year.
   * The 2025 federal 1040 has no dedicated line for this, but CA 540
   * line 92 does, and other state forms may. Lives on base so any form's
   * binding can read it.
   */
  fullYearMEC?: boolean;
}

// ─── Runtime intersection (every form's view, all slots present) ─────────

/**
 * The combined shape the resolver produces and the engine carries on
 * DerivationContext.filingInfo. It intersects every per-form FilingInfo,
 * so it is assignable to any narrower per-form type at the binding
 * boundary.
 */
export type FilingInfo = BaseFilingInfo &
  Form1040FilingInfo &
  Form540FilingInfo &
  ScheduleCaFilingInfo &
  Form8949FilingInfo &
  ScheduleDFilingInfo &
  ScheduleAFilingInfo &
  Form8959FilingInfo;

// ─── Resolver (hand-coded stand-in for the AI layer) ─────────────────────

/**
 * Build FilingInfo from raw facts + decisions. Pure function: same inputs
 * → same output. An Anthropic-backed resolver will eventually produce the
 * same shape from less-structured inputs (uploaded PDFs, conversation
 * transcripts).
 *
 * The hand-coded resolver stays so Alex's offline integration test passes
 * without an LLM in the loop. Per-form slot resolution lives in
 * filingInfoResolvers.ts; this function builds the shared inputs view and
 * composes the per-form results.
 */
export function resolveFilingInfo(opts: {
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>;
  decisions: ReadonlyArray<{ decisionKey: string; decision: unknown }>;
}): FilingInfo {
  const inputs = makeResolverInputs(opts);
  return {
    ...resolveBaseInfo(inputs),
    ...resolve1040Info(inputs),
    ...resolve540Info(inputs),
    ...resolveScheduleCaInfo(inputs),
    ...resolve8949Info(inputs),
    ...resolveScheduleDInfo(inputs),
    ...resolve8959Info(inputs),
    ...resolveScheduleAInfo(inputs),
  };
}
