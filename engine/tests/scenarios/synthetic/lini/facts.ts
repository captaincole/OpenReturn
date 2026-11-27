/*
 * A made-up head of household (README.md): every name and amount is invented.
 * No input documents: the W-2 and the Form 1098-T are the boxes as the
 * documents would print them. The rest are answers Lini states.
 */

import {
  EIC_KEYS,
  FORM_8862_KEYS,
  makeDependentFactKey,
  makeEducationCreditStudentFactKey,
  makeForm1098TFactKey,
  makeW2FactKey,
  type DependentFactValue,
  type EducationCreditStudentFactValue,
  type Form1098TFactValue,
  type W2FactValue,
} from "../../../../src/facts/index.js";
import type { TaxFactRow } from "../../../../src/facts/rows.js";
import { identityFact } from "../../../helpers/fixtureBuilders.js";

export const LINI_USER_ID = "lini-integration";
export const LINI_TAX_YEAR = 2025;

const CREATED_AT = "2026-11-26T00:00:00Z";

const fact = (category: string, key: string, value: unknown, sourceNote: string): TaxFactRow => ({
  id: `f-${key}`,
  userId: LINI_USER_ID,
  taxYear: LINI_TAX_YEAR,
  category,
  key,
  value,
  sourceNote,
  createdAt: CREATED_AT,
});

export const LINI = {
  firstName: "Lini",
  lastName: "Thornbury",
  ssn: "400-00-8862",
  street: "2204 Magnolia Hollow Lane",
  city: "Ocala",
  state: "FL",
  zip: "34471",
};

const address = { line1: LINI.street, city: LINI.city, state: LINI.state, zip: LINI.zip };

// Lini's W-2 from Silver Springs Veterinary Clinic (made up).
const w2: W2FactValue = {
  owner: "taxpayer",
  employerName: "Silver Springs Veterinary Clinic PA",
  employerEin: "00-0008862",
  employerAddress: {
    line1: "3100 East Silver Springs Blvd",
    city: "Ocala",
    state: "FL",
    zip: "34470",
  },
  employee: { firstName: LINI.firstName, lastName: LINI.lastName, ssn: LINI.ssn, address },
  box1: 50000,
  box2: 2400,
  box3: 50000,
  box4: 3100,
  box5: 50000,
  box6: 725,
};

// Mira, 8, in the home all year.
const mira: DependentFactValue = {
  firstName: "Mira",
  lastName: "Thornbury",
  ssn: "400-00-8871",
  relationship: "Daughter",
  dob: "04/09/2017",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

// Owen, born March 12, 2025, in the home since birth.
const owen: DependentFactValue = {
  firstName: "Owen",
  lastName: "Thornbury",
  ssn: "400-00-8872",
  relationship: "Son",
  dob: "03/12/2025",
  monthsLivedWithYou: 10,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

/*
 * Dara, 19, a full-time college student who lives at home; she spent most of
 * July and August at her grandfather's farm in Georgia, not a temporary
 * absence, so 11 months and 304 days.
 */
const dara: DependentFactValue = {
  firstName: "Dara",
  lastName: "Thornbury",
  ssn: "400-00-8873",
  relationship: "Daughter",
  dob: "09/30/2006",
  monthsLivedWithYou: 11,
  daysLivedWithYouInUs: 304,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: true,
  permanentlyDisabled: false,
};

export const COLLEGE_1098T_KEY = makeForm1098TFactKey("marion-state-college", "dara");

// Dara's college: spring and fall 2025 tuition.
const college1098T: Form1098TFactValue = {
  filerName: "Marion State College",
  filerAddress: { line1: "3001 SW College Road", city: "Ocala", state: "FL", zip: "34474" },
  filerEin: "00-0008874",
  studentName: "Dara Thornbury",
  studentTin: "XXX-XX-8873",
  box1: 4300,
  box8: true,
};

// Dara: first-year degree student, no AOTC before, no felony conviction.
const daraStudent: EducationCreditStudentFactValue = {
  studentName: "Dara Thornbury",
  studentSsn: dara.ssn!,
  institutions: [{ form1098TKey: COLLEGE_1098T_KEY, received2024Form1098TBox7: false }],
  aocClaimedFourPriorYears: false,
  enrolledHalfTimeInProgram: true,
  completedFirstFourYears: false,
  felonyDrugConviction: false,
  academicPeriods: [
    { description: "Spring 2025", tuitionAndFeesPaid: 2100, taxFreeAssistance: 0 },
    {
      description: "Fall 2025",
      tuitionAndFeesPaid: 2200,
      courseMaterialsPaid: 250,
      taxFreeAssistance: 0,
    },
  ],
};

const idFact = (suffix: string, value: string) =>
  identityFact({ userId: LINI_USER_ID, taxYear: LINI_TAX_YEAR, suffix, value });

const STATED = "Stated by Lini.";

export const liniFacts: TaxFactRow[] = [
  idFact("name.first", LINI.firstName),
  idFact("name.last", LINI.lastName),
  idFact("ssn", LINI.ssn),
  idFact("dob", "06/02/1985"),
  idFact("address.street", LINI.street),
  idFact("address.city", LINI.city),
  idFact("address.state", LINI.state),
  idFact("address.zip", LINI.zip),
  idFact("occupation", "Veterinary technician"),
  idFact("phone", "352-555-0186"),
  fact("wages", makeW2FactKey("silver-springs"), w2, "W-2 from Silver Springs Veterinary Clinic."),
  fact("dependents", makeDependentFactKey("mira"), mira, STATED),
  fact("dependents", makeDependentFactKey("owen"), owen, STATED),
  fact("dependents", makeDependentFactKey("dara"), dara, `${STATED} Form 8862 line 7: 304 days.`),
  fact("education", COLLEGE_1098T_KEY, college1098T, "1098-T from Marion State College."),
  fact(
    "education",
    makeEducationCreditStudentFactKey("dara"),
    daraStudent,
    "Stated by Lini: Dara's degree program, paid amounts by term.",
  ),
  /* The EIC questions. */
  fact("other", EIC_KEYS.nonresidentAlien, false, STATED),
  fact("other", EIC_KEYS.qualifyingChildOfAnother, false, STATED),
  fact(
    "other",
    EIC_KEYS.deniedInEarlierYear,
    true,
    "Stated by Lini: the IRS disallowed the 2023 EIC after an audit of a child's residency.",
  ),
  fact("other", EIC_KEYS.barredByIrs, false, "Stated by Lini: no ban notice."),
  /* Form 8862. */
  fact(
    "other",
    FORM_8862_KEYS.eicOnlyIncomeMisreported,
    false,
    "Stated by Lini: the 2023 denial was about residency, not income (line 3 No).",
  ),
  fact(
    "other",
    FORM_8862_KEYS.ctcDeniedInEarlierYear,
    true,
    "Stated by Lini: the 2023 child tax credit was disallowed with the EIC.",
  ),
  fact("other", FORM_8862_KEYS.ctcBarredByIrs, false, "Stated by Lini: no ban notice."),
  fact(
    "education",
    FORM_8862_KEYS.aotcDeniedInEarlierYear,
    true,
    "Stated by Lini: the 2022 AOTC for her own certificate course was disallowed.",
  ),
  fact("education", FORM_8862_KEYS.aotcBarredByIrs, false, "Stated by Lini: no ban notice."),
];
