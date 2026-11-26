# FTB 3805V: open questions

No published example with numbers exists for this form. The rules come from
`ca-3805v-inst-2025` and the form.

## Two texts conflict

Both are decided, in `docs/rule-decisions.md` and in `DECISION` comments.

1. **Line 23, the carryovers added back (row A18).** The line instruction
   names the whole carryover from the 2024 form; the form's arithmetic and the
   federal Form 172 method add back the deductions taken in 2025. The engine
   adds back the deductions taken (`sectionAReads.ts`).
2. **The suspension with a disaster loss carryover (row A19).** One sentence
   frees every NOL of a taxpayer with a disaster carryover; the disaster rule
   frees only the disaster loss. The engine deducts the disaster row and not
   the others (`figures.ts`).

## Should we do this now

Each item is a doubt with no conflicting text. Each is done with the default
below, or the sentence says why not now.

1. **Line 4 takes the capital loss carryover.** Done. Source: "Nonbusiness
   capital losses and gains are losses and gains from other than a trade or
   business" (`general-information::b09`). The text does not name the
   carryover. Default: line 4 is Schedule D (540) line 7, the 2025 losses plus
   the carryover. The form's arithmetic needs it: line 18 (Schedule D line 8)
   includes the carryover, and without it line 22 would not add back the
   capital loss deduction the carryover made. Changes dollars only with a
   carryover.
2. **Which income is nonbusiness (line 9).** Done. Source: "income that is not
   related to a trade or business (such as dividends, pensions, annuities,
   income from an endowment, or interest earned on investments)"
   (`section-a-california-residents::b01`). Default: Schedule CA lines 2, 3, 4,
   5, 6, Section B lines 1 and 2a, and gambling winnings (8b). Unemployment is
   business, as federal Form 172 says. All interest is taken as investment
   interest. Other line 8 income makes line 9 a gap. Changes dollars only for
   income the text does not name (alimony received, gambling, refunds).
3. **Which adjustments are nonbusiness (line 8).** Done. Source: deductions
   "not related to a trade or business and ... not related to your
   employment" (`::b01`). Default: HSA, self-employed retirement plans, early
   withdrawal penalty, alimony paid, IRA, student loan interest, Archer MSA.
   The text and Form 172 do not name the early withdrawal penalty or student
   loan interest; the engine reads them as not connected with a business.
   Line 24 other adjustments make line 8 a gap.
4. **An itemizer equal to the standard deduction.** Done. Default: the return
   itemizes when Schedule CA line 29 is Form 540 line 18. Changes dollars only
   with a casualty loss, which is a gap anyway when line 3a is negative.
5. **Line 25 when line 3c is zero or more.** Done. Source: "do not complete
   the rest of Part I". Default: line 25 prints 0, as when line 3a is
   positive. No dollars.
6. **The current year NOL on one row (Part III line 4).** Done. Source: "If
   you have a current year NOL from more than one source/type, list each loss
   separately" (`current-year-nols::b02`). Default: one general (GEN) row. New
   business and eligible small business NOLs of 2025 carry 20 years at 100%,
   as a general NOL does (`nol-carryover::b02`, `::b09`, `::b13`), so the
   amounts do not change. Column (b) is a gap when a K-1 or a farm loss is on
   the return (`part-iii-limitations::b03`).
7. **Part II line 5.** Done. Source: "the adjustments to itemized deductions,
   used to figure your federal NOL carryover"
   (`part-ii-modified-taxable-income-mti::b02`). Default: 0 without itemized
   deductions or without a capital loss deduction, or when no itemized
   deduction depends on AGI (no medical deduction, no 2% floor, AGI under the
   limitation threshold, gifts at most 20% of AGI). The California carryovers
   do not change federal AGI, on which Schedule CA's itemized deductions rest,
   so only line 2 can change them. Else a gap.
8. **Expired carryovers.** Done. The engine copies column (e) as stated and
   does not track the end of a carryover period. A row before 2008 (before
   2011 for a disaster loss) is a gap: suspensions extended those periods.
9. **FEIN.** Done. Only an estate or trust has one. The engine prepares
   individual returns, so the line is blank.
