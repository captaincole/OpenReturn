import { anyOf } from "../lib/anyOf";
import {
  blocks,
  CA540,
  CA_EXEMPTION_LIMIT,
  CA_GAINS,
  FEDERAL_110,
  insufficient,
  IRA_LIMIT,
  lite,
  type AskCase,
} from "./caseKit";

export const TIER_3: AskCase[] = [
  {
    name: "$260k wages: Additional Medicare + CA exemption",
    tier: 3,
    kind: "standard",
    question:
      "I'm single, a California resident, with $260,000 of W-2 wages and no other income. Do I owe Additional Medicare Tax, and is my California exemption credit limited?",
    coverage: ["covered"],
    authority: [
      anyOf("irs-8959-inst-2025::sec::threshold-amounts-for-additional-medicare-tax::b01"),
      CA_EXEMPTION_LIMIT,
    ],
    facts: [anyOf("200,000"), anyOf("0.9%", "540"), anyOf("252,203")],
  },
  {
    name: "Early IRA distribution, federal + CA",
    tier: 3,
    kind: "standard",
    question:
      "I'm 45 and took $20,000 out of my traditional IRA in 2025. No exception applies. What additional tax do I owe on my federal and California returns?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-5329-inst-2025::sec::part-i-additional-tax-on-early::b01",
        "irs-5329-inst-2025::sec::who-must-file::b02",
        "irs-pub-17-2025::sec::early-distributions::b01",
        "irs-pub-590b-2025::sec::additional-10-tax::b01",
        "irs-pub-590b-2025::sec::age-591-2-rule::b01",
      ),
      anyOf(
        "ftb-pub-1005-2025::sec::tax-on-early-distributions::b01",
        "ca-3805p-inst-2025::sec::line-1-early-distributions-included-in-income::b01",
      ),
    ],
    facts: [anyOf("10%", "2,000"), anyOf("2½%", "2.5%", "2 1/2%", "500")],
  },
  {
    name: "Excess IRA contribution",
    tier: 3,
    kind: "standard",
    question:
      "I'm 40 and put $8,000 into my traditional IRA for 2025, and I haven't taken any of it out. What tax applies, and how much is it?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-pub-590a-2025::sec::tax-on-excess-contributions::b01",
        "irs-pub-590a-2025::sec::excess-contributions-tax::b01",
        "irs-pub-590a-2025::sec::excess-contributions-withdrawn-by-due::b01",
        "irs-pub-17-2025::sec::excess-contributions::b01",
      ),
      IRA_LIMIT,
    ],
    facts: [anyOf("7,000", "1,000"), anyOf("6%")],
  },
  {
    name: "Rental loss, federal + CA",
    tier: 3,
    kind: "standard",
    question:
      "I actively manage a rental that lost $30,000 in 2025. My modified AGI is $120,000 and I have no other passive income. How much of the loss can I deduct on my federal return, and does California allow the same?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-8582-inst-2025::sec::special-allowance-for-rental-real::b03",
        "irs-pub-925-2025::sec::rental-activities::b09",
        "irs-pub-925-2025::sec::rental-activities::b11",
      ),
      anyOf("ca-3801-inst-2025::sec::s-corporations::b01", "ca-3801-inst-2025::sec::part-ii::b01"),
    ],
    /*
     * California allows the $25,000 active-participation allowance too (FTB
     * 3801 Part II). It does not allow the real-estate-professional rule
     * (IRC 469(c)(7)), so "all rental activities are passive" in California;
     * an answer that reads that as "no allowance" is wrong.
     */
    facts: [
      anyOf("25,000"),
      anyOf("100,000", "15,000"),
      anyOf(
        "California allows",
        "California also allows",
        "California does allow",
        "California follows",
        "same as federal",
        "same in California",
        "same for California",
        "same $25,000",
        "California, the $25,000",
        "California purposes, the $25,000",
      ),
    ],
  },
  {
    name: "Child care credit, federal + CA",
    tier: 3,
    kind: "standard",
    question:
      "We're married filing jointly, both work, have AGI of $90,000, and paid a California daycare $9,000 for our 3-year-old. What child care credit can we get on our federal and California returns?",
    coverage: ["covered"],
    authority: [
      anyOf(
        ...blocks("irs-pub-503-2025::sec::dollar-limit", [1, 2]),
        ...blocks("irs-2441-inst-2025::sec::worksheet-for-2024-expenses-paid-in-2025", [1, 3]),
        "irs-pub-503-2025::sec::randall-s-reduced-dollar-limit::b01",
      ),
      anyOf(
        "ca-3506-inst-2025::sec::line-9::b02",
        "ca-3506-inst-2025::sec::a-purpose::b01",
        `${CA540}line-40-nonrefundable-child-and-dependent-care-expenses-credit-code-232::b01`,
      ),
    ],
    facts: [anyOf("3,000"), anyOf("20%", "600"), anyOf("34%", "204")],
  },
  {
    name: "$1M AGI safe harbor, federal vs CA",
    tier: 3,
    kind: "standard",
    question:
      "My AGI will be about $1.2 million in 2025 and I live in California. Can I avoid the underpayment penalty by paying estimates based on last year's tax?",
    coverage: ["covered"],
    authority: [
      FEDERAL_110,
      anyOf(
        "ca-540es-inst-2025::sec::c-limit-on-the-use-of-prior-year-s-tax::b01",
        "ca-5805-inst-2025::sec::general-information::b01",
      ),
    ],
    facts: [anyOf("110%", "110 percent")],
  },
  {
    /*
     * The ISO spread is California-source pay by where the services were
     * performed from grant to exercise: the AMT adjustment at exercise,
     * or wages on a disqualifying sale. Only a qualifying sale after the
     * move escapes California (FTB Pub 1004). The Pub 1031 rule for
     * selling stock alone is the confident wrong answer.
     */
    name: "ISOs after moving to Florida",
    lite: true,
    tier: 3,
    kind: "standard",
    question:
      "Do I need to pay taxes on my ISOs if I no longer live in California? I now live in Florida but I was working for a tech company in San Francisco when I earned them.",
    coverage: ["covered"],
    authority: [
      anyOf(
        "ftb-pub-1004-2025::sec::qualifying-disposition-3::b01",
        "ftb-pub-1004-2025::sec::disqualifying-disposition-3::b01",
        "ftb-pub-1004-2025::sec::equity-based-compensation-summary-table::b01",
        "ftb-pub-1004-2025::sec::equity-based-compensation-summary-table::b02",
        "ftb-pub-1100-2025::sec::e-stock-options::b01",
      ),
    ],
    facts: [
      anyOf(
        "performed services",
        "services were performed",
        "services performed",
        "where you performed",
        "where you worked",
        "California source",
        "California-source",
        "CA source",
        "source in California",
      ),
      anyOf("AMT", "alternative minimum tax"),
    ],
  },
  {
    name: "CA taxes long-term gains at 15%",
    lite: true,
    tier: 3,
    kind: "false_premise",
    question:
      "Since California gives long-term capital gains the same 15% rate as the federal return, my California tax on a $100,000 long-term gain will be $15,000, right?",
    coverage: ["covered"],
    authority: [CA_GAINS],
    facts: [
      anyOf(
        "regular income",
        "ordinary income",
        "no special rate",
        "same rate",
        "same as other income",
      ),
    ],
  },
  {
    name: "Investment interest fully deductible",
    tier: 3,
    kind: "false_premise",
    question:
      "I paid $3,000 of margin interest and had $2,000 of net investment income in 2025. I can deduct all $3,000 on both my federal and California returns, right?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-4952-form-2025::sec::general-instructions::b01",
        "irs-pub-550-2025::sec::limit-on-deduction::b01",
      ),
      anyOf(
        "ca-3526-inst-2025::sec::specific-line-instructions::b01",
        "ca-3526-inst-2025::sec::a-purpose::b01",
        "ca-540-sched-ca-inst-2025::sec::line-9-investment-interest::b01",
        "ca-540nr-booklet-2025::sec::line-9-investment-interest::b01",
      ),
    ],
    facts: [anyOf("2,000", "net investment income"), anyOf("1,000", "carry", "carried")],
  },
  {
    name: "QSBS gain is tax-free in California too",
    tier: 3,
    kind: "false_premise",
    question:
      "I founded a C corporation in 2018 and sold my original shares in 2025 for a $2 million gain. QSBS makes that gain tax-free on my federal and California returns, right?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-1040sd-inst-2025::sec::exclusion-of-gain-on-qualified::b01",
        "irs-pub-550-2025::sec::section-1202-exclusion::b01",
      ),
      anyOf(
        "ca-540-sched-d-inst-2025::sec::line-1::b05",
        "ftb-pub-1001-2025::sec::capital-gains-or-losses::b05",
      ),
    ],
    facts: [anyOf("100%"), anyOf("does not conform", "doesn't conform", "not conform")],
  },
  lite(
    insufficient(
      "CA resident with New York wages",
      3,
      "I'm a California resident who worked in New York for three months in 2025. How much New York tax do I owe, and what credit does California give me for it?",
      ["partial", "not_covered"],
    ),
  ),
  /*
   * California's half is covered (treaties do not bind California unless
   * they say so); the treaty's pension article is in Pub 901, which the
   * library does not hold. "Report foreign pensions unless exempt by
   * treaty" (1040 instructions) does not answer it.
   */
  insufficient(
    "UK pension under the US–UK treaty",
    3,
    "I'm a California resident receiving a pension from my former UK employer. Is any of it exempt from US tax under the US–UK tax treaty, and does California follow the treaty?",
    ["partial"],
  ),
];
