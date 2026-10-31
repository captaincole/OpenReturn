import {
  blocks,
  CA_EXEMPTION_LIMIT,
  FEDERAL_110,
  insufficient,
  lite,
  type AskCase,
} from "./caseKit";

export const TIER_2: AskCase[] = [
  {
    name: "Child tax credit phase-out",
    lite: true,
    tier: 2,
    kind: "standard",
    question: "At what income level would I no longer be able to take the child tax credit?",
    /* The corpus has the phase-out thresholds but not the $50-per-$1,000 reduction, so "partial" is right too. */
    coverage: ["covered", "partial"],
    authority: [
      [
        "irs-1040s8-inst-2025::sec::limits-on-the-ctc-and-odc::b01",
        "irs-pub-17-2025::sec::limits-on-the-ctc-and::b01",
      ],
    ],
    facts: [["200,000"], ["400,000"]],
  },
  {
    name: "CA exemption credit AGI limit",
    tier: 2,
    kind: "standard",
    question: "How is the California exemption credit limited when my federal AGI is high?",
    coverage: ["covered"],
    authority: [CA_EXEMPTION_LIMIT],
    facts: [["252,203"]],
  },
  {
    name: "FTB 5805 annualization amounts",
    lite: true,
    tier: 2,
    kind: "standard",
    question:
      "What annualization amounts does California use for the annualized income installment method on form FTB 5805?",
    coverage: ["covered"],
    authority: [["ca-5805-inst-2025::sec::federal-annualized-income-worksheet::b02"]],
    facts: [["2.4"], ["1.5"]],
  },
  {
    name: "AMT and the following year",
    tier: 2,
    kind: "standard",
    question: "What is AMT and how does it work the following year?",
    coverage: ["covered"],
    authority: [
      ["irs-6251-inst-2025::sec::purpose-of-form::b01"],
      [
        "irs-6251-inst-2025::sec::credit-for-prior-year-minimum-tax::b01",
        "irs-8801-inst-2025::sec::general-instructions::b01",
        "irs-8801-inst-2025::sec::who-should-file::b01",
      ],
    ],
    facts: [["8801"]],
  },
  {
    name: "Net investment income tax",
    tier: 2,
    kind: "standard",
    question:
      "I'm single with $220,000 of modified AGI, including $40,000 of investment income. How much net investment income tax do I owe?",
    coverage: ["covered"],
    authority: [
      [
        "irs-8960-inst-2025::sec::application-to-individuals::b01",
        "irs-8615-inst-2025::sec::net-investment-income-tax-niit::b01",
      ],
    ],
    facts: [["3.8%"], ["200,000", "760"]],
  },
  {
    name: "Roth IRA income limit, single",
    tier: 2,
    kind: "standard",
    question:
      "As a single filer, at what income can I no longer contribute to a Roth IRA for 2025?",
    coverage: ["covered"],
    authority: [
      [
        "irs-pub-590a-2025::sec::what-s-new-for-2025::b03",
        "irs-pub-590a-2025::sec::can-you-contribute-to-a-roth::b10",
        "irs-pub-17-2025::sec::how-much-can-be-contributed::b04",
        "irs-pub-17-2025::sec::what-s-new-2::b02",
      ],
    ],
    facts: [["150,000"], ["165,000"]],
  },
  {
    name: "Saver's credit limit is $100,000 (MFJ)",
    tier: 2,
    kind: "false_premise",
    question:
      "We're married filing jointly with AGI of $95,000. We still get the saver's credit since the limit is $100,000, right?",
    /*
     * The limit is on modified AGI. Partial is right when the answer has no
     * passage saying what the modification is; with b03 (AGI plus foreign
     * income exclusions, so never below $95,000) the answer is covered.
     */
    coverage: ["covered", "partial"],
    authority: [
      [
        ...blocks("irs-8880-form-2025::sec::omb-no-1545-0074", [1, 2]),
        "irs-8880-form-2025::sec::who-can-take-this-credit::b01",
        "irs-pub-590a-2025::sec::retirement-savings::b01",
      ],
      ["irs-pub-590a-2025::sec::retirement-savings::b03"],
    ],
    facts: [["79,000"]],
  },
  {
    name: "Safe harbor is 100% over $150,000 AGI",
    lite: true,
    tier: 2,
    kind: "false_premise",
    question:
      "My 2024 AGI was $200,000. If I pay 100% of my 2024 tax through withholding and estimates, I'm safe from the underpayment penalty, right?",
    coverage: ["covered"],
    authority: [FEDERAL_110],
    facts: [["110%", "110 percent"]],
  },
  /*
   * Pub 463 has the general CONUS and high-low rates but not the San
   * Francisco rate (GSA publishes it). "partial" is right when the answer
   * gives those rates and says the city rate is not in the library.
   */
  insufficient(
    "San Francisco lodging per diem",
    2,
    "What is the 2025 federal per diem lodging rate for San Francisco?",
    ["not_covered", "partial"],
  ),
  lite(
    insufficient(
      "Washington capital gains tax",
      2,
      "What is Washington state's capital gains tax rate for 2025?",
    ),
  ),
];
