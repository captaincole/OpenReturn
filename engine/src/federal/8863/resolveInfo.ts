import {
  EDUCATION_CREDIT_KEYS,
  FORM_8862_KEYS,
  form1098TStudentSlug,
  getEducationCreditStudentFacts,
  getForm1098TFactKeys,
  makeEducationCreditStudentFactKey,
  type EducationCreditStudentFact,
  type EducationRefundAnswersFactValue,
} from "../../facts/index.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { agiFloor } from "../schedule-eic/possible.js";
import type { Form8863Figured, Form8863FilingInfo, StudentPartIII } from "./filingInfo.js";
import { magiLimit } from "./lines.js";
import { refundOutcome, type RefundOutcome } from "./refund.js";
import { partIIIPages, partIIITotals, studentPartIII } from "./students.js";

const DOB_KEY = "identity.dob";

/*
 * The student fact keys that a Form 1098-T asks for: a Form 1098-T that no
 * student fact's line 22 names is for a student whose answers are missing.
 */
function unnamedStudents(
  inputs: ResolverInputs,
  facts: ReadonlyArray<EducationCreditStudentFact>,
): string[] {
  const named = new Set(
    facts.flatMap((fact) => fact.value.institutions.map((each) => each.form1098TKey)),
  );
  const keys = getForm1098TFactKeys(inputs.facts)
    .filter((key) => !named.has(key))
    .map((key) => makeEducationCreditStudentFactKey(form1098TStudentSlug(key) ?? ""));
  return [...new Set(keys)];
}

/* The answers the form reads and still waits for: a student's line 22, the line 7 questions. */
function requiredAnswers(
  students: ReadonlyArray<StudentPartIII>,
  unnamed: ReadonlyArray<string>,
  refund: RefundOutcome,
  answers: EducationRefundAnswersFactValue | undefined,
): Record<string, unknown> {
  const required: Record<string, unknown> = {};
  for (const student of students) required[student.factKey] = student.waits ? undefined : true;
  for (const key of unnamed) required[key] = undefined;
  if (refund.kind === "waits" && refund.for === "date_of_birth") required[DOB_KEY] = undefined;
  if (refund.kind === "waits" && refund.for !== "date_of_birth") {
    required[EDUCATION_CREDIT_KEYS.refundAnswers] = undefined;
  } else if (answers !== undefined) {
    required[EDUCATION_CREDIT_KEYS.refundAnswers] = answers;
  }
  return required;
}

function figure(
  inputs: ResolverInputs,
  students: StudentPartIII[],
  unnamed: string[],
  joint: boolean,
) {
  const answers = inputs.factByKey.get(EDUCATION_CREDIT_KEYS.refundAnswers) as
    EducationRefundAnswersFactValue | undefined;
  const americanOpportunity = students.some((each) => each.credit === "american_opportunity");
  const refund: RefundOutcome = americanOpportunity
    ? refundOutcome(joint, text(inputs, DOB_KEY), answers)
    : { kind: "refundable" };
  const figured: Form8863Figured = {
    students,
    pages: partIIIPages(students),
    ...partIIITotals(students),
    americanOpportunity,
    refund,
    studentsMissing: unnamed.length > 0,
    aotcBarred: inputs.factByKey.get(FORM_8862_KEYS.aotcBarredByIrs) === true,
  };
  return { figured, required: requiredAnswers(students, unnamed, refund, answers) };
}

/*
 * Who files (irs-8863-inst-2025::sec::who-can-claim-an-education-credit::b01,
 * b03; irs-1040-inst-2025::sec::line-3-2::b01): a filer who claims a credit for
 * a student. A student fact, or a Form 1098-T ("To be eligible ... the law
 * requires a taxpayer (or a dependent) to have received Form 1098-T",
 * future-developments::b01), files the form unless the return is married filing
 * separately, or the least AGI the facts allow (agiFloor, as Form 8880 does) is
 * already at the MAGI limit. A Form 1098-T with no student fact asks for one. With no floor (an open business, rental or HSA
 * amount) the student fact files it, and line 4 stops a filer over the limit.
 * The explicit decision still wins. Who is claimed as a dependent, or was a
 * nonresident alien, is Cade's question before a student fact (QUESTIONS.md).
 */
export function resolve8863Info(inputs: ResolverInputs): Form8863FilingInfo {
  const status = filingStatusOf(inputs);
  const joint = status === "married_filing_jointly";
  const facts = getEducationCreditStudentFacts(inputs.facts);
  const unnamed = unnamedStudents(inputs, facts);
  const floor = agiFloor(inputs, status === undefined || joint);
  const underLimit = floor === undefined || floor < magiLimit(status === undefined || joint);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8863",
    fallbacks: [
      {
        rule: `fallback: ${facts.length} education credit student(s), ${unnamed.length} more with a Form 1098-T, not married filing separately, AGI may be under the limit`,
        value:
          facts.length + unnamed.length > 0 && status !== "married_filing_separately" && underLimit,
        triggeredByFactKeys: [
          ...facts.map((each) => each.key),
          ...getForm1098TFactKeys(inputs.facts),
        ],
      },
    ],
  });
  const filed = { mustFile: { "form-8863": mustFile } };
  if (mustFile.value !== true) return { ...filed, missingInputs: { "form-8863": [] } };
  const students = facts.map((fact) => studentPartIII(fact, inputs.factByKey));
  const { figured, required } = figure(inputs, students, unnamed, joint);
  return { ...filed, missingInputs: { "form-8863": missingInputs(required) }, form8863: figured };
}
