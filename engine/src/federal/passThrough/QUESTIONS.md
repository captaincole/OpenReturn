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
   corporation stops at the basis stage, as unsupported. A final partnership
   K-1 goes on when the holding records the disposition of the entire interest
   (`disposedOfEntirely`, item 32); without it, and for a partial sale (item
   J), it stops there.
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
   modeled. A statement with W-2 wages or UBIA but no QBI amount is a
   business row whose QBI is a gap: Form 8995-A lines 4 and 7 are 0 when the
   business's QBI is 0 (irs-8995a-inst-2025::sec::line-4-3::b01, ::line-7::b02),
   but an absent QBI is not a stated 0, so the engine does not print the row
   with 0 income.
6. **When the material participation answer is asked.** It matters only for
   trade or business items (irs-1120sk1-inst-2025::sec::passive-activity-limitations::b08).
   Default: the holding is asked for its answer only when the K-1 has an item
   that is not portfolio income; a K-1 with only interest does not ask. A
   partnership K-1 asks it for a business item (boxes 1, 10 to 13) or a
   carried passive loss, and asks the real estate professional answer for a
   rental item (boxes 2 and 3,
   irs-1065k1-inst-2025::sec::box-2-net-rental-real-estate-income-loss::b01).
7. **Schedule E columns (e) and (f) for a routed K-1.** Column (e) is checked
   for a loss, a distribution, a sale of stock or a loan repayment, with the
   basis computation attached (irs-1040se-inst-2025::sec::line-28::b03);
   column (f) for amounts not at risk in an activity with a loss
   (::special-rules-that-limit-losses::b03). Default: column (e) is checked
   when Form 7203 files for the K-1 (`needsForm7203`); column (f) is No, since
   the at-risk stage routes a loss only when all of the investment is at
   risk. A "PYA" row leaves both blank: the K-1's own row answers them. A
   sale of stock stops at the basis stage. A partnership's row leaves column
   (e) unchecked: the line 28 instructions ask for the basis computation from
   an S corporation's owner only (::line-28::b03). A partnership's item J
   sale answer stops the K-1 (item 3).
8. **Schedule E lines A and B with only Part II.** Line A asks about payments
   that require Forms 1099 (irs-1040se-inst-2025::sec::line-a::b01) and sits in
   Part I. Default: asked only when Part I is in use, as before.
9. **A spouse's K-1 on a separate return.** Default: off the return, and its
   key waits, as a spouse's Schedule C business and rental do; community
   property splits are not modeled.
10. **Schedule K-3.** A checked box 14 (S corporation) or box 16 (partnership)
    means international items on another schedule
    (irs-1120sk1-inst-2025::sec::box-14-international-transactions::b01).
    Default: the K-1 is unsupported. A partnership's box 21 foreign taxes go to
    Schedule 3 line 1, which is the gap that names them, as an S corporation's
    box 16 code F (item 22).
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
    unsupported: Form 8582 takes a partnership K-1's passive income (item
    32 to 35) but not a trust K-1's, since the beneficiary rules are not
    issued. Form
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
    worksheet (irs-1065k1-inst-2025::sec::basis-limitations::b01,
    ::use-the-worksheet-for-adjusting-the-basis-of-a::b01). Default
    (`partnerBasis.ts`): the worksheet's lines in its order. The engine
    assumes no liabilities assumed either way (lines 3d and 9b, ::line-3d::b01,
    ::line-9b::b01), no gain on contributed property (line 5) and no excess
    depletion (lines 6 and 13): no fact holds them. A K-1 that gives item K1
    at one end of the year only waits on the K-1 fact; neither end means no
    share of liabilities. Business interest expense (box 20 code N, line 4n and
    line 15q), excess business interest expense (box 13 code K), a
    distribution other than cash (box 19 codes B to G), a distribution above
    basis (line 11b), nondeductible expenses above basis (line 12 column E)
    and a loss held back in the year the interest is sold are each a gap that
    names the K-1. The liabilities share counts as basis whatever kind of debt
    it is; whether it is at risk is the at-risk stage's question (item 36).
30. **A nonpassive K-1 business and net investment income.** Line 4a takes
    all of Schedule 1 line 5, and line 4b takes out "net income or loss from a
    section 162 trade or business that's not a passive activity"
    (irs-8960-inst-2025::sec::line-4a-income-from-trades-businesses::b01,
    ::b02; ::line-4b-adjustment-for-net-income-or-loss::b01). The trade or
    business must be a section 162 one and nonpassive, "with the exception of
    a trade or business of trading in financial instruments or commodities",
    whose income stays in NII; for a pass-through entity the test "is made at
    that entity's level" (::trade-or-business-activities::b01). Default: the
    K-1 items on Schedule E Part II columns (i) and (k) (nonpassive ordinary
    business income or loss, a "PYA" row included) of an owner who materially
    participated are a section 162 business that does not trade, so line 4b
    takes them out: income negative, a loss positive. No fact marks a trading
    entity; one would need its own answer. A partnership's self-employment
    income (::special-rule-for-self-employed::b01) has no route yet. The
    corpus has no rule on working capital for line 4b. Passive K-1 income (a
    trust's Part III column (d), a partnership's column (h)) stays in NII, and
    so does a partnership's rental, which is passive for every partner but a
    real estate professional (irs-1065k1-inst-2025::sec::box-2-net-rental-real-estate-income-loss::b01):
    line 4b takes only box 1.
