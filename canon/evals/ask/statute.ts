import { anyOf } from "../lib/anyOf";
import type { AskCase } from "./caseKit";

/*
 * Questions where two IRS texts disagree, or an instruction names a rule
 * of law without stating it (docs/rule-decisions.md, rows 2, 6 and 8), or
 * the taxpayer asks for the statute itself. The answer should consult the
 * statute and cite the named section; the true answer is the decided row's.
 *
 * Not reviewed by a person yet: agents wrote and checked these cases. Use the scores for development only.
 */

export const STATUTE: AskCase[] = [
  {
    // Row 2: Publication 225 counts Form 8949 business losses; Form 461 and 461(l)(3)(B)(i) do not.
    name: "Business capital loss in the excess business loss (statute)",
    tier: 3,
    kind: "conflict",
    question:
      "My sole proprietorship sold a capital asset it held for the business at a $40,000 loss, reported on Form 8949. Does that capital loss count as a business deduction when I figure my excess business loss on Form 461?",
    coverage: ["covered"],
    authority: [
      anyOf("irs-461-inst-2025::sec::line-3::b01", "irs-461-inst-2025::sec::who-must-file::b02"),
    ],
    facts: [anyOf("not included", "not be taken into account", "not taken into account")],
    statute: { section: "461" },
  },
  {
    // Row 6: withholding counts as paid in four parts (Table 1, 6654(g)(1)); line 1b says not to enter it.
    name: "Withholding in the Form 2210 penalty worksheet (statute)",
    tier: 3,
    kind: "conflict",
    question:
      "On the Form 2210 penalty worksheet, line 1b says not to enter withheld federal income tax. Does the tax withheld from my wages still count toward paying my underpayments, and on what dates?",
    coverage: ["covered"],
    authority: [
      anyOf(
        "irs-2210-inst-2025::sec::table-1-estimated-tax-payments::b01",
        "irs-2210-inst-2025::sec::line-1b::b01",
      ),
    ],
    facts: [anyOf("one-fourth", "one fourth", "1/4", "equal part")],
    statute: { section: "6654" },
  },
  {
    // Row 8: 6621(b)(2)(B) carries a quarter's rate to April 15 only for the section 6654 penalty.
    name: "Form 8621 interest rate for April 1 to 15 (statute)",
    tier: 3,
    kind: "conflict",
    question:
      "Form 8621 figures interest on the deferred tax using the rates under section 6621. Does the first-quarter 2026 rate apply through April 15, 2026, the way it does for the Form 2210 estimated tax penalty?",
    coverage: ["covered"],
    authority: [anyOf("irs-8621-inst-2025::sec::line-16f::b01")],
    // "April 1" would match "April 15" in the answer, so the facts name the quarter.
    facts: [
      anyOf(
        "second quarter",
        "second-quarter",
        "next quarter",
        "following quarter",
        "quarter beginning",
      ),
    ],
    statute: { section: "6621" },
  },
  {
    // The taxpayer asks for the law itself: 469(g)(1)(A) frees the loss on a full sale.
    name: "Shows the statute when asked for it (statute)",
    tier: 3,
    kind: "law_request",
    question:
      "I sold my entire interest in a rental property that had suspended passive losses. Can I deduct them now? Please show me the statute itself, not only the form instructions.",
    coverage: ["covered"],
    authority: [],
    facts: [anyOf("entire interest")],
    statute: { section: "469" },
  },
  {
    // 63(f)(2) sets the addition; the instructions print only the inflation-adjusted amounts.
    name: "Shows the statute for the blind addition (statute)",
    tier: 3,
    kind: "law_request",
    question:
      "Can you show me the statute on setting the standard deduction addition for blind filers?",
    coverage: ["covered", "partial"],
    authority: [],
    facts: [anyOf("$600")],
    statute: { section: "63" },
  },
];
