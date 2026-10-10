/*
 * State composition: one import + one spread per supported state.
 *
 * To add a state:
 *   1. Create ./<st>/ with its forms (types.ts / filingInfo.ts /
 *      bindings.ts per form), an index.ts that exports <ST>_FORMS +
 *      <ST>_CATALOGS, and its data tables (rate schedules, standard
 *      deductions) under ./<st>/data/.
 *   2. Add the import + spreads below. That is the whole diff outside
 *      ./<st>/.
 *
 * A state may import from ../ (core) and read federal results
 * cross-form, but never from another state. The boundary test enforces
 * the first rule; review enforces the second.
 */

import { CA_FORMS, CA_CATALOGS } from "./ca/index.js";
import type { FormSpec } from "../formSpec.js";

export const STATE_FORMS: FormSpec[] = [...CA_FORMS];
export const STATE_CATALOGS = [...CA_CATALOGS];
