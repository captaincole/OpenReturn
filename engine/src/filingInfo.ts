/*
 * To add a slot: identity or cross-form scope goes on BaseFilingInfo. A
 * form-specific slot goes in that form's filingInfo.ts, joins the FilingInfo
 * intersection below, and gets wired in the form's resolver.
 */

import type { Form1040FilingInfo } from "./federal/1040/filingInfo.js";
import { resolve1040Info } from "./federal/1040/resolveInfo.js";
import type { Form1116FilingInfo } from "./federal/1116/filingInfo.js";
import { resolve1116Info } from "./federal/1116/resolveInfo.js";
import type { Form2106FilingInfo } from "./federal/2106/filingInfo.js";
import { resolve2106Info } from "./federal/2106/resolveInfo.js";
import type { Form2210FilingInfo } from "./federal/2210/filingInfo.js";
import { resolve2210Info } from "./federal/2210/resolveInfo.js";
import type { Form2441FilingInfo } from "./federal/2441/filingInfo.js";
import { resolve2441Info } from "./federal/2441/resolveInfo.js";
import type { Form2555FilingInfo } from "./federal/2555/filingInfo.js";
import { resolve2555Info } from "./federal/2555/resolveInfo.js";
import type { Form3800FilingInfo } from "./federal/3800/filingInfo.js";
import { resolve3800Info } from "./federal/3800/resolveInfo.js";
import type { Form3903FilingInfo } from "./federal/3903/filingInfo.js";
import { resolve3903Info } from "./federal/3903/resolveInfo.js";
import type { Form4137FilingInfo } from "./federal/4137/filingInfo.js";
import { resolve4137Info } from "./federal/4137/resolveInfo.js";
import type { Form4562FilingInfo } from "./federal/4562/filingInfo.js";
import { resolve4562Info } from "./federal/4562/resolveInfo.js";
import type { Form461FilingInfo } from "./federal/461/filingInfo.js";
import { resolve461Info } from "./federal/461/resolveInfo.js";
import type { Form4684FilingInfo } from "./federal/4684/filingInfo.js";
import { resolve4684Info } from "./federal/4684/resolveInfo.js";
import type { Form4952FilingInfo } from "./federal/4952/filingInfo.js";
import { resolve4952Info } from "./federal/4952/resolveInfo.js";
import type { Form4970FilingInfo } from "./federal/4970/filingInfo.js";
import { resolve4970Info } from "./federal/4970/resolveInfo.js";
import type { Form4972FilingInfo } from "./federal/4972/filingInfo.js";
import { resolve4972Info } from "./federal/4972/resolveInfo.js";
import type { Form5329FilingInfo } from "./federal/5329/filingInfo.js";
import { resolve5329Info } from "./federal/5329/resolveInfo.js";
import type { Form5695FilingInfo } from "./federal/5695/filingInfo.js";
import { resolve5695Info } from "./federal/5695/resolveInfo.js";
import type { Form6198FilingInfo } from "./federal/6198/filingInfo.js";
import { resolve6198Info } from "./federal/6198/resolveInfo.js";
import type { Form6251FilingInfo } from "./federal/6251/filingInfo.js";
import { resolve6251Info } from "./federal/6251/resolveInfo.js";
import type { Form6781FilingInfo } from "./federal/6781/filingInfo.js";
import { resolve6781Info } from "./federal/6781/resolveInfo.js";
import type { Form7203FilingInfo } from "./federal/7203/filingInfo.js";
import { resolve7203Info } from "./federal/7203/resolveInfo.js";
import type { Form8283FilingInfo } from "./federal/8283/filingInfo.js";
import { resolve8283Info } from "./federal/8283/resolveInfo.js";
import type { Form8396FilingInfo } from "./federal/8396/filingInfo.js";
import { resolve8396Info } from "./federal/8396/resolveInfo.js";
import type { Form8582FilingInfo } from "./federal/8582/filingInfo.js";
import { resolve8582Info } from "./federal/8582/resolveInfo.js";
import type { Form8606FilingInfo } from "./federal/8606/filingInfo.js";
import { resolve8606Info } from "./federal/8606/resolveInfo.js";
import type { Form8615FilingInfo } from "./federal/8615/filingInfo.js";
import { resolve8615Info } from "./federal/8615/resolveInfo.js";
import type { Form8621FilingInfo } from "./federal/8621/filingInfo.js";
import { resolve8621Info } from "./federal/8621/resolveInfo.js";
import type { Form8801FilingInfo } from "./federal/8801/filingInfo.js";
import { resolve8801Info } from "./federal/8801/resolveInfo.js";
import type { Form8814FilingInfo } from "./federal/8814/filingInfo.js";
import { resolve8814Info } from "./federal/8814/resolveInfo.js";
import type { Form8815FilingInfo } from "./federal/8815/filingInfo.js";
import { resolve8815Info } from "./federal/8815/resolveInfo.js";
import type { Form8829FilingInfo } from "./federal/8829/filingInfo.js";
import { resolve8829Info } from "./federal/8829/resolveInfo.js";
import type { Form8839FilingInfo } from "./federal/8839/filingInfo.js";
import { resolve8839Info } from "./federal/8839/resolveInfo.js";
import type { Form8853FilingInfo } from "./federal/8853/filingInfo.js";
import { resolve8853Info } from "./federal/8853/resolveInfo.js";
import type { Form8863FilingInfo } from "./federal/8863/filingInfo.js";
import { resolve8863Info } from "./federal/8863/resolveInfo.js";
import type { Form8880FilingInfo } from "./federal/8880/filingInfo.js";
import { resolve8880Info } from "./federal/8880/resolveInfo.js";
import type { Form8889FilingInfo } from "./federal/8889/filingInfo.js";
import { resolve8889Info } from "./federal/8889/resolveInfo.js";
import type { Form8911FilingInfo } from "./federal/8911/filingInfo.js";
import { resolve8911Info } from "./federal/8911/resolveInfo.js";
import type { Form8915FFilingInfo } from "./federal/8915-f/filingInfo.js";
import { resolve8915FInfo } from "./federal/8915-f/resolveInfo.js";
import type { Form8919FilingInfo } from "./federal/8919/filingInfo.js";
import { resolve8919Info } from "./federal/8919/resolveInfo.js";
import type { Form8936FilingInfo } from "./federal/8936/filingInfo.js";
import { resolve8936Info } from "./federal/8936/resolveInfo.js";
import type { Form8938FilingInfo } from "./federal/8938/filingInfo.js";
import { resolve8938Info } from "./federal/8938/resolveInfo.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import type { Form8959FilingInfo } from "./federal/8959/filingInfo.js";
import { resolve8959Info } from "./federal/8959/resolveInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import type { Form8962FilingInfo } from "./federal/8962/filingInfo.js";
import { resolve8962Info } from "./federal/8962/resolveInfo.js";
import type { Form8978FilingInfo } from "./federal/8978/filingInfo.js";
import { resolve8978Info } from "./federal/8978/resolveInfo.js";
import type { Form8995AScheduleCFilingInfo } from "./federal/8995-a-schedule-c/filingInfo.js";
import { resolve8995AScheduleCInfo } from "./federal/8995-a-schedule-c/resolveInfo.js";
import type { Form8995AFilingInfo } from "./federal/8995-a/filingInfo.js";
import { resolve8995AInfo } from "./federal/8995-a/resolveInfo.js";
import type { Form8995FilingInfo } from "./federal/8995/filingInfo.js";
import { resolve8995Info } from "./federal/8995/resolveInfo.js";
import { FARM_FORMS_RESOLVERS, type FarmFormsFilingInfo } from "./federal/farmForms.js";
import {
  FEDERAL_FORMS_WITH_NO_RULES_RESOLVERS,
  type FederalFormsWithNoRulesFilingInfo,
} from "./federal/formsWithNoRules.js";
import type { QbiFilingInfo } from "./federal/qbi/filingInfo.js";
import { resolveQbiInfo } from "./federal/qbi/resolveInfo.js";
import {
  RECAPTURE_FORMS_RESOLVERS,
  type RecaptureFormsFilingInfo,
} from "./federal/recaptureForms.js";
import { REFUND_FORMS_RESOLVERS, type RefundFormsFilingInfo } from "./federal/refundForms.js";
import { SALE_FORMS_RESOLVERS, type SaleFormsFilingInfo } from "./federal/saleForms.js";
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
  type ResolverInputs,
} from "./filingInfoResolvers.js";
import type { Form3506FilingInfo } from "./state/ca/3506/filingInfo.js";
import { resolve3506Info } from "./state/ca/3506/resolveInfo.js";
import type { Form3514FilingInfo } from "./state/ca/3514/filingInfo.js";
import { resolve3514Info } from "./state/ca/3514/resolveInfo.js";
import type { Form3526FilingInfo } from "./state/ca/3526/filingInfo.js";
import { resolve3526Info } from "./state/ca/3526/resolveInfo.js";
import type { Form3532FilingInfo } from "./state/ca/3532/filingInfo.js";
import { resolve3532Info } from "./state/ca/3532/resolveInfo.js";
import type { Form3805pFilingInfo } from "./state/ca/3805p/filingInfo.js";
import { resolve3805pInfo } from "./state/ca/3805p/resolveInfo.js";
import type { Form3885AFilingInfo } from "./state/ca/3885a/filingInfo.js";
import { resolve3885AInfo } from "./state/ca/3885a/resolveInfo.js";
import type { Form540FilingInfo } from "./state/ca/540/filingInfo.js";
import type { Form5805FilingInfo } from "./state/ca/5805/filingInfo.js";
import { resolve5805Info } from "./state/ca/5805/resolveInfo.js";
import {
  CALIFORNIA_FORMS_WITH_NO_RULES_RESOLVERS,
  type CaliforniaFormsWithNoRulesFilingInfo,
} from "./state/ca/formsWithNoRules.js";
import {
  LATER_CALIFORNIA_FORMS_RESOLVERS,
  type LaterCaliforniaFormsFilingInfo,
} from "./state/ca/laterForms.js";
import type { ScheduleCaFilingInfo } from "./state/ca/schedule-ca/filingInfo.js";
import type { ScheduleDCaFilingInfo } from "./state/ca/schedule-d-ca/filingInfo.js";
import { resolveScheduleDCaInfo } from "./state/ca/schedule-d-ca/resolveInfo.js";
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

