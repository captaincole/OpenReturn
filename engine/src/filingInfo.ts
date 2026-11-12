/*
 * To add a slot: identity or cross-form scope goes on BaseFilingInfo. A
 * form-specific slot goes in that form's filingInfo.ts, joins the FilingInfo
 * intersection below, and gets wired in the form's resolver.
 */

import type { Form1040FilingInfo } from "./federal/1040/filingInfo.js";
import { resolve1040Info } from "./federal/1040/resolveInfo.js";
import type { Form4684FilingInfo } from "./federal/4684/filingInfo.js";
import { resolve4684Info } from "./federal/4684/resolveInfo.js";
import type { Form4952FilingInfo } from "./federal/4952/filingInfo.js";
import { resolve4952Info } from "./federal/4952/resolveInfo.js";
import type { Form5695FilingInfo } from "./federal/5695/filingInfo.js";
import { resolve5695Info } from "./federal/5695/resolveInfo.js";
import type { Form6251FilingInfo } from "./federal/6251/filingInfo.js";
import { resolve6251Info } from "./federal/6251/resolveInfo.js";
import type { Form8582FilingInfo } from "./federal/8582/filingInfo.js";
import { resolve8582Info } from "./federal/8582/resolveInfo.js";
import type { Form8606FilingInfo } from "./federal/8606/filingInfo.js";
import { resolve8606Info } from "./federal/8606/resolveInfo.js";
import type { Form8889FilingInfo } from "./federal/8889/filingInfo.js";
import { resolve8889Info } from "./federal/8889/resolveInfo.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import type { Form8959FilingInfo } from "./federal/8959/filingInfo.js";
import { resolve8959Info } from "./federal/8959/resolveInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import type { Form8962FilingInfo } from "./federal/8962/filingInfo.js";
import { resolve8962Info } from "./federal/8962/resolveInfo.js";
import type { Form8995AScheduleCFilingInfo } from "./federal/8995-a-schedule-c/filingInfo.js";
import { resolve8995AScheduleCInfo } from "./federal/8995-a-schedule-c/resolveInfo.js";
import type { Form8995AFilingInfo } from "./federal/8995-a/filingInfo.js";
import { resolve8995AInfo } from "./federal/8995-a/resolveInfo.js";
import type { Form8995FilingInfo } from "./federal/8995/filingInfo.js";
import { resolve8995Info } from "./federal/8995/resolveInfo.js";
import type { QbiFilingInfo } from "./federal/qbi/filingInfo.js";
import { resolveQbiInfo } from "./federal/qbi/resolveInfo.js";
import type { Schedule1AFilingInfo } from "./federal/schedule-1-a/filingInfo.js";
import { resolveSchedule1AInfo } from "./federal/schedule-1-a/resolveInfo.js";
import type { Schedule1FilingInfo } from "./federal/schedule-1/filingInfo.js";
import type { Schedule2FilingInfo } from "./federal/schedule-2/filingInfo.js";
import type { Schedule3FilingInfo } from "./federal/schedule-3/filingInfo.js";
import { resolveSchedule3Info } from "./federal/schedule-3/resolveInfo.js";
import type { Schedule8812FilingInfo } from "./federal/schedule-8812/filingInfo.js";
import { resolveSchedule8812Info } from "./federal/schedule-8812/resolveInfo.js";
import type { ScheduleAFilingInfo } from "./federal/schedule-a/filingInfo.js";
import { resolveScheduleAInfo } from "./federal/schedule-a/resolveInfo.js";
import type { ScheduleBFilingInfo } from "./federal/schedule-b/filingInfo.js";
import type { ScheduleCFilingInfo } from "./federal/schedule-c/filingInfo.js";
import { resolveScheduleCInfo } from "./federal/schedule-c/resolveInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import type { ScheduleEFilingInfo } from "./federal/schedule-e/filingInfo.js";
import { resolveScheduleEInfo } from "./federal/schedule-e/resolveInfo.js";
import type { ScheduleEICFilingInfo } from "./federal/schedule-eic/filingInfo.js";
import { resolveScheduleEICInfo } from "./federal/schedule-eic/resolveInfo.js";
import type { ScheduleHFilingInfo } from "./federal/schedule-h/filingInfo.js";
import { resolveScheduleHInfo } from "./federal/schedule-h/resolveInfo.js";
import type { ScheduleRFilingInfo } from "./federal/schedule-r/filingInfo.js";
import { resolveScheduleRInfo } from "./federal/schedule-r/resolveInfo.js";
import type { ScheduleSEFilingInfo } from "./federal/schedule-se/filingInfo.js";
import { resolveScheduleSEInfo } from "./federal/schedule-se/resolveInfo.js";
import {
  makeResolverInputs,
  resolve540Info,
  resolve8949Info,
  resolve8960Info,
  resolveBaseInfo,
  resolveSchedule1Info,
  resolveSchedule2Info,
  resolveScheduleBInfo,
  resolveScheduleCaInfo,
  resolveScheduleDInfo,
} from "./filingInfoResolvers.js";
import type { Form3526FilingInfo } from "./state/ca/3526/filingInfo.js";
import { resolve3526Info } from "./state/ca/3526/resolveInfo.js";
import type { Form3805pFilingInfo } from "./state/ca/3805p/filingInfo.js";
import { resolve3805pInfo } from "./state/ca/3805p/resolveInfo.js";
import type { Form540FilingInfo } from "./state/ca/540/filingInfo.js";
import type { Form5805FilingInfo } from "./state/ca/5805/filingInfo.js";
import { resolve5805Info } from "./state/ca/5805/resolveInfo.js";
import type { ScheduleCaFilingInfo } from "./state/ca/schedule-ca/filingInfo.js";
import type { SchedulePFilingInfo } from "./state/ca/schedule-p/filingInfo.js";
import { resolveSchedulePInfo } from "./state/ca/schedule-p/resolveInfo.js";
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
  Form3526FilingInfo &
  Form3805pFilingInfo &
  SchedulePFilingInfo &
  ScheduleCaFilingInfo &
  Form8949FilingInfo &
  ScheduleDFilingInfo &
  ScheduleAFilingInfo &
  ScheduleBFilingInfo &
  ScheduleCFilingInfo &
  ScheduleSEFilingInfo &
  Form8606FilingInfo &
  Form8889FilingInfo &
  Form8959FilingInfo &
  Form4952FilingInfo &
  Schedule8812FilingInfo &
  Form8960FilingInfo &
  Form8995AFilingInfo &
  Form8995FilingInfo &
  Form8962FilingInfo &
  QbiFilingInfo &
  Schedule1FilingInfo &
  Schedule1AFilingInfo &
  Schedule2FilingInfo &
  Schedule3FilingInfo &
  ScheduleHFilingInfo &
  Form5695FilingInfo &
  Form6251FilingInfo &
  ScheduleEFilingInfo &
  Form8582FilingInfo &
  Form8995AScheduleCFilingInfo &
  Form4684FilingInfo &
  ScheduleEICFilingInfo &
  ScheduleRFilingInfo;

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
    resolve3526Info(inputs),
    resolve3805pInfo(inputs),
    resolveSchedulePInfo(inputs),
    resolveScheduleCaInfo(inputs),
    resolve8949Info(inputs),
    resolveScheduleDInfo(inputs),
    resolve8606Info(inputs),
    resolve8889Info(inputs),
    resolve8959Info(inputs),
    resolve4952Info(inputs),
    resolveSchedule8812Info(inputs),
    resolve8960Info(inputs),
    resolve8995AInfo(inputs),
    resolve8995Info(inputs),
    resolve8962Info(inputs),
    resolveQbiInfo(inputs),
    resolveSchedule1Info(inputs),
    resolveSchedule1AInfo(inputs),
    resolveSchedule2Info(inputs),
    resolveSchedule3Info(inputs),
    resolveScheduleHInfo(inputs),
    resolve5695Info(inputs),
    resolveScheduleAInfo(inputs),
    resolveScheduleBInfo(inputs),
    resolveScheduleCInfo(inputs),
    resolveScheduleSEInfo(inputs),
    resolve6251Info(inputs),
    resolveScheduleEInfo(inputs),
    resolve8582Info(inputs),
    resolve8995AScheduleCInfo(inputs),
    resolve4684Info(inputs),
    resolveScheduleEICInfo(inputs),
    resolveScheduleRInfo(inputs),
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
