# Form 982: open doubts

Form 982 reports a canceled debt that stays out of income, and the tax attributes the exclusion reduces. These are the places where the form and its instructions do not settle a rule. Each says the text, the default the engine applies, and whether it changes dollars. The two real conflicts are decisions in `docs/rule-decisions.md` (rows A44 and A45).

## Doubts

1. **Lines 7, 8, 12 and 13 hold excluded dollars, not the credit reduction.**
   Text: Part II, "Enter amount excluded from gross income" (`irs-982-face-2025::sec::face-part-ii::b01`); a credit carryover is reduced "by 331/3 cents for each dollar excluded" (`irs-982-inst-2025::sec::line-7::b01`); line 2 "won't necessarily equal the total reductions on lines 5 through 13" (`line-2::b01`).
   Default: a line takes up to 3 times the credit. A $1,000 credit puts up to $3,000 on line 7.
   Dollars: yes, if a preparer enters the credit reduction ($1,000) instead.

2. **Line 12 holds the loss and the credit together.**
   Text: "Reduce the loss carryover by one dollar ... the credit carryover by 331/3 cents" (`irs-pub-4681-2025::sec::bankruptcy-and-insolvency::b08`). No order between them.
   Default: one total, the loss plus 3 times the credit. Which carryover is reduced first is not on the form.
   Dollars: no change on the form.

3. **Line 3 is asked only on the "Any other debt" path.**
   Text: the chart for a nonbusiness debt with no attributes but basis lists lines 1a or 1b, 2 and 10a only (`how-to-complete-the-form::b03`).
   Default: line 3 is blank for that chart and for line 1d or 1e alone. Otherwise Yes with the election, No without it.
   Other reading: the line 3 instruction says only "To make the election, check the 'Yes' box" (`line-3::b01`), so a blind preparer left No blank when no election was made. The form face asks "Do you elect ...? Yes No" (`irs-982-face-2025::sec::face-part-i::b01`), so the engine answers the question.
   Dollars: no.

4. **The tax attributes are stated, not read from the forms that carry them.**
   Text: "Reduce your tax attributes after you figure your income tax liability for 2025" (`irs-pub-4681-2025::sec::bankruptcy-and-insolvency::b05`).
   Default: the fact `debt_relief.tax_attributes` holds each attribute after the 2025 tax. Absent amounts are 0.
   Dollars: no, if the stated amounts match the 2025 forms. See the first proposal.

5. **Line 10a uses one property basis for the limit and for the reduction.**
   Text: the limit uses the basis "immediately after the discharge" (`line-10a::b01`); the reduction is of property held at the beginning of 2026 (`irs-pub-4681-2025::sec::bankruptcy-and-insolvency::b07`).
   Default: one stated basis for both. Line 10b comes off the basis line 10a can reduce, not off the limit.
   Dollars: only when the property changed between the two dates.

6. **One Insolvency Worksheet for the return.**
   Text: the worksheet has one "Date debt was canceled" (`irs-pub-4681-2025::sec::insolvency-worksheet::b01`).
   Default: the debts that use insolvency share one amount, in the order of the facts. Insolvent debts with two different dates are unsupported.
   Dollars: no, within the supported case.

7. **Basis reductions are not split among properties.**
   Text: Part II asks for a statement of the section 1017 reductions (`irs-982-face-2025::sec::face-part-ii::b01`); Pub. 4681 gives the order of property categories (`bankruptcy-and-insolvency::b07`).
   Default: the form prints the totals. Two cases need the split and are unsupported: a farm exclusion after a line 10a reduction, and line 1d's second limit after another basis reduction that could fall on real property.
   Dollars: no, within the supported cases.

8. **The line 5 election spans lines 1a to 1c.**
   Text: "If you check any of the boxes on lines 1a through 1c, you can elect, by completing line 5" (`part-ii::b01`).
   Default: the elected amount goes first to the title 11 and insolvency amounts, then to the farm amount.
   Dollars: no change in the total; it moves amounts between Part II lines.

9. **The $750,000 cap is shared among home loans.**
   Text: the cap on "qualified principal residence indebtedness" (`line-1e::b02`).
   Default: each loan's qualified part counts against what is left of the cap, in the order of the facts.
   Dollars: only with more than one loan on the home.
   Related: Pub. 4681 says to include on line 2 the canceled qualified debt "but not more than the amount of the exclusion limit" (`irs-pub-4681-2025::sec::qualified-principal::b06`), which can read as a cap on the amount excluded, not on the loan. Decision A45 reads the cap as a cap on the loan. For a married-filing-separately short sale of $100,000 on a $450,000 loan, that gives line 2 = $25,000 and Schedule 1 line 8c = $75,000; the other reading excludes all $100,000.

10. **California adds back the whole line 1e amount.**
    Text: "the exclusion of income from discharge of indebtedness from the disposition of your principal residence occurring after December 31, 2017. Enter the amount of discharge on line 8c, column C" (`ca-540-sched-ca-inst-2025::sec::line-8-other-income::b01`).
    Default: Schedule CA line 8c column C takes the whole line 1e amount, also for a loan modification with no sale.
    Dollars: yes, for a California resident whose mortgage was reduced without a sale.

