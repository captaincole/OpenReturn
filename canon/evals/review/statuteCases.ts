/*
 * Decisions where two IRS texts disagree (docs/rule-decisions.md, row 2):
 * the judge should consult the statute and cite it. Rows 6 and 8 have no
 * decision that Cade records (the engine computes the penalty and the
 * rate), so they are Ask cases only.
 *
 * Row 2: Publication 225 counts business gains and losses on Form 8949 in
 * the excess business loss; the Form 461 instructions and section
 * 461(l)(3)(B)(i) do not count a capital loss. Each Form 461 line stays
 * under $156,500, so only the total test decides.
 */

import { anyOf } from "../lib/anyOf";
import type { ReviewCase, ReviewFact } from "./cases";

const ebLossFacts: ReviewFact[] = [
  {
    category: "filing_status",
    key: "filing_status.marital_status",
    value: "never_married",
    sourceNote: "Verbal: single, no dependents.",
  },
  {
    category: "self_employment",
    key: "business.harbor-woodworks",
    value: { form: "Schedule C", netProfitOrLoss: -140000 },
    sourceNote: "Schedule C for Harbor Woodworks, from the books.",
  },
  {
    category: "k1",
    key: "k1.tidewater-partners",
    value: {
      form: "Schedule K-1 (Form 1065)",
      box1OrdinaryBusinessIncome: -150000,
      materiallyParticipates: true,
    },
    sourceNote: "K-1 from Tidewater Partners; taxpayer works there full time.",
  },
  {
    category: "capital_gains",
    key: "capital_gains.harbor-woodworks.asset_sale",
    value: {
      form: "Form 8949",
      description: "Capital asset held in the Harbor Woodworks business",
      gainOrLoss: -40000,
      attributableToTradeOrBusiness: true,
    },
    sourceNote: "Form 8949 from the business's sale; no other capital transactions.",
  },
];

const ebLossAuthority = [
  anyOf("irs-461-inst-2025::sec::line-3::b01", "irs-461-inst-2025::sec::who-must-file::b02"),
];

export const STATUTE_CASES: ReviewCase[] = [
  {
    name: "Form 461: a business capital loss does not count (statute)",
    expectedVerdict: "accurate",
    facts: ebLossFacts,
    decision: {
      decisionKey: "decisions.scope.must_file_461",
      decision: false,
      rationale:
        "Business losses are $140,000 (Schedule C) and $150,000 (K-1), $290,000 in all, under the $313,000 single threshold, and no one line is over $156,500. The $40,000 loss on the business's capital asset does not count as a business deduction, so there is no excess business loss and Form 461 is not required.",
    },
    authority: ebLossAuthority,
    statute: { section: "461" },
  },
  {
    name: "Form 461: counts the business capital loss (statute)",
    expectedVerdict: "inaccurate",
    facts: ebLossFacts,
    decision: {
      decisionKey: "decisions.scope.must_file_461",
      decision: true,
      rationale:
        "Business losses of $140,000 and $150,000 plus the $40,000 loss on the business's Form 8949 sale total $330,000, over the $313,000 single threshold, so there is an excess business loss and Form 461 is required.",
    },
    authority: ebLossAuthority,
    statute: { section: "461" },
  },
];
