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

10. **QBI (needs a person).** Section 1245 and 1250 recapture and a Part II
    gain of a trade or business are ordinary income from it, and "ordinary
    business income or loss is generally included in QBI ... a section 1231 gain
    or loss is only includible in QBI if it isn't capital gain or loss"
    (irs-8995-inst-2025::sec::determining-your-qualified-business::b06). Form
    8995 reads Schedule C line 31, which does not hold them, and no sale fact
    names its business. Default: no Form 4797 amount reaches the QBI forms.
    Changes dollars: yes. Berelain: Form 8995 line 4 is 45,679 and line 15 is
    9,136; with the van recapture (7,500), the QIP recapture (14,400) and the
    laptop gain (900) in QBI, line 4 is at least 68,479 and line 15 at least
    13,696 (under the line 14 limit of 17,746). Open: a sale-to-business link,
    and which part of a netted section 1231 amount (line 12's recaptured loss,
    a net section 1231 loss) counts as ordinary for QBI. The fix changes the
    berelain values.

11. **Net investment income (needs a person).** Form 8960 line 5a takes Form
    1040 line 7a and Schedule 1 line 4. Line 5b takes out "Gain or loss from the
    sale of property held in a non-section 1411 trade or business"
    (irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b01).
    Line 5b stays an unsupported line that the totals read as 0: no sale fact
    names its business, and the text does not say how much of a netted section
    1231 gain (line 9 after line 8) belongs to one property. Example: single,
    W-2 300,000, a Schedule C business with material participation sells
    equipment for 40,000 of section 1245 recapture; line 5d includes the 40,000
    (1,520 of NIIT), and the right line 5b is -40,000. A passive rental's gain
    (the common case) is net investment income, so it is right as it is.
    Changes dollars: yes, when Form 8960 files with a nonpassive business's gain.

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

21. **One Form 1099-S for several sales.** The amount realized is split
    between the properties by fair market value
    (irs-4797-inst-2025::sec::depreciable-property-and-other-property::b01).
    Default: a sale takes box 2 as its price only when it alone names the form;
    when two or more sales name it, each states its own price, or the form is a
    gap. Changes dollars: no (a gap, not a guess).

22. **A loss on an asset of a passive activity.** "If you have an overall loss
    from passive activities and you report a loss on an asset used in a passive
    activity, use Form 8582 ... before entering it on Form 4797"
    (irs-4797-inst-2025::sec::passive-loss-limitations::b01). No fact ties a
    sale to its activity, and Form 8582 reads no Form 4797 amount. Default: a
    loss on line 2 or 10 while Form 8582 files makes lines 7–18b and what they
    send (Schedule 1 line 4, Schedule D lines 11 and 19) a gap; the rows still
    print the whole loss. Without Form 8582 the loss stays. Changes dollars: no
    (a gap); the gap is broader than the rule when the passive activities have
    overall income, or the loss is from a nonpassive business.

23. **California Schedule D (540) with a Form 4797 gain.** Line 10 (federal
    1040 line 7a) holds the section 1231 gain that goes to federal Schedule D
    line 11; line 11 holds only the capital asset sales. A gain that is the same
    on both returns needs no adjustment (ca-540-sched-d1-inst-2025::sec::a-purpose::b01),
    but the instructions name no Schedule D (540) line for California's section
    1231 gain, and the engine has no Schedule D-1. Default: when Schedule D (540)
    files and Form 4797 sends an amount, or a gap, to federal Schedule D line
    11, lines 12a and 12b are a gap. Changes dollars: no (a gap).

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
