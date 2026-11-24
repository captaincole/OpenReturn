/*
 * The federal forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision,
 * so they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form2555FilingInfo } from "./2555/filingInfo.js";
import { resolve2555Info } from "./2555/resolveInfo.js";
import type { Form3800FilingInfo } from "./3800/filingInfo.js";
import { resolve3800Info } from "./3800/resolveInfo.js";
import type { Form4136FilingInfo } from "./4136/filingInfo.js";
import { resolve4136Info } from "./4136/resolveInfo.js";
import type { Form4255FilingInfo } from "./4255/filingInfo.js";
import { resolve4255Info } from "./4255/resolveInfo.js";
import type { Form4563FilingInfo } from "./4563/filingInfo.js";
import { resolve4563Info } from "./4563/resolveInfo.js";
import type { Form4797FilingInfo } from "./4797/filingInfo.js";
import { resolve4797Info } from "./4797/resolveInfo.js";
import type { Form4835FilingInfo } from "./4835/filingInfo.js";
import { resolve4835Info } from "./4835/resolveInfo.js";
import type { Form4970FilingInfo } from "./4970/filingInfo.js";
import { resolve4970Info } from "./4970/resolveInfo.js";
import type { Form5471FilingInfo } from "./5471/filingInfo.js";
import { resolve5471Info } from "./5471/resolveInfo.js";
import type { Form6252FilingInfo } from "./6252/filingInfo.js";
import { resolve6252Info } from "./6252/resolveInfo.js";
import type { Form8582CRFilingInfo } from "./8582-cr/filingInfo.js";
import { resolve8582CRInfo } from "./8582-cr/resolveInfo.js";
import type { Form8611FilingInfo } from "./8611/filingInfo.js";
import { resolve8611Info } from "./8611/resolveInfo.js";
import type { Form8697FilingInfo } from "./8697/filingInfo.js";
import { resolve8697Info } from "./8697/resolveInfo.js";
import type { Form8824FilingInfo } from "./8824/filingInfo.js";
import { resolve8824Info } from "./8824/resolveInfo.js";
import type { Form8828FilingInfo } from "./8828/filingInfo.js";
import { resolve8828Info } from "./8828/resolveInfo.js";
import type { Form8834FilingInfo } from "./8834/filingInfo.js";
import { resolve8834Info } from "./8834/resolveInfo.js";
import type { Form8859FilingInfo } from "./8859/filingInfo.js";
import { resolve8859Info } from "./8859/resolveInfo.js";
import type { Form8911FilingInfo } from "./8911/filingInfo.js";
import { resolve8911Info } from "./8911/resolveInfo.js";
import type { Form8912FilingInfo } from "./8912/filingInfo.js";
import { resolve8912Info } from "./8912/resolveInfo.js";
import type { Form8915FFilingInfo } from "./8915-f/filingInfo.js";
import { resolve8915FInfo } from "./8915-f/resolveInfo.js";
import type { Form8933FilingInfo } from "./8933/filingInfo.js";
import { resolve8933Info } from "./8933/resolveInfo.js";
import type { Form8938FilingInfo } from "./8938/filingInfo.js";
import { resolve8938Info } from "./8938/resolveInfo.js";
import type { Form8978FilingInfo } from "./8978/filingInfo.js";
import { resolve8978Info } from "./8978/resolveInfo.js";
import type { Form8992FilingInfo } from "./8992/filingInfo.js";
import { resolve8992Info } from "./8992/resolveInfo.js";
import type { Form965AFilingInfo } from "./965-a/filingInfo.js";
import { resolve965AInfo } from "./965-a/resolveInfo.js";
import type { ScheduleFFilingInfo } from "./schedule-f/filingInfo.js";
import { resolveScheduleFInfo } from "./schedule-f/resolveInfo.js";

export type FederalFormsWithNoRulesFilingInfo = ScheduleFFilingInfo &
  Form965AFilingInfo &
  Form2555FilingInfo &
  Form3800FilingInfo &
  Form4136FilingInfo &
  Form4255FilingInfo &
  Form4563FilingInfo &
  Form4797FilingInfo &
  Form4835FilingInfo &
  Form4970FilingInfo &
  Form5471FilingInfo &
  Form6252FilingInfo &
  Form8611FilingInfo &
  Form8697FilingInfo &
  Form8828FilingInfo &
  Form8834FilingInfo &
  Form8859FilingInfo &
  Form8911FilingInfo &
  Form8912FilingInfo &
  Form8915FFilingInfo &
  Form8933FilingInfo &
  Form8938FilingInfo &
  Form8978FilingInfo &
  Form8992FilingInfo &
  Form8582CRFilingInfo &
  Form8824FilingInfo;

export const FEDERAL_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolveScheduleFInfo,
  resolve965AInfo,
  resolve2555Info,
  resolve3800Info,
  resolve4136Info,
  resolve4255Info,
  resolve4563Info,
  resolve4797Info,
  resolve4835Info,
  resolve4970Info,
  resolve5471Info,
  resolve6252Info,
  resolve8611Info,
  resolve8697Info,
  resolve8828Info,
  resolve8834Info,
  resolve8859Info,
  resolve8911Info,
  resolve8912Info,
  resolve8915FInfo,
  resolve8933Info,
  resolve8938Info,
  resolve8978Info,
  resolve8992Info,
  resolve8582CRInfo,
  resolve8824Info,
];
