# FTB 3805V: open questions

No published example with numbers exists for this form. The rules come from
`ca-3805v-inst-2025` and the form. Two decisions with conflicting texts are in
`docs/rule-decisions.md` (rows A18 and A19) and in `DECISION` comments:
line 23 (`sectionAReads.ts`) and the suspension with disaster losses
(`figures.ts`).

## Doubts with no conflicting text

1. **Line 4 takes the capital loss carryover.** Source: "Nonbusiness capital
   losses and gains are losses and gains from other than a trade or business"
   (`general-information::b09`). The text does not name the carryover. Default:
   line 4 is Schedule D (540) line 7, the 2025 losses plus the carryover. The
   form's arithmetic needs it: line 18 (Schedule D line 8) includes the
   carryover, and without it line 22 would not add back the capital loss
   deduction the carryover made. Changes dollars only with a carryover.
2. **Which income is nonbusiness (line 9).** Source: "income that is not
   related to a trade or business (such as dividends, pensions, annuities,
   income from an endowment, or interest earned on investments)"
   (`section-a-california-residents::b01`). Default: Schedule CA lines 2, 3, 4,
   5, 6, Section B lines 1 and 2a, and gambling winnings (8b). Unemployment is
   business, as federal Form 172 says. All interest is taken as investment
   interest. Other line 8 income makes line 9 a gap. Changes dollars only for
   income the text does not name (alimony received, gambling, refunds).
3. **Which adjustments are nonbusiness (line 8).** Source: deductions "not
   related to a trade or business and ... not related to your employment"
   (`::b01`). Default: HSA, self-employed retirement plans, early withdrawal
   penalty, alimony paid, IRA, student loan interest, Archer MSA. The text and
   Form 172 do not name the early withdrawal penalty or student loan interest;
   the engine reads them as not connected with a business. Line 24 other
   adjustments make line 8 a gap.
4. **An itemizer equal to the standard deduction.** Default: the return
   itemizes when Schedule CA line 29 is Form 540 line 18. Changes dollars only
   with a casualty loss, which is a gap anyway.
5. **Line 25 when line 3c is zero or more.** Source: "do not complete the rest
   of Part I". Default: line 25 prints 0, as when line 3a is positive. No dollars.
6. **The current year NOL on one row (Part III line 4).** Source: "If you have
   a current year NOL from more than one source/type, list each loss
   separately" (`current-year-nols::b02`). Default: one general (GEN) row. New
   business and eligible small business NOLs of 2025 carry 20 years at 100%,
   as a general NOL does (`nol-carryover::b02`, `::b09`, `::b13`), so the
   amounts do not change. Column (b) is a gap when a K-1 or a farm loss is on
   the return (`part-iii-limitations::b03`).
7. **Part II line 5.** Source: "the adjustments to itemized deductions, used
   to figure your federal NOL carryover" (`part-ii-modified-taxable-income-mti::b02`).
   Default: 0 without itemized deductions or without a capital loss deduction,
   or when no itemized deduction depends on AGI (no medical deduction, no 2%
   floor, AGI under the limitation threshold, gifts at most 20% of AGI). The
   California carryovers do not change federal AGI, on which Schedule CA's
   itemized deductions rest, so only line 2 can change them. Else a gap.
8. **Expired carryovers.** The engine copies column (e) as stated and does not
   track the end of a carryover period. A row before 2008 (before 2011 for a
   disaster loss) is a gap: suspensions extended those periods.
9. **FEIN.** Only an estate or trust has one. The engine prepares individual
   returns, so the line is blank.

## Unsupported

- **Section B (135 fields)**, and every computed line on a Form 540NR return:
  each amount split by California source and by the resident period, by
  transaction dates or by days. The engine does not figure those splits, and
  Part II then reads Schedule CA (540NR) Part IV.
- **Part III line 3 and line 3b**, a 2025 declared disaster loss: see the
  proposal below.

## Proposals for a discussion

- **The 2025 disaster loss (Part III line 3).** Line 3 column (f) is "the
  smaller of the amount in column (d) or the balance in column (g) of the
  previous line" (`current-year-nols::b01`). The balance is the MTI, and the
  MTI's line 1 already subtracts the 2025 disaster loss (it is an itemized
  deduction on Form 540 line 18). Read as written, column (h) would carry the
  whole loss forward even when income absorbed most of it. A fix needs a fact
  for the loss's disaster code and the declared-disaster part of the casualty
  loss, and a decision on the balance line 3 takes (the MTI before the 2025
  loss). That is a new input on Form 4684's fact and a rule with no text.
- **Section B.** Needs the Schedule CA (540NR) column E amounts sorted into
  business and nonbusiness, and the resident and nonresident periods.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, SSN, FEIN blank) | stated rule |
| Section A lines 1 to 3c | stated rule |
| Section A lines 4 to 7, 13, 14 (capital sort) | own reading (items 1, 6) |
| Section A lines 8 to 12 (nonbusiness sort) | own reading (items 2, 3) |
| Section A lines 15 to 22, 24, 25 | stated rule (the form's arithmetic) |
| Section A line 23 | decision A18 |
| Section B | unsupported |
| Part II lines 1 to 4, 6 | stated rule |
| Part II line 5 | own reading (item 7); a gap when a refigure is needed |
| Part III line 1, line 2 columns (a) to (h) | published example with numbers (FTB 3807 Worksheet II, the same columns) and stated rule |
| Part III suspension | stated rule; decision A19 for disaster rows |
| Part III line 3 | unsupported (proposal) |
| Part III line 4 | own reading (item 6) |
| Part III lines 5 and 6 | stated rule |
| Schedule CA lines 9b1 and 9b2 | stated rule |
