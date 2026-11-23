# Open questions: pass-through K-1s

Each question has its source and the default the code uses now.

1. **Trust K-1 codes the instructions do not describe.** The beneficiary's
   instructions say the codes "are identified on page 2 of Schedule K-1"
   (irs-1041k1-inst-2025::sec::part-iii-beneficiary-s-share-of-current-year::b01),
   and that page is not in the corpus. Box 13 codes F, G, I, K, M, N, P, Q and
   box 14 codes A, B, E, G have no text. Default: they map to `not_modeled`,
   with one exception: box 14 code B is foreign taxes, routed to Schedule 3
   line 1 (a Form 1116 source, item 22). No block names the letter; that a K-1
   (Form 1041) reports foreign taxes is in
   irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02
   and irs-pub-514-2025::sec::you-must-have-paid-or-accrued-the::b03.
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
   rental's `priorYearUnallowedLoss`. A carried basis loss is held by item
   (last year's Form 7203 Part III column (e)). Line 27 is Yes when a routed
   K-1 has an allowed item from an earlier year, No when every Part II K-1 is
   routed with none, and the gap otherwise.
5. **QBI from the section 199A statement.** The statement "may include items
   that aren't includible"; only items allowed in figuring taxable income count
   (irs-1120sk1-inst-2025::sec::box-17-other-information::b12). Losses a limit
   suspends are not QBI, and "the allowed loss or deduction is then multiplied
   by this percentage to determine the portion of the allowed loss or
   deduction attributable to QBI" (irs-8995-inst-2025::sec::determining-your-qualified-business::b02,
   ::b03). Default: when every item is routed and the limits hold back none of
   the business losses (not portfolio, not charitable), the statement's QBI is
   used unchanged. When they hold back part, a negative statement QBI is
   scaled by the allowed business losses over this year's business losses
   (the percentage method of ::b03, reading the statement's QBI as the QBI
   part of the whole loss); a statement QBI of 0 or more with a loss held
   back is a gap. One statement holds one trade or business; more are not
   modeled.
6. **When the material participation answer is asked.** It matters only for
   trade or business items (irs-1120sk1-inst-2025::sec::passive-activity-limitations::b08).
   Default: the holding is asked for its answer only when the K-1 has an item
   that is not portfolio income; a K-1 with only interest does not ask.
7. **Schedule E columns (e) and (f) for a routed K-1.** Column (e) is checked
   for a loss, a distribution, a sale of stock or a loan repayment, with the
   basis computation attached (irs-1040se-inst-2025::sec::line-28::b03);
   column (f) for amounts not at risk in an activity with a loss
   (::special-rules-that-limit-losses::b03). Default: column (e) is checked
   when Form 7203 files for the K-1 (`needsForm7203`); column (f) is No, since
   the at-risk stage routes a loss only when all of the investment is at
   risk. A "PYA" row leaves both blank: the K-1's own row answers them. A
   sale of stock stops at the basis stage. A partnership's item J sale
   answer is not read yet.
8. **Schedule E lines A and B with only Part II.** Line A asks about payments
   that require Forms 1099 (irs-1040se-inst-2025::sec::line-a::b01) and sits in
   Part I. Default: asked only when Part I is in use, as before.
9. **A spouse's K-1 on a separate return.** Default: off the return, and its
   key waits, as a spouse's Schedule C business and rental do; community
   property splits are not modeled.
10. **Schedule K-3.** A checked box 14 (S corporation) or box 16 (partnership)
    means international items on another schedule
    (irs-1120sk1-inst-2025::sec::box-14-international-transactions::b01).
    Default: the K-1 is unsupported. A partnership's box 21 foreign taxes have
    no route yet, so its K-1 is unsupported too.
11. **A beneficiary's basis and at-risk.** The basis limits in the corpus are
    for shareholders and partners (irs-1120sk1-inst-2025::sec::basis-limitations::b01,
    irs-1065k1-inst-2025::sec::basis-limitations). Default: the basis stage
    passes a trust K-1; the passive stage reports a loss in boxes 6 to 8,
    since the rules for beneficiaries "haven't yet been issued"
    (irs-1041k1-inst-2025::sec::box-5-other-portfolio-and-nonbusiness-income::b01).
