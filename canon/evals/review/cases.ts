/*
 * Each decision has a correct and a wrong version, so a judge that always
 * says "accurate" scores 50%. The facts copy the engine's scenarios as
 * data: Canon does not import the engine. A judge passes an `authority`
 * group when it cites ANY block in it.
 */

type Verdict = "accurate" | "inaccurate" | "needs_more_facts";

export interface ReviewFact {
  category: string;
  key: string;
  value: unknown;
  sourceNote?: string | null;
}

export interface ReviewCase {
  name: string;
  expectedVerdict: Verdict;
  facts: ReviewFact[];
  decision: { decisionKey: string; decision: unknown; rationale: string };
  authority: string[][];
}

const withValue = (facts: ReviewFact[], key: string, patch: unknown) =>
  facts.map((f) =>
    f.key === key
      ? { ...f, value: typeof patch === "object" ? { ...(f.value as object), ...patch } : patch }
      : f,
  );

const single: ReviewFact = {
  category: "filing_status",
  key: "filing_status.marital_status",
  value: "never_married",
  sourceNote: "Verbal: never married, no dependents.",
};

const HOUSEHOLD_W2 = "employee.rosa-delgado.household_w2";
const scheduleHFacts: ReviewFact[] = [
  {
    category: "household_employment",
    key: HOUSEHOLD_W2,
    value: {
      employeeName: "Rosa Delgado",
      box1: 3100,
      box3: 3100,
      box4: 192.2,
      box5: 3100,
      box6: 44.95,
    },
    sourceNote: "W-2 Tara issued to Rosa Delgado.",
  },
  {
    category: "household_employment",
    key: "household_employment.paid_1000_in_a_quarter",
    value: false,
    sourceNote: "Schedule H line 9 is No.",
  },
];
const scheduleHAuthority = [
  [
    "irs-1040sh-inst-2025::sec::part-i::b03",
    "irs-1040sh-inst-2025::sec::what-s-new::b01",
    "irs-1040sh-inst-2025::sec::who-needs-to-file-form-w-2-and::b01",
    "irs-1040sh-inst-2025::sec::specific-instructions::b02",
    "irs-1040sh-inst-2025::sec::who-needs-to-file-schedule-h::b01",
    "irs-1040-inst-2025::sec::line-9-2::b01",
  ],
];

const MARCUS_W2 = "employer.helix-software";
const form8959Facts: ReviewFact[] = [
  single,
  {
    category: "wages",
    key: MARCUS_W2,
    value: {
      employerName: "Helix Software, Inc.",
      box1: 220000,
      box2: 40000,
      box3: 176100,
      box4: 10918.2,
      box5: 243500,
      box6: 3922.25,
      box15: "CA",
      box16: 220000,
      box17: 15500,
    },
    sourceNote: "W-2 from Helix Software, Inc.",
  },
];
const form8959Authority = [
  [
    "irs-8959-inst-2025::sec::who-must-file::b01",
    "irs-8959-inst-2025::sec::threshold-amounts-for-additional-medicare-tax::b01",
    "irs-1040-inst-2025::sec::line-11::b01",
  ],
];

const taraW2 = (key: string, employerName: string, box1: number, box2: number, box17: number) => ({
  category: "wages",
  key,
  value: {
    employerName,
    box1,
    box2,
    box3: box1,
    box5: box1,
    box15: "CA",
    box16: box1,
    box17,
  },
  sourceNote: `W-2 from ${employerName}.`,
});
const mustFileFacts: ReviewFact[] = [
  single,
  { category: "identity", key: "identity.dob", value: "08/14/1985", sourceNote: "verbal" },
  taraW2("employer.the-green-ladies", "The Green Ladies", 22970, 1073, 320),
  taraW2("employer.c-r", "C&R", 19500, 1640, 416),
  ...scheduleHFacts.filter((f) => f.key === HOUSEHOLD_W2),
];
const mustFileAuthority = [
  [
    "irs-1040-inst-2025::sec::chart-a-for-most-people::b01",
    "irs-1040-inst-2025::sec::chart-c-other-situations-when-you-must-file::b01",
  ],
];

export const CASES: ReviewCase[] = [
  {
    name: "Schedule H: $3,100 cash wages to one household employee",
    expectedVerdict: "accurate",
    facts: scheduleHFacts,
    decision: {
      decisionKey: "decisions.scope.must_file_schedule_h",
      decision: true,
      rationale:
        "Paid one household employee $3,100 in cash wages in 2025, which meets the cash-wage threshold for social security and Medicare taxes, so Schedule H is required.",
    },
    authority: scheduleHAuthority,
  },
  {
    name: "Schedule H: $2,500 cash wages (under the threshold)",
    expectedVerdict: "inaccurate",
    facts: withValue(scheduleHFacts, HOUSEHOLD_W2, {
      box1: 2500,
      box3: 2500,
      box4: 155,
      box5: 2500,
      box6: 36.25,
    }),
    decision: {
      decisionKey: "decisions.scope.must_file_schedule_h",
      decision: true,
      rationale:
        "Paid a household employee $2,500 in cash wages in 2025, so Schedule H is required.",
    },
    authority: scheduleHAuthority,
  },
  {
    name: "Form 8959: $243,500 Medicare wages, single",
    expectedVerdict: "accurate",
    facts: form8959Facts,
    decision: {
      decisionKey: "decisions.scope.must_file_8959",
      decision: true,
      rationale:
        "Single filer with W-2 box 5 Medicare wages of $243,500, over the $200,000 single threshold, so Additional Medicare Tax applies and Form 8959 is required.",
    },
    authority: form8959Authority,
  },
  {
    name: "Form 8959: $180,000 Medicare wages, single",
    expectedVerdict: "inaccurate",
    facts: withValue(form8959Facts, MARCUS_W2, {
      box1: 156500,
      box5: 180000,
      box6: 2610,
      box16: 156500,
    }),
    decision: {
      decisionKey: "decisions.scope.must_file_8959",
      decision: true,
      rationale: "High W-2 income, so Additional Medicare Tax applies and Form 8959 is required.",
    },
    authority: form8959Authority,
  },
  {
    name: "Must file federal: single, under 65, $42,470 gross income",
    expectedVerdict: "accurate",
    facts: mustFileFacts,
    decision: {
      decisionKey: "decisions.scope.must_file_federal",
      decision: true,
      rationale:
        "Single, under 65, with gross income of $42,470 from two W-2s, over the single filing threshold. Household employment taxes also require a return.",
    },
    authority: mustFileAuthority,
  },
  {
    name: "Must file federal: decided No with $42,470 gross income",
    expectedVerdict: "inaccurate",
    facts: mustFileFacts,
    decision: {
      decisionKey: "decisions.scope.must_file_federal",
      decision: false,
      rationale:
        "Both employers withheld federal income tax on all wages, so no federal return is required.",
    },
    authority: mustFileAuthority,
  },
];
