# Open questions: pass-through K-1s

Each question has its source and the default the code uses now.

1. **Trust K-1 codes the instructions do not describe.** The beneficiary's
   instructions say the codes "are identified on page 2 of Schedule K-1"
   (irs-1041k1-inst-2025::sec::part-iii-beneficiary-s-share-of-current-year::b01),
   and that page is not in the corpus. Box 13 codes F, G, I, K, M, N, P, Q and
   box 14 codes A, B, E, G have no text. Default: they map to `not_modeled`,
   with one exception: box 14 code B is foreign taxes, routed to Schedule 3
   line 1 as unsupported. No block names the letter; that a K-1 (Form 1041)
   reports foreign taxes is in
   irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02.
   Code A (tax-exempt interest, Form 1040 line 2a) stays `not_modeled`, so a
   K-1 with it is a gap on line 41. The blank K-1 (Form 1041) is not in
   `sources/`; adding it and its page 2 to the corpus would settle both.
2. **Trust box 9 codes.** The instructions name depreciation, depletion and
   amortization (irs-1041k1-inst-2025::sec::box-9-directly-apportioned-deductions::b01)
   but not which code is which. Default: codes A, B and C are
   `directly_apportioned_deduction` with no detail.
3. **A final K-1.** "If the 'Final K-1' box ... is checked, this is the final
   return for the beneficiary" (irs-1041k1-inst-2025::sec::specific-instructions::b01);
   for a shareholder it means the stock was sold or the corporation ended,
   which needs the basis computation
   (irs-1040se-inst-2025::sec::line-28::b03). Default: a final K-1 from an S
   corporation or a partnership stops at the basis stage, as unsupported.
4. **Losses carried from earlier years when the holding does not say.**
   Schedule E line 27 asks about them (irs-1040se-inst-2025::sec::line-27::b01).
   Default: an absent `carriedLosses` means none, the same rule as a
   rental's `priorYearUnallowedLoss`. Line 27 is No when every Part II K-1 is
   routed, and the gap otherwise.
5. **QBI from the section 199A statement.** The statement "may include items
   that aren't includible"; only items allowed in figuring taxable income count
   (irs-1120sk1-inst-2025::sec::box-17-other-information::b12). Default: when
   every item of the K-1 is routed (so all are allowed), the statement's QBI is
   used unchanged; otherwise Form 8995 shows the K-1's gap. One statement holds
   one trade or business; more are not modeled.
6. **When the material participation answer is asked.** It matters only for
   trade or business items (irs-1120sk1-inst-2025::sec::passive-activity-limitations::b08).
   Default: the holding is asked for its answer only when the K-1 has an item
   that is not portfolio income; a K-1 with only interest does not ask.
7. **Schedule E columns (e) and (f) for a routed K-1.** Column (e) is checked
   for a loss, a distribution, a sale of stock or a loan repayment, with the
   basis computation attached (irs-1040se-inst-2025::sec::line-28::b03);
   column (f) for amounts not at risk in an activity with a loss
   (::special-rules-that-limit-losses::b03). Default: a routed K-1 has none of
   these, so both print unchecked. Fewer shares at the end of the year than at
   the start (Part II item H) is a sale: the basis stage reports it, since
   Form 7203 and the gain on the sale are not modeled. A partnership's item J
   sale answer is not read yet.
8. **Schedule E lines A and B with only Part II.** Line A asks about payments
   that require Forms 1099 (irs-1040se-inst-2025::sec::line-a::b01) and sits in
   Part I. Default: asked only when Part I is in use, as before.
9. **A spouse's K-1 on a separate return.** Default: off the return, and its
   key waits, as a spouse's Schedule C business and rental do; community
   property splits are not modeled.
10. **Schedule K-3.** A checked box 14 (S corporation) or box 16 (partnership)
    means international items on another schedule
    (irs-1120sk1-inst-2025::sec::box-14-international-transactions::b01).
    Default: the K-1 is unsupported.
11. **A beneficiary's basis and at-risk.** The basis limits in the corpus are
    for shareholders and partners (irs-1120sk1-inst-2025::sec::basis-limitations::b01,
    irs-1065k1-inst-2025::sec::basis-limitations). Default: the basis stage
    passes a trust K-1; the passive stage reports a loss in boxes 6 to 8,
    since the rules for beneficiaries "haven't yet been issued"
    (irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01).
12. **The excess business loss cap.** It applies to an aggregate business loss
    above the threshold, figured with every business on the return (Form 461,
    irs-1120sk1-inst-2025::sec::excess-business-loss-limitations::b01). Default:
    any K-1 business loss is unsupported, even a small one. The basis stage
    already stops every loss in this step.