31. **Guaranteed payments and net investment income.** Boxes 4a and 4b go in
    Schedule E column (k) (irs-1065k1-inst-2025::sec::box-4a-guaranteed-payments-for-services::b01,
    ::box-4b-guaranteed-payments-for-capital::b01), so Form 8960 line 4a takes
    them in. The Form 8960 instructions in the corpus do not name guaranteed
    payments; line 4b removes income "taken into account in determining
    self-employment income" (irs-8960-inst-2025::sec::line-4b-adjustment-for-net-income-or-loss::b01),
    which may cover box 4a but not box 4b. Default: a K-1 with guaranteed
    payments makes line 4b a gap that names it.
32. **An entire disposition: which column.** With an overall loss the
    activity is not entered on Form 8582 and every loss is allowed
    (irs-8582-inst-2025::sec::reporting-an-entire-disposition-on-form-4797-or::b01).
    Two readings say where. The Form 8582 example puts "the net loss plus the
    prior-year unallowed loss" in Schedule E Part II column (i) (::b03); the
    Schedule E instructions put a prior-year passive loss released by a
    disposition "on a separate line in column (g)" with "PYA"
    (irs-1040se-inst-2025::sec::prior-year-unallowed-losses-from-a-passive::b01).
    Default: the Schedule E reading (scenario `bayle`): this year's passive
    loss in column (g) on the K-1's own row (the applicable column,
    irs-1040se-inst-2025::sec::line-28::b01), the carried passive loss in
    column (g) on its own "PYA" row. Schedule E's instructions govern how
    Schedule E prints; the Form 8582 example describes the worksheet; and the
    S corporation's carried basis loss already takes a PYA row, so one layout
    serves both. The totals are the same either way. Line 27 is Yes: the
    carried loss is not reported on Form 8582. The released losses stay in net
    investment income, with no Form 8960 line 4b adjustment: "the suspended
    passive losses from that activity are allowed in full as a properly
    allocable deduction" (irs-8960-inst-2025::sec::disposition-of-entire-interest::b01).
    Form 8582 line 6 still counts them (::b02 of the Form 8582 block above).
    The overall gain or loss needs the gain on the
    sale, which no K-1 prints: the holding's `gainOnDisposition`. The engine
    does not check it against the Form 8949 row, which is a trade fact with
    the box F decision (no 1099-B reports a private sale). How Cade records a
    sale with no 1099-B is open. A disposition with an overall gain is a Part
    V row with the gain in column (a) (::b02, Example 1).
33. **The special allowance next to a K-1 loss.** Form 8582 line 9 needs
    modified AGI (line 6), which the limit stage, run from the facts, does
    not have. Default: when the return's Part IV rentals have a loss (line 1d)
    and line 3 is a loss, a K-1 with an overall passive loss is unsupported;
    a K-1 with passive income is allowed as usual. Form 8582 itself still
    figures line 9 for the rentals.
34. **K-1 rental real estate and active participation.** A limited partner
    cannot actively participate
    (irs-1065k1-inst-2025::sec::passive-activity-limitations::b16), so the
    rental is a Part V row. Default: any other partner is asked
    (`activelyParticipated`); a yes is unsupported (Part IV and the special
    allowance for a K-1, item 33); a no is Part V. The box 2 exception that
    skips Form 8582 (::box-2-net-rental-real-estate-income-loss::b01, item 1)
    needs active participation, so it never applies here.
35. **What one K-1 activity is.** Each partnership K-1 is one passive
    activity unless box 23 is checked
    (irs-1065k1-inst-2025::sec::passive-activity-limitations::b04). A trade or
    business and a rental are separate activities, and so are rental real
    estate and other rentals. Default: box 23 checked, or passive items of two
    kinds on one K-1, is unsupported. A publicly traded partnership is figured
    apart from Form 8582 (::b10): unsupported. Only box 1, 2 and 3 items can be
    in the activity; another passive item (box 10, 11, 12 or 13) is
    unsupported. A carried passive loss with no passive item this year (a
    former passive activity, or one whose kind is not known) is unsupported.