11. **The canceled amount and its exceptions are stated.**
    Text: box 2 "may include interest", taxable only if not deductible (`irs-pub-4681-2025::sec::postal-service-or-the-postal-rate::b04`).
    Default: box 2, or the taxpayer's share when stated, less the stated `notIncome`. Box 3 is not taken off by itself.
    Dollars: no, when the answers are right.

12. **Part III stays blank.**
    Text: Part III is the consent of a corporation (`part-iii::b01`).
    Default: blank on every return the engine prints.
    Dollars: no.

13. **A line 5 election above the depreciable basis.**
    Text: "If the amount of canceled debt excluded from income is more than the total basis in depreciable property, you must use the excess to reduce the other tax attributes" (`irs-pub-4681-2025::sec::bankruptcy-and-insolvency::b10`).
    Default: line 5 is the smaller of the elected amount and the depreciable basis; the rest goes on to lines 6 to 13. An $8,000 election with $6,000 of basis puts $6,000 on line 5.
    Dollars: yes, if a preparer enters the whole election on line 5.

14. **Two exclusions on one form share the Part II lines.**
    Text: Pub. 4681 real property Example 2 reduces the NOL by the $10,000 insolvency exclusion and reports the other $4,000 on line 4 of the same form (`irs-pub-4681-2025::sec::qualified-real-property-2::b05`).
    Default: each Part II line adds the reductions of every exclusion. Insolvency $4,000 and farm $3,000 against the NOL put $7,000 on line 6.
    Dollars: yes, on the line, if a preparer reports only one exclusion's reduction.

## Second opinions

- **Blind fill (2026-11-26).** A preparer filled 15 cases by hand from the blank form, the Form 982 instructions and Pub. 4681. Every dollar amount, every line 1 box and Schedule 1 line 8c matched the engine. The only difference is the line 3 "No" box in eight cases, which the preparer left blank (doubt 3); it changes no dollars.
- **PolicyEngine-US 2.154.0** (commit `363e9fc5`). It does not model Form 982. Its `debt_relief` variable is a bare input that it adds to gross income (`parameters/gov/irs/gross_income/sources.yaml`), with no exclusion and no attribute reduction, so it has no constant or formula to compare.
- **IRS Direct File** (`IRS-Public/direct-file`, commit `e365f9f4`). Its 36 tax fact files have no Form 1099-C or Form 982 logic, so there is nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | stated rule |
| Line 1b, line 2 with insolvency | published example with numbers (instructions, Pub. 4681 Examples 1 to 3) |
| Line 1c, line 2 farm limit | published example with numbers (Pub. 4681 farm Examples 1 to 3) |
| Line 1d, line 4 | published example with numbers (Pub. 4681 three examples) |
| Line 1e, line 10b | published example with numbers (Pub. 4681 Example 3, the foreclosure example); the cap is decision A45 |
| Line 1a | stated rule |
| Line 3 | own reading (doubt 3) |
| Line 5 | published example with numbers (Pub. 4681 real property Example 1, Pub. 908 Charlie Jones) |
| Lines 6 and 9 | published example with numbers (Pub. 4681 real property Example 2, Pub. 908) |
| Lines 7, 8, 12, 13 | own reading (doubt 1) |
| Line 10a | published example with numbers (Pub. 4681 car example); the money is decision A44 |
| Lines 11a to 11c | stated rule (`line-1c::b02`) |
| Part III | stated rule (blank) |
| Schedule 1 line 8c | published example with numbers (Pub. 4681 insolvency Examples 2 and 3, Example 3 under the principal residence) |
| Schedule CA line 8c columns A and C | stated rule; column C is doubt 10 |

## Proposals for a discussion

- **Read the carryovers from the engine's own forms.** Form 8801 line 26 is the minimum tax credit at the beginning of 2026. Form 3800 Part IV holds the general business credit carryforward. The Schedule D Capital Loss Carryover Worksheet holds the capital loss. Form 8582 holds the unallowed passive losses. Form 1116 holds the foreign tax credit carryover. Reading them would replace most of `debt_relief.tax_attributes`. It needs those forms to expose their carryovers to 2026 the same way, which is a change to several forms.
- **Route the taxable part of a business debt.** Pub. 4681 sends it to Schedule C line 6, Schedule E line 3, Schedule F line 8 or Form 4835 line 6 (`irs-pub-4681-2025::sec::general-rules::b03`). Today Schedule 1 line 8c is unsupported for it. Each of those forms reads its income from its own fact, so the route is a change to four forms.
- **A section 1017 statement.** The engine prints totals only. A statement that splits each basis reduction among the properties would also settle the two unsupported cases of doubt 7.
- **One Insolvency Worksheet for each date.** A list of worksheets keyed by date would support insolvent cancellations on different dates.
- **Schedule CA (540NR) line 8c.** The nonresident form has the same line; it is not bound.
