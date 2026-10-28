/*
 * To add a state: create ./<st>/ with an index.ts that exports <ST>_FORMS
 * and <ST>_CATALOGS, then add one import and one spread here.
 * A state may import from ../ (core) and read federal results cross-form,
 * but never from another state. The boundary test enforces the first rule;
 * review enforces the second.
 */

import type { FormSpec } from "../formSpec.js";
import { CA_CATALOGS, CA_FORMS } from "./ca/index.js";

export const STATE_FORMS: FormSpec[] = [...CA_FORMS];
export const STATE_CATALOGS = [...CA_CATALOGS];
