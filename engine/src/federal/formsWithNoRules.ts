/*
 * The federal forms that have a catalog and no rules yet. Each has a FilingInfo
 * type with no slots and a resolver that reads only its must-file decision,
 * so they are joined here and filingInfo.ts takes them as one.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import type { Form172FilingInfo } from "./172/filingInfo.js";
import { resolve172Info } from "./172/resolveInfo.js";
import type { Form4136FilingInfo } from "./4136/filingInfo.js";
import { resolve4136Info } from "./4136/resolveInfo.js";
import type { Form4563FilingInfo } from "./4563/filingInfo.js";
import { resolve4563Info } from "./4563/resolveInfo.js";
import type { Form5471FilingInfo } from "./5471/filingInfo.js";
import { resolve5471Info } from "./5471/resolveInfo.js";
import type { Form7206FilingInfo } from "./7206/filingInfo.js";
import { resolve7206Info } from "./7206/resolveInfo.js";
import type { Form8582CRFilingInfo } from "./8582-cr/filingInfo.js";
import { resolve8582CRInfo } from "./8582-cr/resolveInfo.js";
import type { Form8697FilingInfo } from "./8697/filingInfo.js";
import { resolve8697Info } from "./8697/resolveInfo.js";
import type { Form8834FilingInfo } from "./8834/filingInfo.js";
import { resolve8834Info } from "./8834/resolveInfo.js";
import type { Form8859FilingInfo } from "./8859/filingInfo.js";
import { resolve8859Info } from "./8859/resolveInfo.js";
import type { Form8912FilingInfo } from "./8912/filingInfo.js";
import { resolve8912Info } from "./8912/resolveInfo.js";
import type { Form8933FilingInfo } from "./8933/filingInfo.js";
import { resolve8933Info } from "./8933/resolveInfo.js";
import type { Form8958FilingInfo } from "./8958/filingInfo.js";
import { resolve8958Info } from "./8958/resolveInfo.js";
import type { Form8992FilingInfo } from "./8992/filingInfo.js";
import { resolve8992Info } from "./8992/resolveInfo.js";
import type { Form965AFilingInfo } from "./965-a/filingInfo.js";
import { resolve965AInfo } from "./965-a/resolveInfo.js";
import type { Form982FilingInfo } from "./982/filingInfo.js";
import { resolve982Info } from "./982/resolveInfo.js";
export type FederalFormsWithNoRulesFilingInfo = Form965AFilingInfo &
  Form4136FilingInfo &
  Form4563FilingInfo &
  Form5471FilingInfo &
  Form8697FilingInfo &
  Form8834FilingInfo &
  Form8859FilingInfo &
  Form8912FilingInfo &
  Form8933FilingInfo &
  Form8992FilingInfo &
  Form8582CRFilingInfo &
  Form172FilingInfo &
  Form7206FilingInfo &
  Form8958FilingInfo &
  Form982FilingInfo;

export const FEDERAL_FORMS_WITH_NO_RULES_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  resolve965AInfo,
  resolve4136Info,
  resolve4563Info,
  resolve5471Info,
  resolve8697Info,
  resolve8834Info,
  resolve8859Info,
  resolve8912Info,
  resolve8933Info,
  resolve8992Info,
  resolve8582CRInfo,
  resolve172Info,
  resolve7206Info,
  resolve8958Info,
  resolve982Info,
];
