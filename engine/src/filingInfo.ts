/*
 * To add a slot: identity or cross-form scope goes on BaseFilingInfo. A
 * form-specific slot goes in that form's filingInfo.ts, joins the FilingInfo
 * intersection below, and gets wired in the form's resolver.
 */

import type { Form1040FilingInfo } from "./federal/1040/filingInfo.js";
import { resolve1040Info } from "./federal/1040/resolveInfo.js";
import type { Form5695FilingInfo } from "./federal/5695/filingInfo.js";
import { resolve5695Info } from "./federal/5695/resolveInfo.js";
import type { Form8889FilingInfo } from "./federal/8889/filingInfo.js";
import { resolve8889Info } from "./federal/8889/resolveInfo.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import type { Form8959FilingInfo } from "./federal/8959/filingInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import type { Form8995AFilingInfo } from "./federal/8995-a/filingInfo.js";
import { resolve8995AInfo } from "./federal/8995-a/resolveInfo.js";
import type { Schedule1FilingInfo } from "./federal/schedule-1/filingInfo.js";
import type { Schedule2FilingInfo } from "./federal/schedule-2/filingInfo.js";
import type { Schedule3FilingInfo } from "./federal/schedule-3/filingInfo.js";
import { resolveSchedule3Info } from "./federal/schedule-3/resolveInfo.js";
import type { ScheduleAFilingInfo } from "./federal/schedule-a/filingInfo.js";
import type { ScheduleBFilingInfo } from "./federal/schedule-b/filingInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import type { ScheduleHFilingInfo } from "./federal/schedule-h/filingInfo.js";
import { resolveScheduleHInfo } from "./federal/schedule-h/resolveInfo.js";
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
  spouseOccupation?: string;

  homeAddressLine1?: string;
  homeAddressApt?: string;
  homeAddressCity?: string;
  homeAddressState?: string;
  homeAddressZip?: string;
  homeAddressCounty?: string;

  fullYearMEC?: boolean;
}

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
  Schedule2FilingInfo &
  Schedule3FilingInfo &
  ScheduleHFilingInfo &
  Form5695FilingInfo;

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
    resolveSchedule3Info(inputs),
    resolveScheduleHInfo(inputs),
    resolve5695Info(inputs),
    resolveScheduleAInfo(inputs),
    resolveScheduleBInfo(inputs),
  ]);
}

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
