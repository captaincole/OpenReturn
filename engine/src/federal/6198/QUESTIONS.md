# Open questions: Form 6198

Each question has its source, the default the code uses, and whether the default can change a dollar amount.

1. **Who files with a profit on line 5.** Who Must File names an activity "that incurred a loss" (irs-6198-inst-2025::sec::who-must-file::b01). Line 5 says that with a profit "you may not have to complete the rest of this form" and "Also attach Form 6198" (::line-5::b01). Default: a K-1 files when a loss or deduction from the activity reaches the at-risk stage, or a carried at-risk loss exists; a business files only with a loss on line 29 less line 30. With a line 5 profit the form prints Part I only, and every item is allowed, unless the amount at risk may be below zero (item 8). No dollar change: a profit limits nothing.

2. **How the allowed loss is split among items.** "Divide each deduction or loss from the activity by the total loss from the activity on line 5. Then, multiply the total income and gains by this fraction" (::line-5::b02), and "multiplying the loss on line 21 by a fraction ... dividing each item of deduction or loss ... by the total loss from the activity on line 5" (::part-iv-deductible-loss::b02). Read literally, with income on lines 1 to 3 the fractions add up to more than 1. Default: each deduction or loss gets its share of all the deductions and losses, times the income and gains plus the line 21 loss (`allocateLoss`, whole dollars by `prorateDollars`). This matches the ::line-5::b02 example ($3,100 + $600 = $3,700). Changes dollars only when an activity has income items and two or more loss items.

3. **The character of a K-1's carried at-risk loss.** Settled: the holding keeps it by item (`carriedLosses.atRisk`, the same item names as `carriedLosses.basis`). "These losses and deductions must be included in the current year amounts you enter in Part I" (::part-i::b01), a box 1 loss on line 1 (::part-i-2::b01), and "The remaining portion of each deduction or loss item ... must be carried over to next year" (::part-iv-deductible-loss::b02). Each carried item goes on the Part I line of its kind (`partILineOf`), and once allowed it reaches the line of its kind; an ordinary loss is a "PYA" row in Schedule E column (i) (irs-1040se-inst-2025::sec::losses-not-allowed-in-prior-years-due-to-the-basis::b01). A carried item with no Part I line here (a capital loss, a gift, foreign taxes) is a gap. A holding that still gives one number is malformed and is asked again.

4. **A sole proprietor's carried loss.** It goes in Schedule C Part V "and identify it as a prior year loss" (::part-i::b01). Default: the business fact's Part V holds it, so line 1 includes it; the form adds nothing. No dollar change.

