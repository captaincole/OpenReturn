/*
 * A made-up married couple (README.md): every name and amount is invented.
 * The three Forms 1098-T have PDFs in docs/ (generate-docs.ts); the W-2s are
 * the boxes as the documents would print them. The rest are answers the
 * couple states.
 */

import {
  SPOUSE_KEYS,
  makeEducationCreditStudentFactKey,
  makeForm1098TFactKey,
  makeW2FactKey,
  type EducationCreditStudentFactValue,
  type Form1098TFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const PERRIN_USER_ID = "perrin-integration";
export const PERRIN_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-22T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: PERRIN_USER_ID,
  taxYear: PERRIN_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const PERRIN = {
  firstName: "Perrin",
  lastName: "Quillfeather",
  ssn: "400-00-8863",
  street: "2716 Cerro Alto Drive",
  city: "El Paso",
  state: "TX",
  zip: "79912",
};

export const MARISOL = { firstName: "Marisol", lastName: "Quillfeather", ssn: "400-00-8864" };

const address = { line1: PERRIN.street, city: PERRIN.city, state: PERRIN.state, zip: PERRIN.zip };
export const STUDENT_CITY_STATE_ZIP = `${PERRIN.city}, ${PERRIN.state} ${PERRIN.zip}`;

// Perrin's W-2 from Franklin Ridge Logistics (made up).
const perrinW2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Franklin Ridge Logistics LLC",
  employerEin: "00-0008863",
  employerAddress: { line1: "9100 Railroad Drive", city: "El Paso", state: "TX", zip: "79924" },
  employee: { firstName: PERRIN.firstName, lastName: PERRIN.lastName, ssn: PERRIN.ssn, address },
  box1: 58000,
  box2: 4100,
  box3: 58000,
  box4: 3596,
  box5: 58000,
  box6: 841,
};

// Marisol's W-2 from Tularosa Basin Medical Group (made up).
const marisolW2: W2FactValue = {
  owner: "spouse",
  employerName: "Tularosa Basin Medical Group PA",
  employerEin: "00-0008865",
  employerAddress: { line1: "4400 Montana Avenue", city: "El Paso", state: "TX", zip: "79903" },
  employee: { firstName: MARISOL.firstName, lastName: MARISOL.lastName, ssn: MARISOL.ssn, address },
  box1: 113500,
  box2: 11900,
  box3: 113500,
  box4: 7037,
  box5: 113500,
  box6: 1645.75,
};

/*
 * Perrin's university: fall 2025 tuition ($3,100) and the spring 2026 term
 * paid in December 2025 ($2,000), so box 7 is checked; a $1,200 scholarship.
 */
export const university1098T: Form1098TFactValue = {
  filerName: "Rio Grande Valley State University",
  filerAddress: { line1: "500 University Avenue", city: "El Paso", state: "TX", zip: "79968" },
  filerEin: "00-0008866",
  studentName: `${PERRIN.firstName} ${PERRIN.lastName}`,
  studentTin: "XXX-XX-8863",
  box1: 5100,
  box5: 1200,
  box7: true,
  box8: true,
};

// Perrin's summer 2025 course at a community college (made up).
export const college1098T: Form1098TFactValue = {
  filerName: "Sunland Park Community College",
  filerAddress: { line1: "1111 Doniphan Drive", city: "Sunland Park", state: "NM", zip: "88063" },
  filerEin: "00-0008867",
  studentName: `${PERRIN.firstName} ${PERRIN.lastName}`,
  studentTin: "XXX-XX-8863",
  box1: 650,
};

/*
 * Marisol's graduate school: fall 2025 ($4,200 less a $250 refund for a
 * dropped course) and the spring 2026 term paid in December 2025 ($3,450).
 */
export const graduate1098T: Form1098TFactValue = {
  filerName: "Franklin Mountains School of Business",
  filerAddress: {
    line1: "1 Scenic Drive",
    line2: "Suite 200",
    city: "El Paso",
    state: "TX",
    zip: "79902",
  },
  filerEin: "00-0008868",
  studentName: `${MARISOL.firstName} ${MARISOL.lastName}`,
  studentTin: "XXX-XX-8864",
  box1: 7400,
  box7: true,
  box8: true,
  box9: true,
};

export const UNIVERSITY_1098T_KEY = makeForm1098TFactKey("rio-grande-valley-state", "perrin");
export const COLLEGE_1098T_KEY = makeForm1098TFactKey("sunland-park-cc", "perrin");
export const GRADUATE_1098T_KEY = makeForm1098TFactKey("franklin-mountains-business", "marisol");