10. **Order of use (Part III line 2).** Done. Source: "use your NOLs and
    disaster losses in the order the losses were incurred. There is no
    requirement to deduct NOL carryovers before disaster loss carryovers"
    (`part-iii-limitations::b01`), and column (a) "earliest first" (`::b02`).
    Default: the rows go by year of loss, whatever the type; two rows of one
    year keep the order the facts list them. Changes dollars: a 2016 general
    NOL and a 2019 disaster loss against $15,000 of MTI deduct $15,000 of the
    NOL and nothing of the disaster loss.
11. **Part II adds back the capital loss deduction.** Done. Source: Part II
    line 2, "the net capital loss deduction from your 2025 Schedule D (540),
    line 9" (`part-ii-modified-taxable-income-mti::b02`). Default: the form's
    arithmetic, so the carryovers can absorb up to $3,000 more than taxable
    income before them. Changes dollars against a reading that stops at
    taxable income of 0.
12. **Line 3a of exactly 0.** Done. Line 3a says "If positive, enter 0 here
    and on line 25"; line 3c says "If zero or more, do not complete the rest
    of Part I" (`ca-3805v-face-2025::sec::face-part-i::b01`). Default: 0 on
    line 3a and line 25, as a positive amount. No dollars: there is no 2025
    NOL.
13. **A casualty loss with line 3a at 0 or more.** Done (2026-11-25). Line 3a:
    "If positive, enter 0 here and on line 25. Do not complete the rest of
    Section A" (`face-part-i::b01`). Line 3b is not figured, and income
    absorbed the loss, so Part III line 3 is blank and line 6 adds only the
    prior disaster rows. Before, any itemized casualty loss made Part III line
    3 and line 6 a gap and kept the form on the return.
14. **More than four prior year carryovers.** Not now: Part III line 2 has
    four rows and the instructions name no attached statement, and a second
    copy of the form would repeat Parts I and II. The deductions still use
    every row; the fourth row prints the gap.
15. **Section B (135 fields), and every computed line on a Form 540NR
    return.** Not now: each amount needs a split by California source and by
    the resident period, and Part II then reads Schedule CA (540NR) Part IV.
    See the proposal below.
16. **Part III line 3 and line 3b with line 3a negative.** Not now: it needs a
    new input and a rule with no text. See the proposal below.

## Pattern change

### Proposals for a discussion

- **The 2025 disaster loss (Part III line 3).** Before: a casualty loss in
  the itemized deductions with line 3a negative makes line 3b and Part III
  line 3 a gap. After: Form 4684's fact would carry the disaster code and the
  declared-disaster part of the loss, and line 3 column (f) would take the
  MTI before the 2025 loss as its balance. Line 3 column (f) is "the smaller
  of the amount in column (d) or the balance in column (g) of the previous
  line" (`current-year-nols::b01`); the MTI's line 1 already subtracts the
  2025 loss, so read as written column (h) would carry the whole loss even
  when income absorbed most of it.
- **Section B.** Before: every line on a Form 540NR return is a gap. After:
  the Schedule CA (540NR) column E amounts would be sorted into business and
  nonbusiness, with the resident and nonresident periods as inputs.

## Second opinions

- No published example with numbers.
- Blind fill (2026-11-25, 13 cases from the blank form and the
  instructions): every dollar amount matched. The nine differences are a
  blank against 0. The engine prints 0 on Part III line 5 or line 6 when no
  row of that kind exists, and 0 on line 23 when no carryover exists; the
  blind fill left them blank. No dollars change. The blind doubts that change
  dollars are decisions A18 and A19 and items 10 and 11.
- PolicyEngine-US 2.154.0 (commit 363e9fc5): it does not model FTB 3805V or
  a California NOL or disaster loss carryover. It has no federal NOL
  deduction either, so it has no constant or formula to compare. No lead.
- IRS Direct File: it prepares no California return and no NOL, so it has
  nothing to compare.

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
| Part III line 3 | blank with line 3a at 0 or more (item 13); else unsupported (proposal) |
| Part III line 4 | own reading (item 6) |
| Part III lines 5 and 6 | stated rule |
| Schedule CA lines 9b1 and 9b2 | stated rule |
