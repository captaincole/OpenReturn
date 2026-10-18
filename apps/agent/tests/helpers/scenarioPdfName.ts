/*
 * File names for a scenario's rendered and golden PDFs, in its docs/
 * folder: `<Scenario>-<FormShortName>-<kind>.pdf`. renderScenario writes
 * them; scenarios point goldenPdfPath at the "Golden" ones.
 */

/*
 * Short-name fragment for filenames. Maps formId → the PascalCase chunk
 * used in golden filenames (e.g. "form-540" → "CA540"). New forms fall
 * back to a Pascal-case form of the formId.
 */
const FORM_SHORT_NAME: Record<string, string> = {
  "form-1040": "1040",
  "form-540": "CA540",
  "form-8949": "8949",
  "schedule-d": "ScheduleD",
  "schedule-ca": "ScheduleCA",
};

export function toPascal(s: string): string {
  return s
    .split(/[-_]/)
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ""))
    .join("");
}

export function scenarioPdfName(
  scenario: string,
  formId: string,
  kind: "Golden" | "rendered",
): string {
  const short = FORM_SHORT_NAME[formId] ?? toPascal(formId);
  return `${toPascal(scenario)}-${short}-${kind}.pdf`;
}

/** goldenPdfPath for a scenario form whose golden is locked engine output. */
export const lockedGoldenPath = (scenario: string, formId: string): string =>
  `tests/scenarios/${scenario}/docs/${scenarioPdfName(scenario, formId, "Golden")}`;