12. **The excess business loss cap.** It applies to an aggregate business loss
    above the threshold, figured with every business on the return (Form 461,
    irs-1120sk1-inst-2025::sec::excess-business-loss-limitations::b01). An
    excess business loss is the amount by which business deductions are more
    than business income "plus the threshold amount", $313,000 or $626,000 on
    a joint return for 2025 (irs-461-inst-2025::sec::who-must-file::b02).
    Form 461 must be attached when net business losses are more than the
    threshold, or "a loss of more than $156,500 on any one of Form 461, lines
    1 through 8" (::b01). Default (`excessBusinessLoss.ts`): the stage adds
    every K-1 business loss that reaches it and the return's other business
    losses (each Schedule C line 31 loss and each rental's loss before the
    passive rules, `otherBusinessLosses` in `receipts.ts`), without any
    income. At or below the threshold no loss can be limited and the items
    pass in full; above it the K-1 is unsupported, since the income side and
    Form 461's rules are not modeled. An unknown filing status uses the lower
    threshold (no other stage waits on the status). Separately, Form 461's
    resolver files the form when the K-1 and rental losses (line 5) or the
    Schedule C losses (line 2), added without income, are more than $156,500.
    That bound can require the form when a line nets below $156,500; Form 461
    has no rules, so it shows as filed with every line unsupported, and the
    rest of the return computes. A business whose amount is not known yet
    makes the K-1 wait on that business's fact. A K-1 stopped at an earlier
    stage is not added; its own gap already keeps the return from looking
    finished.
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
    unsupported: Form 8582 does not take a K-1's passive income yet. Form
    8960's filing test counts the same income: every rental item, a trust's
    business income, and the business income of a K-1 whose owner did not
    materially participate (irs-8960-inst-2025::sec::passive-activity::b01).
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
22. **A K-1's foreign taxes.** A K-1 (Form 1041) is a qualified payee
    statement for the election
    (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02);
    an S corporation's or a partnership's foreign taxes come from Schedule K-3
    (irs-1120sk1-inst-2025::sec::box-16-items-affecting-shareholder-basis::b02:
    "Do not use this amount to complete your Form 1116";
    irs-pub-514-2025::sec::you-must-have-paid-or-accrued-the::b02). Default: a
    trust K-1 is one passive category source in `1116/sources.ts`, and the
    election and Form 1116 read it like a 1099-DIV. Passive because the trust's
    items are interest and dividends (irs-pub-514-2025::sec::passive-category-income::b01);
    no block gives a beneficiary another category. Form 1116 needs the
    trustee's statement (the K-1 fact's `foreignIncome`: the foreign-source
    gross income, its qualified dividends, the country or "RIC", and whether
    it is dividends or interest); while it is missing, Form 1116 waits on the
    K-1 fact. One statement holds one country; foreign capital gains from a
    trust are not modeled. Part II column (l) prints "1099 taxes": the K-1
    reports the tax in U.S. dollars, a "similar statement"
    (irs-1116-inst-2025::sec::part-ii-foreign-taxes-paid-or::b04). An S
    corporation's box 16 code F makes Schedule 3 line 1 a gap that names it.
    A taxpayer may also deduct foreign taxes on Schedule A instead; no
    decision records that.
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
25. **Splitting an allowed amount between this year's item and a carried one.**
    Form 7203 Part III prorates each line's columns (a) plus (b) together
    (irs-7203-inst-2025::sec::part-iii::b01, ::b02). The routes need the two
    apart: a carried loss allowed now has its own Schedule E row and goes on
    Form 8995 line 3. Default: one Part III row for each item, this year's and
    each carried one, prorated on its own; a line prints the sum of its rows.
    With rounding the line can differ by a dollar from prorating the line once.
26. **The qualified part of a carried loss.** Form 8995 line 3 takes "the
    qualified portion of trade or business (loss) carryforward allowed in
    calculating taxable income in the current year"
    (irs-8995-inst-2025::sec::line-3::b01), and line 1 never takes it
    (::specific-instructions::b02). Losses from before 2018 are not qualified
    (::determining-your-qualified-business::b03). Default: the holding gives
    the qualified part of the carried ordinary loss
    (`carriedQualifiedBusinessLoss`, the QBI Loss Tracking Worksheet's column
    I); the allowed part times its share is line 3, and the QBI form waits on
    the holding while it is missing. No fact gives last year's Form 8995 line
    16, so line 3 counts only the K-1's part, and stays the old gap without
    one. On Form 8995-A the K-1's QBI is a gap: Schedule C (Form 8995-A) line 2
    has no rules.
27. **A K-1 contribution other than cash to a 60% organization.** Code A goes
    on Schedule A line 11 subject to the 60% limit; codes B to G have other
    limits or lines (irs-1120sk1-inst-2025::sec::box-12-other-deductions::b06
    to ::b08). Default: only code A is added to line 11; any other allowed
    contribution makes line 11 a gap that names it. On the standard deduction
    no line takes them.
28. **Distributions and nondeductible expenses route nowhere.** Box 16 codes B,
    C and D change basis only (irs-1120sk1-inst-2025::sec::box-16-items-affecting-shareholder-basis::b01).
    Default: they route to `form_7203`, which no form reads as a receipt, so
    they never count as dropped. A distribution above basis stops the K-1
    (federal/7203/QUESTIONS.md).
29. **A partnership's basis.** The partner's basis has no IRS form, only the
    worksheet in irs-1065k1-inst-2025::sec::basis-limitations. Default: a
    partnership K-1 with a loss, deduction, distribution, loan repayment or
    carried basis loss stays unsupported at the basis stage (README.md, "What
    the next steps add").
