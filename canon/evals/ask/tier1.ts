import { anyOf } from "../lib/anyOf";
import { blocks, CA540, insufficient, IRA_LIMIT, lite, type AskCase } from "./caseKit";

export const TIER_1: AskCase[] = [
  {
    name: "HSA limit, self-only",
    lite: true,
    tier: 1,
    kind: "standard",
    question: "What is the maximum HSA contribution for self-only coverage in 2025?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-8889-inst-2025::sec::figuring-your-hsa-deduction::b01",
        "irs-8889-inst-2025::sec::line-3::b01",
        "irs-pub-969-2025::sec::limit-on-contributions::b01",
      ),
    ],
    facts: [anyOf("4,300")],
  },
  {
    name: "CA standard deduction, single",
    lite: true,
    tier: 1,
    kind: "standard",
    question: "What is the California standard deduction for a single filer in 2025?",
    coverage: ["covered"],
    authority: [blocks(`${CA540}california-standard-deduction-chart-for-most-people`, [1, 2, 3])],
    facts: [anyOf("5,706")],
  },
  {
    name: "IRA contribution limit",
    lite: true,
    tier: 1,
    kind: "standard",
    question: "I'm 40. How much can I contribute to an IRA for 2025?",
    coverage: ["covered"],
    authority: [IRA_LIMIT],
    facts: [anyOf("7,000")],
  },
  {
    name: "Gift tax annual exclusion",
    tier: 1,
    kind: "standard",
    question: "How much can I give my nephew in 2025 without having to file a gift tax return?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-709-inst-2025::sec::what-s-new::b02",
        ...blocks("irs-709-inst-2025::sec::who-must-file", [1, 2]),
        "irs-709-inst-2025::sec::annual-exclusion::b01",
      ),
    ],
    facts: [anyOf("19,000")],
  },
  {
    name: "Estimated tax due dates",
    tier: 1,
    kind: "standard",
    question: "When do I have to pay estimated quarterly taxes?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-1040es-form-2025::sec::payment-due-dates::b01",
        "irs-1040es-form-2025::sec::form-1040-es-2::b01",
      ),
    ],
    facts: [anyOf("June 16"), anyOf("January 15", "Jan. 15", "Jan 15")],
  },
  {
    name: "Married mid-year",
    tier: 1,
    kind: "standard",
    question: "If I got married halfway through the year, do I file as the whole year MFJ?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-pub-501-2025::sec::marital-status::b03",
        "irs-pub-17-2025::sec::useful-items::b04",
        ...blocks("irs-pub-501-2025::sec::married-filing-jointly", [1, 2]),
      ),
    ],
    facts: [anyOf("whole year", "entire year", "all year", "full year"), anyOf("separate")],
  },
  {
    name: "Home sale exclusion is $500,000 (single)",
    lite: true,
    tier: 1,
    kind: "false_premise",
    question:
      "I'm single and selling the home I've lived in for 10 years. The 2025 gain exclusion is $500,000, right?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-pub-523-2025::sec::what-s-new::b04",
        "irs-pub-523-2025::sec::does-your-home-sale-qualify::b01",
        "irs-pub-523-2025::sec::eligibility-test::b01",
        "irs-pub-523-2025::sec::basis-adjustments-details-and::b01",
        "irs-pub-554-2025::sec::maximum-amount-of-exclusion::b01",
      ),
    ],
    facts: [anyOf("250,000")],
  },
  {
    name: "Standard deduction is $14,600 (single)",
    tier: 1,
    kind: "false_premise",
    question: "The 2025 federal standard deduction for a single filer is $14,600, right?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-1040-inst-2025::sec::health-coverage-reporting::b02",
        "irs-1040-inst-2025::sec::line-16::b03",
        "irs-pub-501-2025::sec::who-should-itemize::b04",
        "irs-pub-17-2025::sec::who-should-itemize::b05",
      ),
    ],
    facts: [anyOf("15,750")],
  },
  lite(
    insufficient(
      "New York standard deduction",
      1,
      "What is the New York State standard deduction for a single filer in 2025?",
    ),
  ),
  insufficient("Oregon top tax rate", 1, "What is Oregon's top income tax rate for 2025?"),
];
