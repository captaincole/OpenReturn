/*
 * Form 3921, Exercise of an Incentive Stock Option Under Section 422(b): one
 * form for each exercise. The employer sends it; the W-2 does not carry it.
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface IsoExerciseFactValue {
  /* The transferor: the corporation that granted the option. */
  employerName: string;
  employerTin?: string;
  box1: string; // Date option granted, MM/DD/YYYY
  box2: string; // Date option exercised, MM/DD/YYYY
  box3: number; // Exercise price per share
  box4: number; // Fair market value per share on exercise date
  box5: number; // Number of shares transferred
}

const ISO_CATEGORY = "other";
const ISO_KEY_START = "employer.";
const ISO_KEY_PART = ".iso_exercise.";

/* One key for each exercise: the employer, then the exercise date as YYYY-MM-DD. */
export function makeIsoExerciseFactKey(employerSlug: string, exerciseDate: string): string {
  return `${ISO_KEY_START}${employerSlug}${ISO_KEY_PART}${exerciseDate}`;
}

export function isIsoExerciseFactKey(key: string): boolean {
  return key.startsWith(ISO_KEY_START) && key.includes(ISO_KEY_PART);
}

export function isIsoExerciseFact(fact: TaxFactRow): boolean {
  return fact.category === ISO_CATEGORY && isIsoExerciseFactKey(fact.key);
}

export function getIsoExerciseFacts(facts: FactsView): IsoExerciseFactValue[] {
  return facts
    .byCategory(ISO_CATEGORY)
    .filter(isIsoExerciseFact)
    .map((fact) => fact.value as IsoExerciseFactValue);
}