export type FilingInfo = BaseFilingInfo &
  Form1040FilingInfo &
  Form540FilingInfo &
  Form5805FilingInfo &
  Form3506FilingInfo &
  Form3514FilingInfo &
  Form3526FilingInfo &
  Form3805pFilingInfo &
  SchedulePFilingInfo &
  Form3532FilingInfo &
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
  Form5329FilingInfo &
  Form5695FilingInfo &
  Form6251FilingInfo &
  ScheduleEFilingInfo &
  Form8582FilingInfo &
  Form8995AScheduleCFilingInfo &
  Form4684FilingInfo &
  ScheduleEICFilingInfo &
  ScheduleRFilingInfo &
  Form2441FilingInfo &
  Form4562FilingInfo &
  Form8829FilingInfo &
  Form3885AFilingInfo &
  ScheduleDCaFilingInfo &
  Form1116FilingInfo &
  Form2210FilingInfo &
  Form8283FilingInfo &
  Form8801FilingInfo &
  Form8814FilingInfo &
  Form6781FilingInfo &
  Form8978FilingInfo &
  Form8915FFilingInfo &
  Form3800FilingInfo &
  Form461FilingInfo &
  Form8621FilingInfo &
  SaleFormsFilingInfo &
  Form6198FilingInfo &
  Form7203FilingInfo &
  Form8936FilingInfo &
  Form8911FilingInfo &
  Form8839FilingInfo &
  Form8815FilingInfo &
  Form4137FilingInfo &
  Form8919FilingInfo &
  Form3903FilingInfo &
  Form2555FilingInfo &
  Form2106FilingInfo &
  Form8615FilingInfo &
  Form4970FilingInfo &
  Form4972FilingInfo &
  Form8396FilingInfo &
  Form8853FilingInfo &
  Form8880FilingInfo &
  RefundFormsFilingInfo &
  Form8863FilingInfo &
  Form8938FilingInfo &
  RecaptureFormsFilingInfo &
  FarmFormsFilingInfo &
  FederalFormsWithNoRulesFilingInfo &
  LaterCaliforniaFormsFilingInfo &
  CaliforniaFormsWithNoRulesFilingInfo;

