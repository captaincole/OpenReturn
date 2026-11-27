/*
 * Form 6478's side of Form 3800 Part III line 4c. "All others, stop here and
 * report this amount on the appropriate line of Form 3800"
 * (irs-6478-face-2025::sec::face-page-1::b01, line 4). Line 4 is line 2 (the
 * taxpayer's own production) plus line 3 (the pass-through credits).
 *
 * Form 3800 already holds each pass-through credit as its own source: a K-1
 * item (3800/k1Credits.ts, with the entity's EIN for Part V) or a stated
 * credit that names its entity. Line 2 is blank on every 2025 return
 * (lines.ts), so this form adds no source of its own, as Form 5884 adds only
 * its line 2. What it adds is the gap of a stated line 4c credit that names no
 * entity: such a credit can only be the taxpayer's own production, and a 2025
 * tax year has none.
 */

import type { GeneralBusinessCreditFactValue } from "../../facts/index.js";

export const PART_III_LINE = "4c";

export const STATED_OWN_GAP =
  "A Form 3800 line 4c credit is stated with no pass-through entity. A 2025 return has no biofuel producer credit of its own production: the credit is for fuel sold or used before 2025 (irs-6478-inst-2025::sec::what-s-new::b01). Only an allocation from a pass-through entity whose tax year began in 2024 remains: state its EIN (passThroughEin).";

/* Why a stated Part III line 4c credit cannot be placed; undefined when it can (3800/sources.ts). */
export const statedOwnBiofuelGap = (value: GeneralBusinessCreditFactValue): string | undefined =>
  value.line === PART_III_LINE && value.passThroughEin === undefined ? STATED_OWN_GAP : undefined;
