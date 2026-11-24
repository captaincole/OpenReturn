# Form 4797: doubts and defaults

Each item says where the form and its instructions do not settle a rule, the
default the engine applies, and whether the default can change a dollar amount.

1. **Section 1252 percentage: Pub. 225's example is one year off.**
   Source: "80% if the farmland was disposed of within the 6th year after it was
   acquired ... 20% if disposed of within the 9th year"
   (irs-4797-inst-2025::sec::line-27::b01). Pub. 225: land acquired January 19,
   2017, sold October 5, 2025, "40% because you sold the land within the eighth
   year" (irs-pub-225-2025::sec::other-gains::b02). By the 4797 count, that sale
   is in the 9th year (20%).
   Default: the 4797 instructions' count, from the day after acquisition
   (part-i::b01). The unit test checks the example's arithmetic one year earlier.
   Changes dollars: yes (20% or 40% of the expenses).

2. **Line 26c below zero.** Source: "Subtract line 26a from line 24. If ... line
   24 isn't more than line 26a, skip lines 26d and 26e" (the form, line 26c).
   Default: line 26c prints at least 0. Changes dollars: no (26d and 26e are skipped then).

3. **Line 26d and an after-1975 excess of straight line.** Source: "If straight
   line depreciation exceeds the actual depreciation for the period after 1975,
   reduce line 26d by the excess" (line-26d::b01).
   Default: the fact holds line 26d already reduced. Changes dollars: no.

4. **Part IV with more than one property in a column.** Source: "figure the
   recapture amounts separately for each property. Show these calculations on a
   separate statement" (part-iv::b01).
   Default: lines 33 and 34 print the column totals; line 35 adds each property's
   recapture, at least 0. Changes dollars: only when one property's line 34 is
   more than its line 33.

5. **Part IV line 35: where it goes.** Source: "enter the recapture amount as
   'other income' on the same form or schedule on which you took the deduction"
   (line-35::b01). Default: the engine carries it to Schedule C line 6 of the
   business the fact names. Any other schedule (E, F, Form 2106) makes that
   column's line 35 a gap. Changes dollars: no (a gap, not a guess).

6. **Lines 1b and 1c.** Source: line 1b is the gain "on lines 2, 10, and 24",
   line 1c the loss "on lines 2 and 10" (line-1b::b01, line-1c::b01).
   Default: 1b adds partial dispositions' gains from Part I, Part II and Part III
   line 24; 1c adds their losses from Parts I and II, as a positive amount.
   Changes dollars: no (information lines).

7. **Line 11 when line 7 is exactly 0.** Source: "If line 7 is zero or a loss,
   enter the amount from line 7 on line 11." Default: line 11 is blank at 0.
   Changes dollars: no.

8. **Lines 3, 14 and 18a (Form 4684), 4 and 15 (Form 6252), 5 and 16 (Form
   8824).** Form 4684 Section B and Forms 6252 and 8824 have no rules. Default:
   the lines are unsupported; lines 7–18b and the lines they feed are a gap when
   Form 6252 or 8824 files by decision. Changes dollars: no (a gap).

9. **A K-1 section 1231 item** (1065 box 10, 1120-S box 9; line-7::b01). The
   pass-through layers have no route for it. Default: lines 7–18b and Schedule D
   line 11 and Schedule 1 line 4 are a gap. Changes dollars: no (a gap).

10. **QBI.** Section 1245 and 1250 recapture of a trade or business is ordinary
    income from it; Form 8995 reads Schedule C line 31, which does not hold it.
    Default: no Form 4797 amount reaches the QBI forms. Changes dollars: yes
    (the QBI deduction). Section 1231 gains stay out, as they should.

11. **Net investment income.** Form 8960 line 5a takes Form 1040 line 7a and
    Schedule 1 line 4. A gain on property of a nonpassive trade or business
    belongs on line 5b, which is unsupported. Default: unchanged. Changes
    dollars: yes, when Form 8960 files with such a gain.

12. **The Unrecaptured Section 1250 Gain Worksheet.** Lines 4, 10 and 12 have no
    fact (installment sales, a partnership interest, section 1250 property not in
    Part I): 0. Line 5 or 11 from a K-1, or line 14 (a 28% rate gain: a K-1 or
    Form 1099-DIV box 2d), makes Schedule D line 19 a gap. Line 11 takes Form
    1099-DIV box 2b. Without Form 4797 the worksheet is not figured (as before).
    Changes dollars: no for the figured cases.