/* One resolver per form. A new form adds its resolver here. */
const RESOLVERS: ReadonlyArray<(inputs: ResolverInputs) => BaseFilingInfo> = [
  resolveBaseInfo,
  resolve1040Info,
  resolve540Info,
  resolve5805Info,
  resolve3506Info,
  resolve3514Info,
  resolve3526Info,
  resolve3805pInfo,
  resolveSchedulePInfo,
  resolve3532Info,
  resolveScheduleCaInfo,
  resolve8949Info,
  resolveScheduleDInfo,
  resolve8606Info,
  resolve8889Info,
  resolve8959Info,
  resolve4952Info,
  resolveSchedule8812Info,
  resolve8960Info,
  resolve8995AInfo,
  resolve8995Info,
  resolve8962Info,
  resolveQbiInfo,
  resolveSchedule1Info,
  resolveSchedule1AInfo,
  resolveSchedule2Info,
  resolveSchedule3Info,
  resolveScheduleHInfo,
  resolve5329Info,
  resolve5695Info,
  resolveScheduleAInfo,
  resolveScheduleBInfo,
  resolveScheduleCInfo,
  resolveScheduleSEInfo,
  resolve6251Info,
  resolveScheduleEInfo,
  resolve8582Info,
  resolve8995AScheduleCInfo,
  resolve4684Info,
  resolveScheduleEICInfo,
  resolveScheduleRInfo,
  resolve2441Info,
  resolve4562Info,
  resolve8829Info,
  resolve3885AInfo,
  resolveScheduleDCaInfo,
  resolve1116Info,
  resolve2210Info,
  resolve8283Info,
  resolve8801Info,
  resolve8814Info,
  resolve6781Info,
  resolve8978Info,
  resolve8915FInfo,
  resolve3800Info,
  resolve461Info,
  resolve8621Info,
  ...SALE_FORMS_RESOLVERS,
  resolve6198Info,
  resolve7203Info,
  resolve8936Info,
  resolve8911Info,
  resolve8839Info,
  resolve8815Info,
  resolve4137Info,
  resolve8919Info,
  resolve3903Info,
  resolve2555Info,
  resolve2106Info,
  resolve8615Info,
  resolve4970Info,
  resolve4972Info,
  resolve8396Info,
  resolve8853Info,
  resolve8880Info,
  ...REFUND_FORMS_RESOLVERS,
  resolve8863Info,
  resolve8938Info,
  ...RECAPTURE_FORMS_RESOLVERS,
  ...FARM_FORMS_RESOLVERS,
  ...FEDERAL_FORMS_WITH_NO_RULES_RESOLVERS,
  ...LATER_CALIFORNIA_FORMS_RESOLVERS,
  ...CALIFORNIA_FORMS_WITH_NO_RULES_RESOLVERS,
];

export function resolveFilingInfo(opts: {
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>;
  decisions: ReadonlyArray<{ decisionKey: string; decision: unknown }>;
}): FilingInfo {
  const inputs = makeResolverInputs(opts);
  return mergeInfo(RESOLVERS.map((resolve) => resolve(inputs)));
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
