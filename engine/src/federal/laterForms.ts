/*
 * The federal form groups that came after filingInfo.ts reached its line
 * limit: the recapture forms, the farm forms, the debt forms, the community
 * property forms, the loss forms, the refund forms, the self-employed forms, the home credit forms
 * and the foreign corporation forms. They are joined here, in this order, and
 * filingInfo.ts takes them as one. A new group file adds its resolvers (and its
 * type, when FilingInfo needs it) here, never to filingInfo.ts. California has
 * the same file in state/ca/laterForms.ts.
 *
 * The debt forms' and the loss forms' slots join FilingInfo through the
 * schedules that read them (federal/debtForms.ts, federal/lossForms.ts), so
 * their types are not in the type below.
 */

import type { BaseFilingInfo } from "../filingInfo.js";
import type { ResolverInputs } from "../resolverInputs.js";
import {
  COMMUNITY_PROPERTY_FORMS_RESOLVERS,
  type CommunityPropertyFormsFilingInfo,
} from "./communityPropertyForms.js";
import { DEBT_FORMS_RESOLVERS } from "./debtForms.js";
import { FARM_FORMS_RESOLVERS, type FarmFormsFilingInfo } from "./farmForms.js";
import {
  FOREIGN_CORPORATION_FORMS_RESOLVERS,
  type ForeignCorporationFormsFilingInfo,
} from "./foreignCorporationForms.js";
import { HOME_CREDIT_FORMS_RESOLVERS, type HomeCreditFormsFilingInfo } from "./homeCreditForms.js";
import { LOSS_FORMS_RESOLVERS } from "./lossForms.js";
import { RECAPTURE_FORMS_RESOLVERS, type RecaptureFormsFilingInfo } from "./recaptureForms.js";
import { REFUND_FORMS_RESOLVERS, type RefundFormsFilingInfo } from "./refundForms.js";
import { SELF_EMPLOYED_RESOLVERS, type SelfEmployedFilingInfo } from "./selfEmployedForms.js";

export type LaterFederalFormsFilingInfo = RecaptureFormsFilingInfo &
  FarmFormsFilingInfo &
  CommunityPropertyFormsFilingInfo &
  RefundFormsFilingInfo &
  SelfEmployedFilingInfo &
  HomeCreditFormsFilingInfo &
  ForeignCorporationFormsFilingInfo;

export const LATER_FEDERAL_FORMS_RESOLVERS: ReadonlyArray<
  (inputs: ResolverInputs) => BaseFilingInfo
> = [
  ...RECAPTURE_FORMS_RESOLVERS,
  ...FARM_FORMS_RESOLVERS,
  ...DEBT_FORMS_RESOLVERS,
  ...COMMUNITY_PROPERTY_FORMS_RESOLVERS,
  ...LOSS_FORMS_RESOLVERS,
  ...REFUND_FORMS_RESOLVERS,
  ...SELF_EMPLOYED_RESOLVERS,
  ...HOME_CREDIT_FORMS_RESOLVERS,
  ...FOREIGN_CORPORATION_FORMS_RESOLVERS,
];
