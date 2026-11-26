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
2. **The 80% limit in a carryback year.** "The 80% limitation rule does not
   apply to a carryback period before 2021" (`when-to-use-an-nol::b01`)
   implies a limit on a farming loss carried back to 2023 or 2024; the line 10
   caution names only NOLs "carried forward to a year after 2020", and Part II
   has no line for a limit. Decided: no limit, line 10 is line 1 less line 9
   (row A45, `DECISION` in `partII.ts`). Raised by the blind fill. Changes
   dollars: a $25,000 farming loss against $9,000 of 2023 modified taxable
   income leaves $16,000; with the limit it would leave $17,800.

## Should we do this now

Each is a doubt with no conflicting text. The default is in place; the last
sentence of each item says "Done", or why the rest waits.

1. **Line 1 and Schedule 1-A.** Source: "subtract your standard deduction or
   itemized deductions from your adjusted gross income" (the form, line 1).
   The December 2024 form predates the 2025 Schedule 1-A deductions (Form
   1040 line 13b). Default: line 1 is line 11a less line 12e; line 13b does
   not enter. Changes dollars: with a Schedule 1-A amount the NOL is smaller
   than with it subtracted. Done: the form follows its own line 1 text.
2. **Who files.** Source: "If your deductions for the year are more than your
   income for the year, you may have a net operating loss"
   (`general-instructions::b01`). The resolver cannot see the lines. Default:
   a business loss (Schedule C, F, E or a K-1) or a casualty files the form;
   with line 1 at 0 or more only line 1 prints (Step 2 of `nol-steps::b01`:
   "If you do not have an NOL, stop here"). No dollars. A carryover alone does
   not file the form; Schedule 1 line 8a still deducts it. The tax review
   found that 18 committed scenarios now attach a Form 172 with only line 1
   (tcb-us-005: line 1 $410,465), and only galina has an NOL. Not now: taking
   the form off needs a "below 0" rule in `filesOnlyWithAmountOn` (Pattern
   change, below), and no tax amount changes.
3. **The carryover on line 2.** Source: "Nonbusiness capital losses before
   limitation" (the form). Default: the capital loss carryover (Schedule D
   lines 6 and 14) is a nonbusiness capital loss. The form's arithmetic needs
   it: line 16 includes it, and without it line 22 would not add back the
   deduction it made. FTB 3805V reads it the same way. Changes dollars only
   with a carryover. Done.
4. **Lines 2 and 3 from netted Schedule D lines.** A Schedule D line is the
   net of its rows. Default: line 2 adds the lines below 0 and the
   carryovers, line 3 the lines above 0 and line 13. Lines 4 and 5, and so the
   NOL, are the same either way. No dollars. Done.
5. **Business capital gains and losses.** Default: Form 4797's section 1231
   gain on Schedule D line 11 is a business capital gain (Pub. 536 (2022)
   counts a gain on business real estate as one); the Form 461 answer
   `business_loss_limit.business_capital_gain` moves its net gain or loss from
   the sales to line 12 or 11. A gain or loss of another form or a K-1 on
   Schedule D is a gap. Changes dollars only through the sorting. Not now
   for the gap: no committed scenario has another form's or a K-1's gain on
   Schedule D with an NOL.
6. **Line 6 adjustments not named.** Source: the list in
   `line-6-nonbusiness-deductions::b01`. Default: the early withdrawal penalty
   (Schedule 1 line 18) and student loan interest (line 21) are nonbusiness,
   as FTB 3805V reads them. Lines 24a to 24z are a gap. Changes dollars for
   those two only. Not now for the gap: each line 24 item needs its own
   reading, and no scenario with an NOL has one.
7. **State income tax.** Source: "State income tax on income from your trade
   or business (including wages, salary, and unemployment compensation)" is a
   business deduction (`::b02`). The text gives no way to split the tax, or
   the capped Schedule A line 5e, between business and nonbusiness income.
   Default: an itemizer with state income tax on line 5a makes line 6 a gap;
   general sales tax is nonbusiness. Changes dollars on every such return.
   Not now: the split needs a method no text gives, so a person or a CPA
   chooses it.
8. **Line 7 income not named.** Default: Schedule 1 lines 1, 2a, 8b, 8f and
   8g are nonbusiness; the other line 8 items, Schedule E royalties, estate,
   trust and REMIC income are a gap. Changes dollars for those five lines.
   Not now for the gap: no scenario with an NOL has those items.
9. **Line 17.** The engine claims no section 1202 exclusion (Form 8949 column
   (g) is not modeled), so line 17 is 0 and lines 16 to 21 are skipped
   without a Schedule D loss. No dollars. Done.
10. **Line 24 when zero or more.** Source: "If the result is zero or more, you
    don't have an NOL". Default: blank. No dollars. Done.
