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
 * Must-file is one keyed slot on BaseFilingInfo (mustFile[formId]).
 * Each form's resolver writes its entry with resolveMustFile. Required
 * inputs work the same way: missingInputs[formId] lists the inputs that
 * form still needs, written with missingInputs() from resolverInputs.ts.
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
import { resolve1040Info } from "./federal/1040/resolveInfo.js";
import type { Form8889FilingInfo } from "./federal/8889/filingInfo.js";
import { resolve8889Info } from "./federal/8889/resolveInfo.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import type { Form8959FilingInfo } from "./federal/8959/filingInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import type { Form8995AFilingInfo } from "./federal/8995-a/filingInfo.js";
import { resolve8995AInfo } from "./federal/8995-a/resolveInfo.js";
import type { Schedule1FilingInfo } from "./federal/schedule-1/filingInfo.js";
import type { Schedule2FilingInfo } from "./federal/schedule-2/filingInfo.js";
import type { ScheduleAFilingInfo } from "./federal/schedule-a/filingInfo.js";
import type { ScheduleBFilingInfo } from "./federal/schedule-b/filingInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import {
  makeResolverInputs,
  resolve540Info,
  resolve8949Info,
  resolve8959Info,
  resolve8960Info,
  resolveBaseInfo,
  resolveSchedule1Info,
  resolveSchedule2Info,
  resolveScheduleAInfo,
  resolveScheduleBInfo,
  resolveScheduleCaInfo,
  resolveScheduleDInfo,
} from "./filingInfoResolvers.js";
import type { Form540FilingInfo } from "./state/ca/540/filingInfo.js";
import type { Form5805FilingInfo } from "./state/ca/5805/filingInfo.js";
import { resolve5805Info } from "./state/ca/5805/resolveInfo.js";
import type { ScheduleCaFilingInfo } from "./state/ca/schedule-ca/filingInfo.js";
import type { EngineDerivation } from "./types.js";
import type { FilingStatus, Phone, SSN } from "./values.js";

// ─── Base (shared across every form) ─────────────────────────────────────

/**
 * One form's must-file determination. Each form's resolver writes it
 * through resolveMustFile (resolverInputs.ts); the engine reads it by
 * formId.
 */
export interface MustFileResolution {
  /** The explicit decision that wins over the fallbacks (for example "decisions.scope.must_file_8889"). */
  decisionKey: string;
  /** True = file, false = do not file, undefined = waiting on decisionKey. */
  value: boolean | undefined;
  /** Provenance for value. Undefined while value is undefined. */
  derivation: EngineDerivation | undefined;
}

export interface BaseFilingInfo {
  /** Must-file determination per form, keyed by formId ("form-1040", "schedule-d", …). */
  mustFile?: Readonly<Record<string, MustFileResolution>>;
  /**
   * Required inputs each form still needs, keyed by formId: the fact or
   * decision keys to record. A filed form is not complete until its list
   * is empty. A recorded 0 or false counts as an input.
   */
  missingInputs?: Readonly<Record<string, readonly string[]>>;

  // ─── Scope decisions used by multiple forms ──────────────────────────
  /** Single / MFJ / MFS / HOH / QSS. Drives standard-deduction and tax-table lookups on every jurisdiction's form. */
  filingStatus?: FilingStatus;

  // ─── Taxpayer identity ───────────────────────────────────────────────
  taxpayerFirstName?: string;
  taxpayerMiddleInitial?: string;
  taxpayerLastName?: string;
  taxpayerSSN?: SSN;
  taxpayerDateOfBirth?: string; // plain string; not yet typed as the ISODate brand
  /**
   * Born before January 2, 1961: age 65 by the end of 2025. Drives the
   * 1040 line 12d box (larger standard deduction) and the CA 540 line 9
   * senior exemption. Undefined when the date of birth is unknown.
   */
  taxpayerBornBeforeJan2_1961?: boolean;
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
  Form5805FilingInfo &
  ScheduleCaFilingInfo &
  Form8949FilingInfo &
  ScheduleDFilingInfo &
  ScheduleAFilingInfo &
  ScheduleBFilingInfo &
  Form8889FilingInfo &
  Form8959FilingInfo &
  Form8960FilingInfo &
  Form8995AFilingInfo &
  Schedule1FilingInfo &
  Schedule2FilingInfo;

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
  return mergeInfo([
    resolveBaseInfo(inputs),
    resolve1040Info(inputs),
    resolve540Info(inputs),
    resolve5805Info(inputs),
    resolveScheduleCaInfo(inputs),
    resolve8949Info(inputs),
    resolveScheduleDInfo(inputs),
    resolve8889Info(inputs),
    resolve8959Info(inputs),
    resolve8960Info(inputs),
    resolve8995AInfo(inputs),
    resolveSchedule1Info(inputs),
    resolveSchedule2Info(inputs),
    resolveScheduleAInfo(inputs),
    resolveScheduleBInfo(inputs),
  ]);
}

/* Spread every per-form slice; the per-form maps merge instead of overwriting. */
function mergeInfo(parts: ReadonlyArray<BaseFilingInfo>): FilingInfo {
  return parts.reduce<FilingInfo>(
    (acc, part) => ({
      ...acc,
      ...part,
      mustFile: { ...acc.mustFile, ...part.mustFile },
      missingInputs: { ...acc.missingInputs, ...part.missingInputs },
    }),
    {},
  );
}
