# Open questions: pass-through K-1s

Each question has its source and the default the code uses now.

1. **Trust K-1 codes the instructions do not describe.** The beneficiary's
   instructions say the codes "are identified on page 2 of Schedule K-1"
   (irs-1041k1-inst-2025::sec::part-iii-beneficiary-s-share-of-current-year::b01),
   and that page is not in the corpus. Box 13 codes F, G, I, K, M, N, P, Q and
   box 14 codes A, B, E, G have no text. Default: they map to `not_modeled`.
   The trust step (Form 1116, Schedule B) needs box 14 codes A and B, so it
   should add the blank K-1 (Form 1041) to `sources/` and the corpus first.
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
   for a loss, a distribution, a sale of stock or a loan repayment
   (irs-1040se-inst-2025::sec::line-28::b03); column (f) for amounts not at risk
   in an activity with a loss (::special-rules-that-limit-losses::b03). Default:
   a routed K-1 has none of these, so both print unchecked.
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