11. **The farming loss.** Source: the NOL "if only income and deductions from
    farming businesses ... were taken into account" (`when-to-use-an-nol::b02`).
    Default: the net Schedule F loss on Schedule 1 line 6, capped by the NOL;
    with a K-1 or a Form 4797 on the return it is a gap. Changes dollars when
    a farm's SE tax deduction or a farm sale would count. Not now for the
    gap: the text does not say how a K-1 farm item or a farm sale enters.
12. **Part II asks before it knows.** The resolver cannot see line 24, so with
    a farm loss it asks the waiver, then both carryback years, even when the
    2023 column would absorb the loss. No dollars. Not now: the resolver
    runs before the lines, and asking from a line is a change to how forms
    are evaluated.
13. **Line 26, "for any preceding tax year".** Default: the test runs per
    column, and "had items based on AGI" is read as a line 6 amount other
    than 0. The other refigure is a gap; so are gifts other than cash to 60%
    organizations. Changes dollars only in the gap cases. Not now for the
    gaps: each needs the carryback year's full Schedule A, which no fact holds.
14. **Lines 19 to 21.** Mortgage insurance premiums count "for tax years
    before 2022"; the carryback years are 2023 and 2024. Default: blank. No
    dollars. Done.
15. **The 80% limit on Schedule 1 line 8a.** Source:
    `how-to-carry-an-nol-back-or-forward::b02`. Default: taxable income before
    the NOL deduction is Form 1040 lines 1z to 7a, Schedule 1 line 10 without
    8a, less the adjustments and line 12e. A return with an item figured from
    AGI (itemized deductions, taxable social security, an IRA or student loan
    deduction, Schedule 1-A, Forms 8582, 8815, 8839) makes line 8a a gap when
    a loss from 2018 on is carried. A loss before 2018 is deducted in full.
    The engine does not check that an old loss has expired. Changes dollars on
    those gap returns only. Not now for the gap: it needs a second pass of
    the return (Pattern change, below).
16. **The excess business loss worksheet.** Its line 1 reads "the amount from
    Form 172, line 33" (`nol-carryover-with-an-excess-business-loss::b01`);
    the NOL is line 24. The worksheet has no field; the engine does not figure
    the 2026 carryover. No dollars on a 2025 line. Not now: it is a 2026
    amount, and no 2025 line reads it.
17. **California takes back the federal NOL deduction.** Source: "Enter the
    amount of the federal NOL included on line 8a, column A, as a positive
    number in column C" (`ca-540-sched-ca-inst-2025::sec::line-8-other-income::b01`).
    The tax review found that Schedule CA line 8a stayed unsupported, so
    California AGI took the federal deduction: $300 less California tax for
    erith with a $5,000 federal carryover. Done: line 8a column A copies
    Schedule 1 line 8a, column C adds it back, and line 9a column C adds the
    row (`state/ca/schedule-ca/nolDeduction.ts`,
    `tests/unit/state/ca/schedule-ca/line8a.test.ts`). Schedule CA (540NR)
    has no rules yet, so its line 8a waits with the rest of that form.

## Pattern change

These are the proposals for a discussion.

- **A form that files only with a loss.** Before: `filesOnlyWithAmountOn`
  keeps a form only for an amount above 0, and a blank field of its own keeps
  it too, so Form 172 stays on every return with a business loss, even with
  no NOL. After: the spec could name a line that must be below 0 (Form 172
  line 24), and Form 172 would file only with an NOL.
- **Taxable income before the NOL deduction.** Before: line 8a is a gap for a
  loss from 2018 on when an item depends on AGI. After: the engine would
  evaluate the return a second time without line 8a and read taxable income
  from that pass, which changes how forms are evaluated.

## Blind fill

A blind preparer filled 14 cases from the blank form and the instructions
only. Part I and Part II match the engine in every dollar of line 24 and of
Part II lines 1, 7, 9 and 10. The one difference is case 7, where line 1 is
$54,250: the blind fill went on to lines 2 to 23, and the engine stops after
line 1. The engine follows Step 1 and Step 2 of `nol-steps::b01` ("You may
have an NOL if a negative amount appears", "If you do not have an NOL, stop
here"). Every add-back on line 24 is 0 or more, so with line 1 at 0 or more
there is no NOL (doubts 2 and 10). Line 24 is blank in both.

## Second opinions

- **PolicyEngine-US 2.154.0** (commit `363e9fc5`, 2026-11-25). It does not
  model Form 172: it has no NOL, no NOL deduction (Schedule 1 line 8a) and no
  carryback. Its section 461(l) variables (`excess_business_loss`,
  `limited_business_loss`) stop at Form 461. The one shared constant matches:
  the capital loss limit of $3,000, $1,500 for married filing separately
  (`parameters/gov/irs/ald/loss/capital/max.yaml`; Form 172 lines 19 and
  Schedule D line 21). No lead.
- **IRS Direct File.** Not compared: no checkout here, and Direct File's scope
  has no business or farm income, so it has no NOL.

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
