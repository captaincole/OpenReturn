import { brokerage1099Skill } from "./brokerage1099";
import { careProviderStatementSkill } from "./careProviderStatement";
import { cleanVehicleReportSkill } from "./cleanVehicleReport";
import { creditQuestionsSkill } from "./creditQuestions";
import { dependentsSkill } from "./dependents";
import { energyInvoiceSkill } from "./energyInvoice";
import { foreignIncomeStatementSkill } from "./foreignIncomeStatement";
import { form1095ASkill } from "./form1095A";
import { form1098Skill } from "./form1098";
import { form1098ESkill } from "./form1098E";
import { form1098TSkill } from "./form1098T";
import { form1099GSkill } from "./form1099G";
import { form1099LtcSkill } from "./form1099Ltc";
import { form1099RSkill } from "./form1099R";
import { form1099SASkill } from "./form1099SA";
import { form3921Skill } from "./form3921";
import { futuresStatementSkill } from "./futuresStatement";
import { gamblingSkill } from "./gambling";
import { investmentsSkill } from "./investments";
import { mortgageCreditCertificateSkill } from "./mortgageCreditCertificate";
import { otherIncomeSkill } from "./otherIncome";
import { rentalSkill } from "./rental";
import { savingsBondRecordSkill } from "./savingsBondRecord";
import { scheduleK1Skill } from "./scheduleK1";
import { selfEmploymentSkill } from "./selfEmployment";
import { ssa1099Skill } from "./ssa1099";
import { w2Skill } from "./w2";

/*
 * Every document type and topic Cade has rules for. A new ingest tool needs
 * a skill that names it: tests/unit/mastra/skills/topicSkills.test.ts fails
 * when a tool in ingestTools has none.
 */
export const topicSkills = [
  w2Skill,
  brokerage1099Skill,
  form1099RSkill,
  form1099SASkill,
  ssa1099Skill,
  form1098Skill,
  form1098ESkill,
  energyInvoiceSkill,
  gamblingSkill,
  form1099GSkill,
  form1095ASkill,
  form3921Skill,
  form1098TSkill,
  foreignIncomeStatementSkill,
  cleanVehicleReportSkill,
  futuresStatementSkill,
  careProviderStatementSkill,
  mortgageCreditCertificateSkill,
  savingsBondRecordSkill,
  form1099LtcSkill,
  selfEmploymentSkill,
  rentalSkill,
  scheduleK1Skill,
  dependentsSkill,
  investmentsSkill,
  otherIncomeSkill,
  creditQuestionsSkill,
];

/* The skills, in the shape an agent's `skills` setting takes. */
export const topicSkillList = topicSkills.map((topic) => topic.skill);