5. **K-1 items outside the activity.** Portfolio items (interest, dividends, capital gains) and charitable gifts stay off Part I, as the at-risk stage already treated them (irs-1120sk1-inst-2025::sec::at-risk-limitations::b01; ::box-12-other-deductions::b06). Investment interest expense is different: "If you have investment interest expense from your at-risk activity, first complete Form 4952 ... enter that amount on line 4 of Form 6198. You must reduce the allowable investment interest deduction on Form 4952 by the amount you carry to Form 6198" (::line-4::b01), and line 1 names it among the amounts for lines 2a to 4 (::line-1::b01). No fact says which part of a K-1's investment interest is from the activity, and Form 4952 does not take a K-1's. Default: a K-1 on Form 6198 with investment interest expense (this year's or carried) is a gap, not a Part I without it. A K-1's investment interest has no route either, so its Schedule E row was already a gap.

6. **Guaranteed payments.** No block says whether a partner's guaranteed payments are income from the at-risk activity. Default: a K-1 with them is unsupported at the at-risk stage. No silent dollar change: the line is a gap.

7. **Lines 2a to 2c.** A K-1's section 1231 item goes on line 2b (Form 4797); other gains and losses come from the owner's answers (`dispositions`). The instructions also say "Do not include amounts on lines 2a and 2b that are included on line 2c" (::lines-2a-2b-and-2c::b02); the fact keeps one amount per line, so it cannot double count. A loss on these lines that the limit reduces is unsupported: that loss is on another form the engine does not change. A disposition of the whole K-1 interest is unsupported too (it also brings recapture).

8. **Recapture.** With the amount at risk below zero at the end of the year, the owner adds to income from the activity "the lesser of ... The negative at-risk amount (treated as a positive amount); or The total amount of losses deducted in previous tax years beginning after 1978, minus any amounts you previously added to your income from that activity under this recapture rule", and treats it "as a deduction for the activity in the next tax year" (irs-pub-925-2025::sec::recapture-rule::b01). "Even if you have a current year profit on line 5, you may have recapture income if you received a distribution or had a transaction during the year that reduced your amount at risk in the activity to less than zero" (irs-6198-inst-2025::sec::line-5::b01). Not built: no fact holds the losses deducted since 1978, no text in the corpus names the line the income goes on (Schedule C or Schedule E), and in a profit year lines 10a and 19a leave out this year's income ("Do not include the current year income", ::line-7::b01, ::line-16::b03), so they do not give the year-end amount. Default: the activity is unsupported, naming recapture, when line 10a or 19a is negative and line 20 is 0 with a loss, or when line 10a or 19a is negative with a profit (`profitYearRecapture`). A K-1 that shows a decrease (a distribution, or a smaller share of recourse debt and qualified nonrecourse financing on item K) and has a profit waits on its at-risk fact. A business has no fact for owner withdrawals, so a profit year is checked only when the owner gave the amounts at risk; a rental has no amounts at risk at all (item 14).

9. **Line 15 box with an activity that began after the effective date.** The text says "Enter -0- on line 15" (::part-iii-detailed::b01) and names no box. Default: box a, and boxes 16a and 18a ("since effective date"). No dollar change.

10. **Part III answers that are incomplete next to a complete Part II.** Default: the form waits on the fact, rather than use Part II alone. No dollar change once answered.

11. **Lines with nothing to enter.** Default: lines 7, 9, 12, 14, 16 and 18 are blank when 0; totals print 0 (line 15 prints 0 as "Enter -0-" says). Lines 4 and 21 print as positive amounts inside the parentheses the form prints ("( 28,000 )" on the rendered page). Lines 1, 2a to 2c and 5 have no parentheses, so a loss there prints with a minus sign. No dollar change.

12. **The identifying number and the activity description.** Default: the names on the return, and the SSN of the person who owns the activity (the spouse's for a spouse's K-1 or business on a joint return). The description is the owner's (`description`), else the Schedule C line A activity; for a K-1 the partnership's or S corporation's name and EIN follow it (::specific-instructions::b01). No dollar change.

13. **More than one activity on a K-1.** Box 18 (S corporation) or box 22 (partnership) means a statement per activity (irs-1065k1-inst-2025::sec::box-22-more-than-one-activity-for::b01). Default: unsupported. A beneficiary's K-1 (Form 1041) stays unsupported too (passThrough/QUESTIONS.md item 11).

14. **A rental (Schedule E Part I) with amounts not at risk.** "If you have amounts for which you are not at risk, use Form 6198 to determine the amount of your deductible loss. Enter that amount in the appropriate column of Schedule E, line 21" (irs-1040se-inst-2025::sec::line-21::b01, ::b02). Before this pass line 21 was blank with no reason and nothing asked, so the return stopped with no warning. Default now: line 21 is unsupported with the reason (`rentalAtRiskGap`, `rentalLine21Gap`; FTB 3801 reads the same gap). Not connected to this form: the rental fact has no amounts at risk and no carried at-risk loss, and Form 8582 would then take the loss Form 6198 allows (the at-risk limit comes first, irs-pub-925-2025::sec::at-risk-limits::b01), which reaches Form 8582's rows and the K-1 passive stage too.

15. **Last year's line 21 loss when line 15 is last year's line 19b (box b).** Line 19b comes before line 21 on the same form, so last year's 19b does not net last year's deducted loss. The text says "Your prior tax year line 21 deductible loss reduces your at-risk investment as of the beginning of your current tax year" (::line-14-2::b01), but line 18 with box b takes decreases "that occurred since the end of your prior tax year" (::line-18::b01). Default: the owner includes last year's line 21 in line 18 (`decreasesSince`, facts/kinds/atRisk.ts). The blind fill read it the other way: nothing more on line 18. Changes dollars when last year's line 21 was above 0 (the blind case had 0).

16. **Cents on lines 6 and 7 (and 11, 12, 16).** "Include cents when adding the amounts and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01). Default: each entered line rounds on its own, and lines 8, 13 and 17 add the rounded lines (the engine's rule for lines defined as arithmetic on other lines). Changes a total by $1 only when two lines both carry 50 cents or more, or both under.

17. **A description too long for its box.** "After the description of the activity, if applicable, enter the name and identifying number of the partnership or S corporation" (::specific-instructions::b01). The widget is one line and the renderer writes text at the widget's own font size, so a long description and a long entity name run past the box and the EIN is cut off on the page (checked with an 80-character S corporation name). Default: the whole text, as the instructions order it. No dollar change.

18. **Who records the amounts at risk.** The form waits on the K-1's at-risk fact (`at_risk.<K-1 fact key>`) or the business fact's `atRisk`, but no Cade tool writes either yet, so a return with amounts not at risk cannot finish through Cade. No dollar change.

## Second opinions

- **PolicyEngine-US 2.153.8** (commit b3edc044, 2026-11-23): no at-risk model. It has no variable or parameter for section 465 or Form 6198; business losses go only through the section 461(l) limit (`limited_business_loss`). Nothing to compare.
- **IRS Direct File** (commit e365f9f4, 2026-06-11): its fact dictionary (`backend/src/main/resources/tax/`) has no Schedule C, Schedule K-1 or Form 6198 module. Nothing to compare.
- **Blind fill** (15 cases, 2026-11-24): every dollar amount matches. One line differs only as blank against 0: case 15 line 7, where $0.49 of increases rounds to 0; the engine leaves it blank (item 11).

## Confidence

| Field group | Confidence |
| --- | --- |
| Line 21 | published example with numbers (part-iv-deductible-loss::b01) |
| Allowed loss of each item, Schedule C line 31 | published example with numbers (line-5::b02); several items: own reading (item 2) |
| Line 1 with a carried loss | published example with numbers (part-i-2::b01); other carried items by kind: stated rule (item 3) |
| Lines 2a to 4, line 5 | stated rule (line-1 to line-5) |
| Lines 6 to 10b | stated rule (part-ii-simplified, line-6 to line-10b) |
| Lines 11 to 19b, boxes 15a to 18b | stated rule (part-iii-detailed, line-11 to line-19b); line 15 box after the effective date: own reading (item 9) |
| Line 20 | stated rule (Form 6198 line 20) |
| Header | stated rule; identifying number: own reading (item 12) |
| Schedule E column (f), PYA row, line 27 | stated rule (special-rules-that-limit-losses::b03, ::b04) |
| Recapture (loss and profit years), losses on lines 2a to 2c, guaranteed payments, investment interest expense, more than one activity, rentals | unsupported |
