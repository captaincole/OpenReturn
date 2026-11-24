# Open questions: Form 6198

Each question has its source, the default the code uses, and whether the default can change a dollar amount.

1. **Who files with a profit on line 5.** Who Must File names an activity "that incurred a loss" (irs-6198-inst-2025::sec::who-must-file::b01). Line 5 says that with a profit "you may not have to complete the rest of this form" and "Also attach Form 6198" (::line-5::b01). Default: a K-1 files when a loss or deduction from the activity reaches the at-risk stage, or a carried at-risk loss exists; a business files only with a loss on line 29 less line 30. With a line 5 profit the form prints Part I only, and every item is allowed. No dollar change: a profit limits nothing.

2. **How the allowed loss is split among items.** "Divide each deduction or loss from the activity by the total loss from the activity on line 5. Then, multiply the total income and gains by this fraction" (::line-5::b02), and "multiplying the loss on line 21 by a fraction ... dividing each item of deduction or loss ... by the total loss from the activity on line 5" (::part-iv-deductible-loss::b02). Read literally, with income on lines 1 to 3 the fractions add up to more than 1. Default: each deduction or loss gets its share of all the deductions and losses, times the income and gains plus the line 21 loss (`allocateLoss`, whole dollars by `prorateDollars`). This matches the ::line-5::b02 example ($3,100 + $600 = $3,700). Changes dollars only when an activity has income items and two or more loss items.

3. **The character of a K-1's carried at-risk loss.** The holding keeps one amount (`carriedLosses.atRisk`). The instructions put a carried box 1 loss on line 1 (::part-i-2::b01) and other carried losses on lines 2a to 4 by kind (::lines-2a-2b-and-2c::b02, ::line-4::b01). Default: the whole carried amount is an ordinary loss on line 1, and once allowed it is a "PYA" row in Schedule E column (i) (irs-1040se-inst-2025::sec::losses-not-allowed-in-prior-years-due-to-the-basis::b01). Changes dollars only when the carried loss was a capital or section 1231 loss.

4. **A sole proprietor's carried loss.** It goes in Schedule C Part V "and identify it as a prior year loss" (::part-i::b01). Default: the business fact's Part V holds it, so line 1 includes it; the form adds nothing. No dollar change.

5. **K-1 items outside the activity.** Portfolio items (interest, dividends, capital gains, investment interest expense) and charitable gifts stay off Part I, as the at-risk stage already treated them (irs-1120sk1-inst-2025::sec::at-risk-limitations::b01; ::box-12-other-deductions::b06). Line 4 names "investment interest expense allowed from Form 4952" from the activity (::line-4::b01); no fact says which part is from the activity. Changes dollars when a K-1 has investment interest expense from the activity.

6. **Guaranteed payments.** No block says whether a partner's guaranteed payments are income from the at-risk activity. Default: a K-1 with them is unsupported at the at-risk stage. No silent dollar change: the line is a gap.

7. **Lines 2a to 2c.** A K-1's section 1231 item goes on line 2b (Form 4797); other gains and losses come from the owner's answers (`dispositions`). The instructions also say "Do not include amounts on lines 2a and 2b that are included on line 2c" (::lines-2a-2b-and-2c::b02); the fact keeps one amount per line, so it cannot double count. A loss on these lines that the limit reduces is unsupported: that loss is on another form the engine does not change. A disposition of the whole K-1 interest is unsupported too (it also brings recapture).

8. **Recapture.** With the amount at risk below zero, earlier losses are recaptured, limited to losses deducted since 1978 less earlier recapture (irs-pub-925-2025::sec::recapture-rule::b01). No fact holds that history. Default: when line 20 is 0 and line 10a or 19a is negative, the consumer line (Schedule C line 31, the K-1's Schedule E row) is unsupported; Form 6198 itself is also unsupported. With a line 5 profit the recapture is not checked (::line-5::b01: "you may have recapture income"). Changes dollars only for a profit year with a negative amount at risk.

9. **Line 15 box with an activity that began after the effective date.** The text says "Enter -0- on line 15" (::part-iii-detailed::b01) and names no box. Default: box a, and boxes 16a and 18a ("since effective date"). No dollar change.

10. **Part III answers that are incomplete next to a complete Part II.** Default: the form waits on the fact, rather than use Part II alone. No dollar change once answered.

11. **Lines with nothing to enter.** Default: lines 7, 9, 12, 14, 16 and 18 are blank when 0; totals print 0 (line 15 prints 0 as "Enter -0-" says). Lines 4 and 21 print as positive amounts: the form prints the parentheses. No dollar change.

12. **The identifying number and the activity description.** Default: the names on the return, and the SSN of the person who owns the activity (the spouse's for a spouse's K-1 or business on a joint return). The description is the owner's (`description`), else the Schedule C line A activity; for a K-1 the partnership's or S corporation's name and EIN follow it (::specific-instructions::b01). No dollar change.

13. **More than one activity on a K-1.** Box 18 (S corporation) or box 22 (partnership) means a statement per activity (irs-1065k1-inst-2025::sec::box-22-more-than-one-activity-for::b01). Default: unsupported. A beneficiary's K-1 (Form 1041) stays unsupported too (passThrough/QUESTIONS.md item 11).

14. **A rental (Schedule E Part I) with amounts not at risk.** Schedule E line 21 should take Form 6198's deductible loss (irs-1040se-inst-2025::sec::line-21::b01). Default: unchanged from before: line 21 stays blank with `allInvestmentAtRisk` false and a loss. Only the K-1 and Schedule C users are connected.

## Confidence

| Field group | Confidence |
| --- | --- |
| Line 21 | published example with numbers (part-iv-deductible-loss::b01) |
| Allowed loss of each item, Schedule C line 31 | published example with numbers (line-5::b02); several items: own reading (item 2) |
| Line 1 with a carried loss | published example with numbers (part-i-2::b01); character: own reading (item 3) |
| Lines 2a to 4, line 5 | stated rule (line-1 to line-5) |
| Lines 6 to 10b | stated rule (part-ii-simplified, line-6 to line-10b) |
| Lines 11 to 19b, boxes 15a to 18b | stated rule (part-iii-detailed, line-11 to line-19b); line 15 box after the effective date: own reading (item 9) |
| Line 20 | stated rule (Form 6198 line 20) |
| Header | stated rule; identifying number: own reading (item 12) |
| Schedule E column (f), PYA row, line 27 | stated rule (special-rules-that-limit-losses::b03, ::b04) |
| Recapture, losses on lines 2a to 2c, guaranteed payments, more than one activity, rentals | unsupported |