13. **The Schedule D Tax Worksheet** replaces the QDCG worksheet on Form 1040
    line 16 only when Schedule D line 19 has an amount. Schedule D line 18 is
    unsupported, so it counts as 0 there. Form 6251 Part III (lines 13, 15, 20,
    27) is a gap then: its AMT worksheets need the AMT basis (line 2k). Changes
    dollars: no for the figured cases.

14. **The EIC.** A Form 4797 filer uses Pub. 596 Worksheet 1, whose Form 4797
    lines are not modeled: the EIC is a gap. Changes dollars: no (a gap).

15. **Facts stated, not checked.** The split of a price between land and
    building (by fair market value, depreciable-property-and-other-property::b01),
    the depreciation "allowed or allowable", and the additional depreciation are
    the taxpayer's statements. Changes dollars: yes, if a statement is wrong.

16. **Owner on a joint or separate return.** A sale fact names no owner; every
    sale is the return's. Changes dollars: on a separate return with a spouse's sale.

17. **More than four rows in a part.** The paper has four; the engine prints one
    form and no statement: those rows are a gap, and the totals still add every
    property. Changes dollars: no.

18. **Not modeled (no fact):** a section 121 exclusion on a home used for
    business, a QOF deferral, a mark-to-market trader's line 10 and 1099-B
    proceeds on line 1a, section 1244 stock, depreciable property held for
    investment (Form 8949), a casualty or theft portion of line 32 (Form 4684
    line 33), an installment sale's Part III.

19. **An abandoned or retired portion of a MACRS asset (an old roof).** The
    chart puts depreciable real property "Sold or exchanged at a loss" in Part I
    (where-to-make-first-entry-for-certain-items::b01). A retirement with no
    proceeds is not a sale or exchange: "Deduct the loss from a qualifying
    abandonment of business or investment property on line 10" (line-10::b01),
    and "A loss from an abandonment of business or investment property that is
    not treated as a sale or exchange is generally an ordinary loss"
    (irs-pub-544-2025::sec::partial-dispositions-of-macrs::b02). Default: the
    sale fact's `abandoned` puts the property on line 10; a gain on an
    abandonment is a gap. Without the answer, a $0 sale at a loss stays in
    Part I. Changes dollars: yes, in later years (a Part I loss is a
    nonrecaptured section 1231 loss on a later line 8), and this year when
    Part I also has a gain.

20. **Low-income housing: when the month count starts.** Pub. 544 counts "each
    full month the property was held over 100 full months"
    (irs-pub-544-2025::sec::applicable-percentage::b02). Default: the holding
    period starts the day after acquisition (part-i::b01). Changes dollars:
    1% of line 26b's base when a sale falls on a month boundary.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | stated rule |
| Lines 1a–1c | stated rule |
| Line 2 and line 10 rows | stated rule |
| Lines 3, 4, 5, 14, 15, 16, 18a | unsupported (Forms 4684 Section B, 6252, 8824) |
| Lines 6–9, 11–12 | published example with numbers (4797 line 8, Pub. 544) |
| Lines 13, 17, 18b | stated rule |
| Lines 19–24 | published example with numbers (Pub. 544 truck) |
| Line 25 (section 1245) | published example with numbers (Pub. 544 truck) |
| Line 26 (section 1250) | stated rule; 26b low-income percentage from Pub. 544's examples with numbers; 26c floor own reading |
| Line 26f | stated rule (corporations only: blank) |
| Line 27 (section 1252) | published example with numbers (Pub. 225), year count own reading (item 1) |
| Line 28 (section 1254) | stated rule |
| Line 29 (section 1255) | stated rule |
| Lines 30–32 | stated rule |
| Lines 33–35 | published examples with numbers (Pub. 946); several properties own reading (item 4) |

## Second opinions

- **Blind fill** (15 cases from the blank form and instructions only): every
  line matched but one. The retired roof (case 14) went to line 10; the engine
  put it in Part I. The text sides with line 10 (item 19), and the engine now
  takes the `abandoned` answer.
- **PolicyEngine-US 2.153.8** (commit b3edc0446b): it does not model Form 4797.
  Its Form 4797 gain (`other_net_gain`) and the unrecaptured section 1250 gain
  before losses are inputs, so Parts I to IV have nothing to compare. Its
  Unrecaptured Section 1250 Gain Worksheet lines 13–18 (the losses of lines
  14–16 netted, line 18 at least 0) match `worksheets/unrecapturedSection1250.ts`.
  Its Schedule D Tax Worksheet line 19 amounts (the top of the 24% bracket,
  2025: 197,300; 394,600 joint and surviving spouse) and the 25% rate on
  unrecaptured section 1250 gain match `worksheets/scheduleDTax.ts`. No
  disagreement.
- **IRS Direct File:** the repo names no checkout, and Direct File does not
  support Form 4797. Not compared.