/*
 * Perrin: a part-time degree student who finished two years of college long
 * ago. No American opportunity credit in any earlier year. Books bought online.
 */
const perrinStudent: EducationCreditStudentFactValue = {
  studentName: `${PERRIN.firstName} ${PERRIN.lastName}`,
  studentSsn: PERRIN.ssn,
  institutions: [
    { form1098TKey: UNIVERSITY_1098T_KEY, received2024Form1098TBox7: false },
    { form1098TKey: COLLEGE_1098T_KEY, received2024Form1098TBox7: false },
  ],
  aocClaimedFourPriorYears: false,
  enrolledHalfTimeInProgram: true,
  completedFirstFourYears: false,
  felonyDrugConviction: false,
  academicPeriods: [
    { description: "Summer 2025, Sunland Park", tuitionAndFeesPaid: 650, taxFreeAssistance: 0 },
    {
      description: "Fall 2025, Rio Grande Valley",
      tuitionAndFeesPaid: 3100,
      courseMaterialsPaid: 380,
      taxFreeAssistance: 1200,
    },
    {
      description: "Spring 2026, Rio Grande Valley (paid December 2025)",
      tuitionAndFeesPaid: 2000,
      taxFreeAssistance: 0,
    },
  ],
};

/*
 * Marisol: an MBA student with a bachelor's degree (line 25 "Yes", so the
 * lifetime learning credit). Her spring 2025 term was paid in December 2024,
 * so her 2024 Form 1098-T had box 7 checked.
 */
const marisolStudent: EducationCreditStudentFactValue = {
  studentName: `${MARISOL.firstName} ${MARISOL.lastName}`,
  studentSsn: MARISOL.ssn,
  institutions: [{ form1098TKey: GRADUATE_1098T_KEY, received2024Form1098TBox7: true }],
  aocClaimedFourPriorYears: false,
  enrolledHalfTimeInProgram: true,
  completedFirstFourYears: true,
  felonyDrugConviction: false,
  academicPeriods: [
    { description: "Fall 2025", tuitionAndFeesPaid: 4200, taxFreeAssistance: 0, refunds: 250 },
    {
      description: "Spring 2026 (paid December 2025)",
      tuitionAndFeesPaid: 3450,
      taxFreeAssistance: 0,
    },
  ],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: PERRIN_USER_ID, taxYear: PERRIN_TAX_YEAR, suffix, value });

export const perrinFacts: TaxFactRow[] = [
  idFact("name.first", PERRIN.firstName),
  idFact("name.last", PERRIN.lastName),
  idFact("ssn", PERRIN.ssn),
  idFact("dob", "03/14/1991"),
  idFact("address.street", PERRIN.street),
  idFact("address.city", PERRIN.city),
  idFact("address.state", PERRIN.state),
  idFact("address.zip", PERRIN.zip),
  idFact("occupation", "Dispatcher"),
  idFact("phone", "915-555-0163"),
  fact("identity", SPOUSE_KEYS.firstName, MARISOL.firstName, "Stated by Perrin."),
  fact("identity", SPOUSE_KEYS.lastName, MARISOL.lastName, "Stated by Perrin."),
  fact("identity", SPOUSE_KEYS.ssn, MARISOL.ssn, "Marisol's W-2, box a."),
  fact("identity", SPOUSE_KEYS.dob, "08/09/1988", "Stated by Marisol."),
  fact("wages", makeW2FactKey("franklin-ridge"), perrinW2, "W-2 from Franklin Ridge Logistics."),
  fact(
    "wages",
    makeW2FactKey("tularosa-basin"),
    marisolW2,
    "W-2 from Tularosa Basin Medical Group.",
  ),
  fact(
    "education",
    UNIVERSITY_1098T_KEY,
    university1098T,
    "1098-T (docs/01-rio-grande-valley-1098-t.pdf).",
  ),
  fact("education", COLLEGE_1098T_KEY, college1098T, "1098-T (docs/02-sunland-park-1098-t.pdf)."),
  fact(
    "education",
    GRADUATE_1098T_KEY,
    graduate1098T,
    "1098-T (docs/03-franklin-mountains-1098-t.pdf).",
  ),
  fact(
    "education",
    makeEducationCreditStudentFactKey("perrin"),
    perrinStudent,
    "Stated by Perrin: degree program at least half-time, no AOC before, paid amounts by term.",
  ),
  fact(
    "education",
    makeEducationCreditStudentFactKey("marisol"),
    marisolStudent,
    "Stated by Marisol: MBA program, bachelor's degree done, paid amounts by term.",
  ),
];
