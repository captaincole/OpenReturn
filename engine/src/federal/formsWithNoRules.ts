/*
 * The federal forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision,
 * so they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form5471FilingInfo } from "./5471/filingInfo.js";
import { resolve5471Info } from "./5471/resolveInfo.js";
import type { Form6478FilingInfo } from "./6478/filingInfo.js";
import { resolve6478Info } from "./6478/resolveInfo.js";
import type { Form6765FilingInfo } from "./6765/filingInfo.js";
import { resolve6765Info } from "./6765/resolveInfo.js";
import type { Form7207FilingInfo } from "./7207/filingInfo.js";
import { resolve7207Info } from "./7207/resolveInfo.js";
import type { Form7210FilingInfo } from "./7210/filingInfo.js";
import { resolve7210Info } from "./7210/resolveInfo.js";
import type { Form7211FilingInfo } from "./7211/filingInfo.js";
import { resolve7211Info } from "./7211/resolveInfo.js";
import type { Form7213FilingInfo } from "./7213/filingInfo.js";
import { resolve7213Info } from "./7213/resolveInfo.js";
import type { Form7218FilingInfo } from "./7218/filingInfo.js";
import { resolve7218Info } from "./7218/resolveInfo.js";
import type { Form8586FilingInfo } from "./8586/filingInfo.js";
import { resolve8586Info } from "./8586/resolveInfo.js";
import type { Form8609AFilingInfo } from "./8609-a/filingInfo.js";
import { resolve8609AInfo } from "./8609-a/resolveInfo.js";
import type { Form8820FilingInfo } from "./8820/filingInfo.js";
import { resolve8820Info } from "./8820/resolveInfo.js";
import type { Form8826FilingInfo } from "./8826/filingInfo.js";
import { resolve8826Info } from "./8826/resolveInfo.js";
import type { Form8835FilingInfo } from "./8835/filingInfo.js";
import { resolve8835Info } from "./8835/resolveInfo.js";
import type { Form8864FilingInfo } from "./8864/filingInfo.js";
import { resolve8864Info } from "./8864/resolveInfo.js";
import type { Form8881FilingInfo } from "./8881/filingInfo.js";
import { resolve8881Info } from "./8881/resolveInfo.js";
import type { Form8882FilingInfo } from "./8882/filingInfo.js";
import { resolve8882Info } from "./8882/resolveInfo.js";
import type { Form8933FilingInfo } from "./8933/filingInfo.js";
import { resolve8933Info } from "./8933/resolveInfo.js";
import type { Form8992FilingInfo } from "./8992/filingInfo.js";
import { resolve8992Info } from "./8992/resolveInfo.js";
export type FederalFormsWithNoRulesFilingInfo = Form5471FilingInfo &
  Form8933FilingInfo &
  Form8992FilingInfo &
  Form6765FilingInfo &
  Form8586FilingInfo &
  Form8609AFilingInfo &
  Form8826FilingInfo &
  Form8881FilingInfo &
  Form8882FilingInfo &
  Form6478FilingInfo &
  Form7207FilingInfo &
  Form7210FilingInfo &
  Form7211FilingInfo &
  Form7213FilingInfo &
  Form7218FilingInfo &
  Form8820FilingInfo &
  Form8835FilingInfo &
  Form8864FilingInfo;

export const FEDERAL_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolve5471Info,
  resolve8933Info,
  resolve8992Info,
  resolve6765Info,
  resolve8586Info,
  resolve8609AInfo,
  resolve8826Info,
  resolve8881Info,
  resolve8882Info,
  resolve6478Info,
  resolve7207Info,
  resolve7210Info,
  resolve7211Info,
  resolve7213Info,
  resolve7218Info,
  resolve8820Info,
  resolve8835Info,
  resolve8864Info,
];
