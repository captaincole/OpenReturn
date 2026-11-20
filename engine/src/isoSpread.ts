/*
 * The incentive stock option spread that Form 6251 line 2i and Schedule P (540)
 * line 10 read. It comes from the Forms 3921 on file, or from the amount the
 * taxpayer stated when there is no form.
 */

import {
  AMT_KEYS,
  ISO_FORM_REQUIRED_ABOVE,
  isIsoExerciseFactKey,
  type IsoExerciseFactValue,
} from "./facts/index.js";
import { atLeast, sum } from "./money.js";
import { missingInputs, num, type ResolverInputs } from "./resolverInputs.js";

export interface IsoSpread {
  /* The adjustment; undefined while unstated, while an answer is missing, or when not handled. */
  spread?: number;
  /* An exercise is on record that can bring an adjustment: the minimum tax forms file. */
  hasExercise: boolean;
  /* Forms 3921 are on file and the shares were sold in the year of exercise: not handled. */
  soldInYear: boolean;
  /* What the forms still wait for. */
  missing: string[];
}

/* One form: (box 4 less box 3) times box 5. Never below 0. */
const spreadOnForm = (form: IsoExerciseFactValue): number =>
  atLeast(0, (form.box4 - form.box3) * form.box5);

function formsOnFile(inputs: ResolverInputs): IsoExerciseFactValue[] {
  return inputs.facts
    .filter((fact) => fact.category === "other" && isIsoExerciseFactKey(fact.key))
    .map((fact) => fact.value as IsoExerciseFactValue);
}

/* No form: the stated spread stands, and above the limit the return waits for the form. */
function statedSpread(inputs: ResolverInputs): IsoSpread {
  const spread = num(inputs, AMT_KEYS.isoExerciseSpread);
  const needsForm = (spread ?? 0) > ISO_FORM_REQUIRED_ABOVE;
  return {
    spread,
    hasExercise: (spread ?? 0) > 0,
    soldInYear: false,
    missing: [
      ...missingInputs({ [AMT_KEYS.isoExerciseSpread]: spread }),
      ...(needsForm ? [AMT_KEYS.isoForm3921] : []),
    ],
  };
}

export function resolveIsoSpread(inputs: ResolverInputs): IsoSpread {
  const forms = formsOnFile(inputs);
  if (forms.length === 0) return statedSpread(inputs);
  const held = inputs.factByKey.get(AMT_KEYS.isoSharesHeldAtYearEnd);
  const answered = typeof held === "boolean";
  return {
    spread: held === true ? sum(...forms.map(spreadOnForm)) : undefined,
    hasExercise: true,
    soldInYear: held === false,
    missing: answered ? [] : [AMT_KEYS.isoSharesHeldAtYearEnd],
  };
}

export const ISO_SOLD_IN_YEAR_UNSUPPORTED =
  "The shares from the incentive stock option exercise (Form 3921) were sold in the year of exercise. The engine does not figure that case: it needs the sale, and a part sold needs each lot.";
