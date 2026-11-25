/*
 * The slots every form's FilingInfo shares: who files, what each form still
 * asks, and the identity of the people on the return. filingInfo.ts joins each
 * form's own slots onto these and re-exports both types.
 */

import type { EngineDerivation } from "./types.js";
import type { FilingStatus, Phone, SSN } from "./values.js";

export interface MustFileResolution {
  decisionKey: string;
  /** undefined = waiting on decisionKey. */
  value: boolean | undefined;
  derivation: EngineDerivation | undefined;
}

export interface BaseFilingInfo {
  mustFile?: Readonly<Record<string, MustFileResolution>>;
  missingInputs?: Readonly<Record<string, readonly string[]>>;

  filingStatus?: FilingStatus;

  taxpayerFirstName?: string;
  taxpayerMiddleInitial?: string;
  taxpayerLastName?: string;
  taxpayerSSN?: SSN;
  taxpayerDateOfBirth?: string;
  // Born before Jan 2, 1961 = age 65 by the end of 2025 (1040 line 12d, CA 540 line 9).
  taxpayerBornBeforeJan2_1961?: boolean;
  taxpayerOccupation?: string;
  taxpayerPhone?: Phone;
  taxpayerEmail?: string;

  spouseFirstName?: string;
  spouseMiddleInitial?: string;
  spouseLastName?: string;
  spouseSSN?: SSN;
  spouseDateOfBirth?: string;
  spouseBornBeforeJan2_1961?: boolean;
  // Visually impaired (identity.blind facts): 1040 line 12d, CA 540 line 8.
  taxpayerBlind?: boolean;
  /** A joint return counts it (1040 line 12d, CA 540 line 8). */
  spouseBlind?: boolean;
  spouseOccupation?: string;

  homeAddressLine1?: string;
  homeAddressApt?: string;
  homeAddressCity?: string;
  homeAddressState?: string;
  homeAddressZip?: string;
  homeAddressCounty?: string;

  fullYearMEC?: boolean;
}
