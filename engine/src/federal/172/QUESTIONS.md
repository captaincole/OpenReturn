# Form 172: open questions

The 2025 instructions (`irs-172-inst-2025`) have no example with numbers for a
form line. The Part I rules are checked against the Worksheet 1 example of
Pub. 536 (2022), whose worksheet has the same 24 lines, and the column logic
of Part II against its farming loss table (`tests/unit/federal/172/`).

## Two texts conflict

1. **Part II line 3.** The line instruction names the "net long-term capital
   loss"; the caption and the modified taxable income rule name the capital
   loss deduction. Decided: the deduction (row A44 in
   `docs/rule-decisions.md`, `DECISION` in `partII.ts`).

## Doubts with no conflicting text

Each is done with the default below.

1. **Line 1 and Schedule 1-A.** Source: "subtract your standard deduction or
   itemized deductions from your adjusted gross income" (the form, line 1).
   The December 2024 form predates the 2025 Schedule 1-A deductions (Form
   1040 line 13b). Default: line 1 is line 11a less line 12e; line 13b does
   not enter. Changes dollars: with a Schedule 1-A amount the NOL is smaller
   than with it subtracted.
2. **Who files.** Source: "If your deductions for the year are more than your
   income for the year, you may have a net operating loss"
   (`general-instructions::b01`). The resolver cannot see the lines. Default:
   a business loss (Schedule C, F, E or a K-1) or a casualty files the form;
   with line 1 at 0 or more only line 1 prints (Step 2 of `nol-steps::b01`:
   "If you do not have an NOL, stop here"). No dollars. A carryover alone does
   not file the form; Schedule 1 line 8a still deducts it.
3. **The carryover on line 2.** Source: "Nonbusiness capital losses before
   limitation" (the form). Default: the capital loss carryover (Schedule D
   lines 6 and 14) is a nonbusiness capital loss. The form's arithmetic needs
   it: line 16 includes it, and without it line 22 would not add back the
   deduction it made. FTB 3805V reads it the same way. Changes dollars only
   with a carryover.
4. **Lines 2 and 3 from netted Schedule D lines.** A Schedule D line is the
   net of its rows. Default: line 2 adds the lines below 0 and the
   carryovers, line 3 the lines above 0 and line 13. Lines 4 and 5, and so the
   NOL, are the same either way. No dollars.
5. **Business capital gains and losses.** Default: Form 4797's section 1231
   gain on Schedule D line 11 is a business capital gain (Pub. 536 (2022)
   counts a gain on business real estate as one); the Form 461 answer
   `business_loss_limit.business_capital_gain` moves its net gain or loss from
   the sales to line 12 or 11. A gain or loss of another form or a K-1 on
   Schedule D is a gap. Changes dollars only through the sorting.
6. **Line 6 adjustments not named.** Source: the list in
   `line-6-nonbusiness-deductions::b01`. Default: the early withdrawal penalty
   (Schedule 1 line 18) and student loan interest (line 21) are nonbusiness,
   as FTB 3805V reads them. Lines 24a to 24z are a gap. Changes dollars for
   those two only.
7. **State income tax.** Source: "State income tax on income from your trade
   or business (including wages, salary, and unemployment compensation)" is a
   business deduction (`::b02`). The text gives no way to split the tax, or
   the capped Schedule A line 5e, between business and nonbusiness income.
   Default: an itemizer with state income tax on line 5a makes line 6 a gap;
   general sales tax is nonbusiness. Changes dollars on every such return.
8. **Line 7 income not named.** Default: Schedule 1 lines 1, 2a, 8b, 8f and
   8g are nonbusiness; the other line 8 items, Schedule E royalties, estate,
   trust and REMIC income are a gap. Changes dollars for those five lines.
9. **Line 17.** The engine claims no section 1202 exclusion (Form 8949 column
   (g) is not modeled), so line 17 is 0 and lines 16 to 21 are skipped
   without a Schedule D loss. No dollars.
10. **Line 24 when zero or more.** Source: "If the result is zero or more, you
    don't have an NOL". Default: blank. No dollars.
11. **The farming loss.** Source: the NOL "if only income and deductions from
    farming businesses ... were taken into account" (`when-to-use-an-nol::b02`).
    Default: the net Schedule F loss on Schedule 1 line 6, capped by the NOL;
    with a K-1 or a Form 4797 on the return it is a gap. Changes dollars when
    a farm's SE tax deduction or a farm sale would count.
12. **Part II asks before it knows.** The resolver cannot see line 24, so with
    a farm loss it asks the waiver, then both carryback years, even when the
    2023 column would absorb the loss. No dollars.
13. **Line 26, "for any preceding tax year".** Default: the test runs per
    column, and "had items based on AGI" is read as a line 6 amount other
    than 0. The other refigure is a gap; so are gifts other than cash to 60%
    organizations. Changes dollars only in the gap cases.
14. **Lines 19 to 21.** Mortgage insurance premiums count "for tax years
    before 2022"; the carryback years are 2023 and 2024. Default: blank. No
    dollars.
15. **The 80% limit on Schedule 1 line 8a.** Source:
    `how-to-carry-an-nol-back-or-forward::b02`. Default: taxable income before
    the NOL deduction is Form 1040 lines 1z to 7a, Schedule 1 line 10 without
    8a, less the adjustments and line 12e. A return with an item figured from
    AGI (itemized deductions, taxable social security, an IRA or student loan
    deduction, Schedule 1-A, Forms 8582, 8815, 8839) makes line 8a a gap when
    a loss from 2018 on is carried. A loss before 2018 is deducted in full.
    The engine does not check that an old loss has expired. Changes dollars on
    those gap returns only.
16. **The excess business loss worksheet.** Its line 1 reads "the amount from
    Form 172, line 33" (`nol-carryover-with-an-excess-business-loss::b01`);
    the NOL is line 24. The worksheet has no field; the engine does not figure
    the 2026 carryover. No dollars on a 2025 line.

## Proposals for a discussion

- **A form that files only with a loss.** Before: `filesOnlyWithAmountOn`
  keeps a form for an amount above 0, and an own blank field keeps it too, so
  Form 172 cannot leave the return when line 24 shows no NOL. After: the spec
  could name a line that must be below 0 (Form 172 line 24). Form 172 would
  then file only with an NOL.
- **Taxable income before the NOL deduction.** Before: line 8a is a gap for a
  loss from 2018 on when an item depends on AGI. After: the engine would
  evaluate the return a second time without line 8a and read taxable income
  from that pass. This changes how forms are evaluated.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Header (name, SSN, address, phone, calendar year) | stated rule |
| Header fiscal year and foreign address (5) | unsupported: no fact |
| Part I lines 1, 4, 5, 8–10, 13–15, 18–24 | published example with numbers (Pub. 536 (2022)) |
| Part I lines 2, 3, 6, 7, 11, 12 (the sorting) | own reading of the named lists; gaps where unnamed |
| Part I lines 16, 17 | stated rule |
| Part II lines 1, 9, 10 | published example with numbers (Pub. 536 (2022) table) |
| Part II lines 2–6, 11, 14, 15, 23, 25, 28, 29 (stated amounts) | stated rule |
| Part II lines 7, 12, 13, 16–18, 22, 24, 27, 30–33 | stated rule (the form's arithmetic) |
| Part II line 26 | stated rule, 60% cash limit only; other gifts a gap |
| Part II lines 8, 19–21 | stated rule (blank for an individual, 2023 and 2024) |
| Schedule 1 line 8a | stated rule; gap with an AGI item and a loss from 2018 on |
