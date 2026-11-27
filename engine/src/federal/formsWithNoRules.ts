/*
 * The federal forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision,
 * so they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form3468FilingInfo } from "./3468/filingInfo.js";
import { resolve3468Info } from "./3468/resolveInfo.js";
import type { Form5471FilingInfo } from "./5471/filingInfo.js";
import { resolve5471Info } from "./5471/resolveInfo.js";
import type { Form5884FilingInfo } from "./5884/filingInfo.js";
import { resolve5884Info } from "./5884/resolveInfo.js";
import type { Form6765FilingInfo } from "./6765/filingInfo.js";
import { resolve6765Info } from "./6765/resolveInfo.js";
import type { Form8586FilingInfo } from "./8586/filingInfo.js";
import { resolve8586Info } from "./8586/resolveInfo.js";
import type { Form8609AFilingInfo } from "./8609-a/filingInfo.js";
import { resolve8609AInfo } from "./8609-a/resolveInfo.js";
import type { Form8826FilingInfo } from "./8826/filingInfo.js";
import { resolve8826Info } from "./8826/resolveInfo.js";
import type { Form8846FilingInfo } from "./8846/filingInfo.js";
import { resolve8846Info } from "./8846/resolveInfo.js";
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
  Form3468FilingInfo &
  Form5884FilingInfo &
  Form6765FilingInfo &
  Form8586FilingInfo &
  Form8609AFilingInfo &
  Form8826FilingInfo &
  Form8846FilingInfo &
  Form8881FilingInfo &
  Form8882FilingInfo;

export const FEDERAL_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolve5471Info,
  resolve8933Info,
  resolve8992Info,
  resolve3468Info,
  resolve5884Info,
  resolve6765Info,
  resolve8586Info,
  resolve8609AInfo,
  resolve8826Info,
  resolve8846Info,
  resolve8881Info,
  resolve8882Info,
];