36. **A basis loss and the passive limit.** The limits apply in order
    (irs-1040se-inst-2025::sec::special-rules-that-limit-losses::b02: "After
    applying the basis rules, the loss ... may be further reduced by the
    at-risk rules and passive activity loss rules"). Default: a basis loss
    carried from an earlier year and allowed now is, for a passive activity,
    this year's loss on Form 8582 (column (b)) and is reported in column (g);
    for a nonpassive one it is the "PYA" row. The at-risk stage passes only
    when the holding says all of the investment is at risk, the share of
    nonrecourse debt included (::other-deductions::b04 of the partner's
    instructions lists what is not at risk); otherwise Form 6198 is
    unsupported, as before.
37. **The carried passive loss and QBI.** A passive loss allowed this year
    after being carried is a QBI loss carryforward (Form 8995 line 3,
    irs-8995-inst-2025::sec::line-3::b01), and its qualified part is not in
    any fact (`carriedQualifiedBusinessLoss` is the basis loss's). Default: a
    K-1 with a statement and an allowed carried passive loss makes its QBI a
    gap. This year's passive loss counts as QBI only as far as Form 8582
    allows it (item 5).
38. **Form 8582 line 6 and K-1 amounts.** Line 6 leaves out passive income
    and loss only. Default: it now adds Schedule E Part II columns (k) less
    (i), every K-1's nonpassive amount, and the losses an entire disposition
    releases (column (g), both rows; `releasedLosses` in `8582/magi.ts`)
    (irs-8582-inst-2025::sec::reporting-an-entire-disposition-on-form-4797-or::b02).
    A trust's Part III column (f) income is still not added. These K-1 parts
    of line 6 stay in the code but are not reached: with a K-1, a line 6 that
    is used is a gap (item 43).
39. **Partnership items with no route.** Box 6c dividend equivalents are not
    reported on Form 1040 (irs-1065k1-inst-2025::sec::box-6c-dividend-equivalents::b01)
    but share a type with other box 20 information, so they stay unrouted.
    Box 7 royalties go on Schedule E line 4 (::box-7-royalties::b01), a Part I
    column the engine fills from rental facts only. Box 14 goes on Schedule SE
    (irs-1040se-inst-2025::sec::domestic-partnerships::b02), which reads
    Schedule C only today. Box 20 codes A and B are Form 4952 amounts. Boxes
    10, 11 (other than code A), 12, 15, 17 and the rest of box 20 stay
    unrouted, each a named gap on Schedule E line 41, as the business-tax
    depth rule asks.
40. **Line 28 rows for separately stated items.** The K-1's ordinary income or
    loss goes on one line; "each related item ... (including items of income
    or loss stated separately on Schedule K-1)" goes "on a separate line
    following" it, with a description in column (a)
    (irs-1040se-inst-2025::sec::line-28::b01). Default: a partnership K-1's
    first line takes the first kind it has of box 1, box 2, box 3 and boxes 4a
    to 4c; each other kind is a line of its own named "<entity>, rental real
    estate", "<entity>, other rental" or "<entity>, guaranteed payments"; the
    PYA row comes last. Columns (e) and (f) are on the first line only. Each
    line counts toward the four rows, and more than four make Part II
    unsupported, as before. The wording of the description is ours: the block
    gives only "depletion" as an example. Form 8582's second column names the
    row of the K-1's passive activity, "Sch E, line 28A"
    (irs-8582-inst-2025::sec::part-vi::b01).
41. **Passive K-1s Form 8582 cannot take.** Part I combines every passive
    activity (irs-8582-inst-2025::sec::specific-instructions::b01). A passive
    or unanswered S corporation K-1, a beneficiary's boxes 6 to 8 (passive in
    Part III column (d), item 16), and a partnership K-1 the limits stop with a
    possibly passive item have no Part V row. Default (`form8582Rows.ts`): such
    a K-1 makes every Form 8582 line past the header a gap that names it, and
    a losing partnership activity next to it unsupported; while its answer is
    missing, Part V and those activities wait on it. With a passive loss or a
    carried passive loss it files Form 8582 by itself. A return with none of
    them is unchanged.
42. **A decrease in liabilities with no loss.** A smaller share of liabilities
    at the end (item K1) is the worksheet's line 9a and can make a line 11b
    gain (irs-1065k1-inst-2025::sec::line-9a::b01, ::line-11b::b01). Default:
    the worksheet runs whenever item K1 shows a decrease at both ends, so a
    gain above basis is the named gap of item 29; a K-1 with neither end, or
    one end only, and no loss or distribution, passes without it.
43. **Rebuild Form 8582 line 6 for a return with a K-1.** Line 6 is modified
    AGI: AGI figured without the listed items
    (irs-8582-inst-2025::sec::line-6::b01; irs-pub-925-2025::sec::rental-activities::b09,
    ::b10). `magi.ts` builds it from AGI's parts instead, which does not yet
    count every K-1 amount. Default for now (`8582/magiGap.ts`): when Part II
    is used (a Part IV rental real estate loss with active participation, and
    a loss on line 3) and the return has any Schedule K-1, line 6, lines 7 to
    9 and 11, Parts VI to VIII, and Schedule E lines 22, 25, 26 and 41 are a
    gap. A return with no K-1, or with no Part IV loss, is unchanged. The
    rebuild: figure line 6 from AGI less the listed exclusions, with three
    target cases: a trust's box 5 income (Part III column (f)) counts; the gain
    on a K-1 interest sold at an overall gain (a passive gain on Form 8582)
    does not count; a sold K-1's nonpassive amounts count once
    (`tests/integration/form8582K1Magi.test.ts` keeps the hand figures).