13. **Scenario `lan`: who owns which business.** The task gives the spouse the
    Schedule C and the taxpayer the S corporation. A spouse's Schedule SE on a
    joint return is not modeled (`schedule-se/resolveInfo.ts`). Default: the
    taxpayer (first on the return) has the Schedule C; the spouse owns the S
    corporation. The K-1 holding then shows a spouse's K-1 on a joint return.
14. **Scenario `lan`: the son is 18.** With self-employment, Schedule 8812 line
    18a takes EIC Worksheet B line 4b when the filer takes the EIC
    (irs-1040s8-inst-2025::sec::earned-income-chart-line-18a::b01), which the
    engine does not read yet: line 18a is unsupported for every return with a
    Schedule C and a child under 17. That gap has nothing to do with K-1s, and
    fixing it would move existing goldens. Default: the son is 18, a
    qualifying child for the EIC but not for the child tax credit. The gap
    should get its own issue.
15. **The payer name of a K-1 row on Schedule B.** "List each payer's name and
    the amount" (irs-1040sb-inst-2025::sec::line-1::b01); no block gives a
    "From K-1" wording. Default: the row is the estate's or trust's name as
    Part I prints it.
16. **Which Part III column takes boxes 6 to 8.** Box 5 is "income that isn't
    subject to the passive activity rules" (column (f)); for boxes 6 to 8 the
    rules for beneficiaries "haven't yet been issued"
    (irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01;
    irs-8582cr-inst-2025::sec::material-participation::b06). Default: column
    (d), passive income, which keeps it in net investment income (Form 8960
    line 4a, no line 4b adjustment). While Form 8582 files, Part III is
    unsupported: Form 8582 does not take a K-1's passive income yet.
17. **Boxes 4b and 4c and the tax.** A 28% rate gain or an unrecaptured
    section 1250 gain goes on its worksheet
    (irs-1041k1-inst-2025::sec::boxes-4b-and-4c-28-rate-gain-and::b01), and
    then Schedule D line 20 sends the return to the Schedule D Tax Worksheet.
    Default: Schedule D lines 18, 19 and 20 are unsupported and name the trust,
    but Form 1040 line 16 still uses the qualified dividends worksheet, which
    can understate the tax. A 1099-DIV with boxes 2b or 2d has the same gap
    today. Fixing it means Form 1040 line 16, which waits for a person.
18. **A beneficiary's holding.** The passive stage asks a trust nothing; the
    holding then decides only whose K-1 it is. Default: on a joint return a
    trust K-1 does not ask for its holding; on any other return it does (an
    absent holding keeps the K-1 on the return, as before).
19. **When a trust K-1 files Schedule E.** Part III takes boxes 5 to 8 only
    (irs-1040se-inst-2025::sec::part-iii::b01). Default: a trust K-1 with none
    of them files Schedule E only while it is unsupported (line 41 shows the
    gap) or waits on an answer (Schedule E holds the key Cade asks for).
20. **Section 199A dividends on any statement.** The S corporation statement
    reports them too (irs-1120sk1-inst-2025::sec::box-17-other-information::b13).
    Default: every K-1's statement adds its section 199A dividends to Form 8995
    line 6 or 8995-A line 28; qualified PTP income stays unsupported.
21. **QBI from a trust's business.** The beneficiary's QBI is apportioned from
    the trust's trades or businesses (irs-1041k1-inst-2025::sec::box-14-other-information::b04).
    Default: a trust statement with QBI is one more business row whose QBI is
    unsupported; a statement with section 199A dividends only adds no business.
22. **The foreign tax credit not taken.** Schedule 3 files and line 1 is
    unsupported, naming the trust; the tax lines compute without the credit,
    so they can overstate the tax, and an unsupported line does not make the
    return pending. A taxpayer may also deduct foreign taxes on Schedule A
    instead. Default: as described; Form 1116 is the next step.
23. **Box 14 code H and MAGI.** A positive code H increases MAGI
    (irs-8960-inst-2025::sec::line-13-modified-adjusted-gross-income-magi::b03).
    Default: Form 8960's must-file bound adds a positive code H; lines 7 and 13
    are unsupported when code H is not 0, and line 15 waits on line 13, so line
    17 never shows a tax it did not figure.
24. **Items with no line.** Only the gross receipts for section 448(c) (S
    corporation box 17 code AC, partnership box 20 code AG) route to
    `no_line`: they help figure Form 8990
    (irs-1120sk1-inst-2025::sec::box-17-other-information::b16). Excess taxable
    income and excess business interest income (codes AA, AB; AE, AF) go on
    Form 8990 "if you are required to file" it (::b15,
    irs-1065k1-inst-2025::sec::part-xiii::b02), so they stay unrouted.
