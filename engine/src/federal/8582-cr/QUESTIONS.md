# Form 8582-CR — doubts and defaults

The engine fills Form 8582-CR for an individual from Form 3800's passive sources: the stated credits and carryovers marked passive, and the K-1 credits of a passive activity. The 2025 instructions publish no example with numbers. The 1998, 2005 and 2009 instructions have one (a limited partner's low-income housing credit); it is a unit test. The synthetic taxpayers `arram` (Parts II to IV, Worksheets 5 to 9) and `beldeine` (line 6, Part IV with no income limit) are the scenarios.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | Stated rule |
| Lines 1a to 4c (worksheet totals) | Stated rule; the worksheet of a K-1 low-income housing credit is own reading (item 5) |
| Lines 5, 7 | Stated rule |
| Line 6 | Stated rule; the tax method is own reading (item 1) |
| Part II, lines 8 to 16 | Stated rule; modified AGI with net passive income: decision A45 |
| Part III, lines 17 to 30 | Stated rule; line 22 as line 10 (decision A45) |
| Part IV, lines 31 to 36 | Published example with numbers (prior-year, logic only) |
| Line 37 | Published example with numbers; line 7 at zero: decision A44 |
| Worksheets 5 to 9 (Form 3800's columns) | Stated rule; the rows are own reading (items 2 and 3) |
| Part VI, lines 38 to 41 | Stated rule; the reduction of the credit is own reading (item 6) |
| A publicly traded partnership's credit | Unsupported (proposal below) |
| A recaptured passive carryover | Unsupported (proposal below) |
| Lines 10 and 22 with a Schedule K-1 on the return | Unsupported (item 7) |

## Two texts conflict

- **A44, line 37 with line 7 at zero.** The form adds lines 6, 16, 30 and 36; the line 7 instruction says enter line 5. The engine enters line 5. `lines.ts`, `docs/rule-decisions.md` row A44.
- **A45, modified AGI (lines 10 and 22) with net passive income.** The line 10 instruction leaves out only a passive activity loss, so net passive income counts; Pub. 925 leaves out all passive income and loss "included on Form 8582", as Form 8582's own MAGI does. The engine follows the line 10 instruction: Form 8582's MAGI plus the net passive income of line 6 (Form 8582 line 3 when it shows income). `returnInputs.ts`, `docs/rule-decisions.md` row A45.

## Should we do this now

Each item is a doubt with no conflicting text. "Done" names the default the engine applies; "Not now" says why it waits.

### 1. The tax attributable to an amount (lines 6, 15, 27, 35)

- Source: "Tax on line C ... use the Tax Table, Tax Computation Worksheet, or other appropriate method you used to figure your tax"; "it isn't necessary to refigure items that are based on a percentage of adjusted gross income" (`irs-8582cr-inst-2025::sec::line-6::b01`, `::b02`, `line-15::b01`).
- Done: the tax on taxable income less the tax on taxable income less the amount, both with the method of Form 1040 line 16 (the QDCG worksheet, or the Schedule D Tax Worksheet). The qualified dividends and the net capital gain stay as the return has them; only taxable income is lower, so the amount comes out of ordinary income first. Taxable income less the amount is not below zero. A return whose line 16 is figured on Form 8615 or with Form 2555 is a gap.
- Changes dollars: only when the net passive income is itself a capital gain or qualified dividends, which the engine does not split out.

### 2. One worksheet row for each source

- Source: "separate the credits by activity and by type before making entries in the worksheets" (`specific-instructions::b01`).
- Done: each fact or K-1 credit is its own row. Two credits of one type from one activity are two rows; the pro rata shares are the same as one row's, except a dollar of rounding.
- Changes dollars: at most $1 for each row.

### 3. Current credit and prior year credit of one activity

- Source: Worksheet 9 gives the allowed credit for each activity of Worksheet 8, column (c) of Worksheets 1 to 4, which adds columns (a) and (b) (`instructions-for-worksheet-9::b01`). Form 3800 needs the allowed part of each: Part III column (g) for this year's credit, Part IV column (e) for the carryover.
- Done: each is its own row (item 2), so the allowed credit of an activity is split between them by their amounts, as the worksheets' ratios do.
- Changes dollars: moves allowed credit between Form 3800 Part III and Part IV; the total allowed does not change. It changes Form 3800's carryforward to 2026 only when Form 3800's own tax limit stops credits.

### 4. Lines the form skips

- Source: line 7, "Don't complete Worksheets 5 through 9" when all credits are allowed (`line-7::b01`); each part's note "Complete this part only if you have an amount on line 1c (2c, 3c)".
- Done: with line 7 at zero, Parts II to IV are blank. A part with no amount on its line is blank. Lines 18, 28 and 32 print 0 when the line they copy is blank; line 13 and line 25 are blank when Form 8582 line 9 has no amount ("the amount, if any").
- Changes dollars: no.

### 5. A K-1 low-income housing credit goes on Worksheet 3

- Source: Worksheet 2 takes a low-income housing credit "from a partnership, S corporation, or other pass-through entity if your interest in the pass-through entity was acquired before 1990" (`reporting-credits-from-the-activities::b02`). The K-1 does not say when the interest was acquired.
- Done: Worksheet 3. A current credit from a building placed in service before 1990 ended with its 10-year credit period, and an interest acquired more than 35 years ago is rare. A stated credit says it (`before1990`).
- Changes dollars: yes, for such an interest: Part III has a $200,000 to $250,000 phaseout and Part IV has none.

### 6. Part VI, the basis election

- Source: "The amount of the unallowed credit that may be applied against tax is reduced by the amount of the basis adjustment" (`line-38::b01`).
- Done: the election sits on the passive carryover it belongs to. Line 41 is the basis adjustment, and column (b) of the worksheet is the carryover less line 41, not below zero. Part VI holds one election; a second is a gap. The basis increase does not change the gain on Form 4797: the sale's facts state the basis (proposal below).
- Changes dollars: yes, by line 41 on the credit; the gain is as stated.

### 7. Modified AGI with a Schedule K-1

- Source: line 10 lists the same items as Form 8582 line 6 (`line-10::b01`).
- Not now: lines 10 and 22 start from Form 8582's modified AGI (`federal/8582/magi.ts`), and they are a gap on a return with a K-1, as Form 8582's are (`federal/8582/magiGap.ts`): the K-1 amounts are not all counted yet. Part IV has no modified AGI test, so a K-1 return computes it. The gap goes when Form 8582's K-1 MAGI is modeled.
- Changes dollars: no; it is a gap.

### 8. Net passive income without Form 8582

- Source: "If Form 8582, line 3, shows net income or you didn't complete Form 8582 because you had net passive income" (`line-6::b01`).
- Done: Form 8582 line 3 when it files. When it does not file, the net income of the K-1 passive activities (which then have no loss). A passive rental property with no deduction, or an entire disposition with net passive income (the overall loss reduces it first), is a gap. Lines 10 and 22 add the same amount (decision A45).
- Changes dollars: no.

### 9. Form 8834 and trusts

- Source: who must file names the qualified plug-in electric vehicle credit (`who-must-file::b01`); trusts put every credit on Worksheet 4 (`lines-4a-through-4c::b01`).
- Done for Form 8834: a prior year unallowed qualified electric vehicle credit is a fact (`electric_vehicle_credit.passive_carryover.<slug>`). It is a row in column (b) of Worksheet 1 or 4 next to Form 3800's sources (`form.ts`), and Form 8834 line 1 takes its allowed part (`federal/8834/`). The credit is not a general business credit, so Form 3800 never holds the row.
- Not now: the engine figures an individual's return, not a trust's.
- Changes dollars: no.

### 10. A section 6418 transfer of a credit that cannot be transferred

- Source: Form 8582-CR takes its credits from Form 3800 Part III line 2, with the passive amounts of column (f) (`irs-3800-inst-2025::sec::line-2::b01`), and a sold credit is a negative amount in column (f) (`transferees-of-eligible-credits-under-section::b05`). The list of credits that may be transferred names sections 30C, 40A, 45, 45Q, 45U, 45V, 45X, 45Y, 45Z, 48, 48C and 48E (`transfer-of-eligible-credits-under-section-6418::b01`); the section 47 rehabilitation credit and the other credits of Worksheets 1 to 3 are not on it.
- Not now: the engine takes a stated transfer as the fact says, whatever the credit; column (a) of the worksheet is the credit less the amount sold. Checking the credit against the list is Form 3800's rule, not this form's.
- Changes dollars: yes, only for a fact that states a transfer the law does not allow (blind fill case 14: $3,000 on line 2a, or $5,000 if the transfer is void).

### 11. The worksheets' ratios

- Source: Worksheets 5 and 8 divide each credit by the column's total, "The total of all the ratios must equal 1.00", and multiply the line by the ratios (`instructions-for-worksheet-5::b01`, `instructions-for-worksheet-8::b01`). Worksheet 5 is for "credits from more than one activity"; Worksheet 8 takes "column (d) of Worksheets 5, 6, and 7".
- Done: exact ratios, and whole-dollar shares from running totals, so a column adds to its line exactly. A worksheet with one row still gives its column (d) (the credit less its allowance), so Worksheet 8 has it. Two-decimal ratios can add to 1.01 (blind fill case 11).
- Changes dollars: at most $1 for each row.

## Pattern change

### Proposals for a discussion

- **Publicly traded partnerships.** Before: a PTP's credit is a gap on its Form 3800 line, and the form computes the rest; a PTP's credits are figured apart from the form, PTP by PTP, with the tax on each PTP's own net passive income (`computation-of-allowed-passive-activity-credits::b01` to `::b05`). After: a step after this form reads each PTP's net income from its K-1 and lines 27 and 35, and gives Form 3800 each PTP's allowed credit.
- **A recaptured passive carryover.** Before: it is a gap, because Form 8582-CR lowers the prior year unallowed credit by the recapture (`prior-year-unallowed-credits::b01`) and Form 3800 Part IV column (i) subtracts column (h) again (`irs-3800-inst-2025::sec::part-iv-2::b04`). After: for a passive row, Form 3800 column (i) is column (e) less column (g), and column (h) prints for the record, so the recapture is taken once.
- **The basis election and Form 4797.** Before: the basis increase of Part VI does not change the gain on the sale of the credit property, because no fact links a carryover to a sale. After: the sale fact names the carryover whose election raises its basis, and Form 4797 adds line 41 to the basis.

## Second opinions

- **Prior-year instructions (1998, 2005, 2009).** The worked example matches the engine's lines 3a to 37 with the edition's tax figures (`tests/unit/federal/8582-cr/lines.test.ts`).
- **PolicyEngine-US 2.154.0** (commit `363e9fc5`, 2026-11-25). It does not model this form. `general_business_credit` is a bare input with no formula, and no variable or parameter applies section 469 to credits: no passive credit limit, no special allowance in credit equivalents, no $100,000 to $150,000 or $200,000 to $250,000 phaseout. There is nothing to compare.
- **Other projects.** The repository names no other reference implementation that models passive credits. IRS Direct File (issue #140) is not checked out here, and it does not support passive activities or business credits.
- **Blind fill** (2026-11-26, 15 cases): no line differs in dollars. Nine lines differ as blank against 0 (lines 18, 28 and 32 when the line they copy is blank; item 4). The blind preparer's dollar doubts are decision A44 and items 3, 6, 10 and 11.
- **Tax review** (2026-11-26): a reviewer found that lines 10 and 22 left out net passive income; fixed as decision A45, with a unit test (`tests/unit/federal/8582-cr/form.test.ts`, "modified AGI with net passive income").
