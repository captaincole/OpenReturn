# Form 4563: open questions

Form 4563 keeps a bona fide resident of American Samoa's income from there off Form 1040. The engine reads one answer fact per person (`facts/kinds/americanSamoaExclusion.ts`). The instructions are `irs-4563-form-2025`. Pub. 570 is not in the corpus; its 2025 web text was read on 2026-11-26.

The items are sorted in three groups: two texts that conflict (decided, with a `DECISION` comment and a row in `docs/rule-decisions.md`), defaults the engine took where no text conflicts ("Should we do this now"), and changes to how the repository works ("Pattern change").

## Two texts conflict

### 10. Student loan interest is not shared

- A DECISION, row A68 of `docs/rule-decisions.md`, in `schedule-1/studentLoanInterest.ts`.

### 14. The simple foreign tax credit with Form 4563

- Text: the Form 1040 instructions: the election needs "You aren't filing Form 4563" (`irs-1040-inst-2025::sec::specific-instructions-2::b01`). Form 1116's own list does not name it.
- Decided in Form 1116's QUESTIONS.md, item 16. Form 1116 line 12 is unsupported with Form 4563.
- Dollars: yes, rarely.

### 16. Rounding in the deduction fraction

- A DECISION, row A69 of `docs/rule-decisions.md`, in `4563/lines.ts` (`excludedGrossIncome`).
- Text A: "If you have to add two or more amounts to figure the amount to enter on a line, include cents when adding the amounts and round off only the total" (`irs-1040-inst-2025::sec::rounding-off-to-whole::b01`). Text B: the fraction's "Gross income from all sources" is not a line, and its U.S. part is Form 1040's lines, each already rounded.
- The engine adds each Form 4563 line's whole-dollar amount (the gross income of lines 10 to 13 rounded the same way), so both parts of the fraction are rounded line amounts. The engine first kept the cents and rounded once; the blind fill (2026-11-26) rounded by line.
- Dollars: a few. Interest of $1,234.49 + $87.50, dividends of $455.50 and other income of $100.25 + $49.50 against $3,000 of U.S. dividends: $1,928 of excluded gross income and a $9,588 standard deduction; with the cents kept, $1,927 and $9,590.

## Should we do this now

### 1. Excluded income is never on the return

- Text: "You must report on your tax return your worldwide income for the tax year that does not qualify for the exclusion" (`filing-form-1040-or-1040-sr::b01`).
- Default: the fact holds the qualifying income; it is never a W-2 or 1099 fact. A Form W-2AS is read into the fact, not as a W-2.
- Done (2026-11-26, the skeptic's pass): a fact that holds income but files no Form 4563 (the person is not a resident all year, or the decision files none) makes Form 1040 line 9 unsupported. "If you do not qualify for the exclusion ... Report all your taxable income" (`omb-no-1545-0074::b03`): Cade records each document as its W-2 or 1099 fact and removes the amounts from this fact. A fact with no income files nothing and changes nothing.
- Dollars: no, if Cade records each document once.

### 2. One Form 4563 for each person

- Text: the header asks for "Your social security number"; Part I is one person's residence (`face-header::b01`, `face-part-i::b01`). No text says how spouses file.
- Done: one copy per person, the taxpayer first, as Form 2555. A spouse's fact counts on a joint return only.
- Dollars: no.

### 3. Line 1 "ended" for a residence that goes on

- Text: none. Form 2555 line 10 asks for "Continues".
- Done: "Continues".
- Dollars: no.

### 4. Line 6 column (c): which days count

- Text: "Number of days absent" (the form). Pub. 570, chapter 1: a day is a day of presence when "you are physically present in that territory at any time during the day".
- Done: the full days between the day of leaving and the day of return, and only those in 2025 (the form: "days absent ... during the tax year"). A trip from March 10 to March 24 is 13 days; one from December 20, 2025 to January 3, 2026 is 11.
- The blind fill (2026-11-26) took column (b) minus column (a): 14 days for March 10 to March 24. The form text (`irs-4563-form-2025::sec::face-part-i::b01`) gives no counting rule, and no text conflicts with Pub. 570's definition, so a day spent partly in American Samoa is never a day absent.
- Dollars: no.

### 5. More than four absences

- Text: line 6 has four rows; the instructions say nothing more.
- Done: every line 6 field is unsupported with five or more absences, as Form 2555 lines 14 and 18 are. A second copy of the form would print Part II twice, so the copies mechanism does not fit.
- Not now: an attached statement is a pattern change (below).
- Dollars: no.

### 6. A loss on lines 10 to 13

- Text: line 15 is "Add lines 7 through 14" (the form).
- Done: a loss prints as a negative amount and line 15 adds it. The add-backs take line 15 as it is.
- Dollars: yes, for a person with a net loss from American Samoa sources.

### 7. Gross income for the deduction fraction

- Text: Pub. 570 shares the standard deduction by "Gross income subject to U.S. income tax / Gross income from all sources", and gross income from a business is "Schedule C, line 7" (Table 4-1, note **).
- Done: the fact holds each net amount and its gross income. The U.S. side is Form 1040 lines 1z to 8 when each is gross income as it prints.
- Not now: with a Schedule C, E or F amount, Form 4797, a Schedule D, an NOL or Form 2555, line 12e is unsupported; figuring their gross income needs each schedule's gross line, which no scenario has yet.
- Dollars: yes, for those returns.

### 8. The note above line 9

- Text: Pub. 570: "In the space above line 9, enter 'Standard deduction modified due to income excluded under section 931'".
- Not now: Form 1040 has no field for it, and the PDF fill writes only into fields.
- Dollars: no.

### 9. Lines that share a deduction the engine does not share

- Text: "Deductions and credits that are not definitely related to a particular type of income must be allocated" (`filing-form-1040-or-1040-sr::b01`). Pub. 570 names alimony, the standard deduction and the itemized deductions.
- Done: the standard deduction is shared. Schedule A lines 5e and 17, Form 1040 line 12e with itemized deductions or a disaster loss increase, and Schedule 1 line 19a are unsupported.
- Not now: sharing Schedule A line by line is a pattern change (below).
- Dollars: yes, for those returns.

### 11. Deductions and credits definitely related to the excluded income

- Text: "you cannot take any deduction or credit on your tax return that is definitely related to the excluded income" (`filing-form-1040-or-1040-sr::b01`).
- Default: the engine cannot tell which deduction or credit is related. Every deduction and credit on the return is taken as related to U.S. income. Cade must not record an expense of the excluded income.
- Not now: no fact marks an expense as related to territory income, and no scenario has one.
- Dollars: yes, if one is recorded.

### 12. Self-employment tax on excluded income

- Text: "you will generally have to pay self-employment tax on those earnings even though you can exclude the earnings ... Use Schedule SE" (`filing-form-1040-or-1040-sr::b02`).
- Done: lines 10 and 13 are the self-employment income. With $400 or more of net earnings, or next to a Schedule SE, Schedule 2 lines 4 and 21 and Form 1040 lines 23 and 24 are unsupported; next to a Schedule SE so is Schedule 1 line 15.
- Not now: the tax itself needs Schedule SE to read the excluded income, a pattern change (below).
- Dollars: yes.

### 13. Additional Medicare Tax on W-2AS wages

- Text: Form 8959 counts a Form W-2AS as a Form W-2 (`irs-8959-inst-2025::sec::future-developments::b01`), and must file when "Your Medicare wages and tips on any single Form W-2 (box 5) are greater than $200,000" (`irs-8959-inst-2025::sec::who-must-file::b01`).
- Done: when W-2AS box 5, the return's W-2 box 5 and the self-employment income pass the threshold, Schedule 2 lines 11 and 21 and Form 1040 lines 23 and 24 are unsupported. Since the skeptic's pass (2026-11-26) the same gap shows when one person's W-2AS box 5 is over $200,000 although the return stays under its threshold (married filing jointly up to $250,000): Form 8959 then files, and the 0.9% withheld is a payment on Form 1040 line 25c. The gap on line 24 keeps the refund from being figured without it.
- Default: the fact holds one box 5 per person. Two W-2AS forms from two employers, each at or under $200,000 but together over it, also show the gap, although no employer withheld. The gap is then one the person can clear only with a W-2 fact.
- Not now: the withholding (box 6) is not recorded; reading it needs the W-2AS as a W-2, a pattern change (below).
- Dollars: yes, above $200,000.

### 15. Earned income of excluded wages

- Text: none in the Form 4563 instructions.
- Default: excluded wages are not earned income on Schedule 8812 Part II-A, Form 2441 or Schedule EIC. The EIC needs a main home in the United States, which American Samoa is not (Pub. 570, chapter 4).
- Not now: no text says otherwise, and the made-up taxpayer's credit is limited by her tax, not by Part II-A.
- Dollars: possibly, for the additional child tax credit.

### 17. Social security benefits in the fraction

- Text: Pub. 570's fraction counts "Gross income". The Form 4563 instructions do not say how a benefit that is partly taxable counts.
- Done: Form 1040 line 6b, the taxable part, is the U.S. gross income; the untaxed part is not gross income. The blind fill made the same choice.
- Dollars: yes, for a person with social security benefits. Counting the full benefit would raise line 12e.

### 18. A capital gain netted with a loss

- Text: Pub. 570, Table 4-1: "Gross income includes gains, but not losses".
- Done: the fact's capital gain gross income is the gains alone; Cade records it. The blind fill counted $9,000 of gains, not the $6,000 net, and got the engine's amount.
- Dollars: yes, when the gross income is recorded as the net gain.

### 19. Lines that read Form 4563 while it waits

- Text: the same allocation rule as item 9.
- Done (2026-11-26, the skeptic's pass): while Form 4563 files and waits for an answer (a fact without Part I, or a decision with no fact), Form 1040 line 12e waits, Schedule 1-A line 3 and Schedule 8812 line 3 wait, and the Schedule A and alimony lines are gaps. Before, they showed the full deduction and AGI alone.
- Not now: Schedule 2 lines 4 and 11 read only the complete facts while one waits. The return is not ready while the form waits, so no value reaches a filed return.
- Dollars: no on a filed return.

## Pattern change

### Proposals for a discussion

- **Excluded self-employment income on Schedule SE.** Before: the excluded business is only an amount in the Form 4563 fact, so Schedule 2 line 4 is a gap. After: the business would be a Schedule C (and a farm a Schedule F) marked "American Samoa"; Schedule 1 lines 3 and 6 would leave it out, Schedule SE would keep it, and Schedule 1 line 15 would take the share Pub. 570 gives.
- **Shared itemized deductions.** Before: with Form 4563, Schedule A line 17 is a gap. After: Schedule A lines 1, 5a to 5c, 8a to 8c, 11 and 12 would take their share by gross income (Pub. 570, Itemized Deductions example), and the SALT worksheet line 3d would add Form 4563 line 15.
- **Attached statements for rows that overflow.** Before: Form 4563 line 6 and Form 2555 lines 14 and 18 are unsupported past their last row. After: they would print their first rows and list the rest on a statement the PDF fill appends, a new kind of output for every form with rows.
- **W-2AS as a document.** Before: a W-2AS is read into the Form 4563 fact, so Form 8959 never sees its boxes 5 and 6. After: a W-2AS would be a W-2 fact with a territory mark; Form 8959 would read boxes 5 and 6, Form 4563 line 7 would read box 1, and a person who does not qualify would have the wages on line 1a with no gap.

## Second opinions

- **PolicyEngine-US 2.154.1** (commit 0fbed6dd, 2026-11-26). It models section 931 income as one input, `specified_possession_income`, which it takes off AGI and adds back in `agi_plus_section_911_931_933_exclusions`. That MAGI feeds the child tax credit, the education credits, the saver's credit, the clean vehicle credits, the SALT cap phase-down and the Schedule 1-A deductions; `student_loan_interest/magi/excluded_alds.yaml` and `social_security/taxability/income/revoked_deductions.yaml` add it back to the student loan interest and social security worksheets.
- **The lead it gave:** the saver's credit. Form 8880 line 8 read Form 1040 line 11a only. Pub. 590-A says the AGI of the credit must add "any exclusion or deduction claimed for the year for ... Income from American Samoa" (`irs-pub-590a-2025::sec::retirement-savings::b03`). Fixed: line 8 adds Form 4563 line 15, every copy.
- **Agreed:** every other add-back on its list is a rule here (Schedule 8812 line 2c, Form 8863 lines 3 and 14, Form 8936, Schedule 1-A line 2d, the Pub. 970 and Pub. 915 worksheets) or a named gap (the Schedule A SALT worksheet line 3d). Forms 8839 and 8815 add line 15 here; PolicyEngine does not list them, and their instructions name Form 4563 (`irs-8839-inst-2025::sec::line-7::b01`, `irs-8815-form-2025::sec::step-action::b03`).
- **Not modeled there:** the share of the standard deduction and of other deductions, line 6 and the days absent, self-employment tax on excluded income. No check of the engine's line 12e is possible.
- **IRS Direct File:** not reachable from this worktree (no checkout), and Direct File did not serve territory residents.

## Confidence

| Field group | Confidence |
| --- | --- |
| Header | stated rule |
| Part I lines 1 to 5 | stated rule (line 1 "Continues": own reading) |
| Line 6, columns (a), (b), (d) | stated rule |
| Line 6, column (c) | own reading (item 4) |
| Lines 7 to 14 | stated rule |
| Line 15 | stated rule (the form's arithmetic) |
| Form 1040 line 12e share | published example with numbers (Pub. 570, Terry and the Thompsons) |
| Line 15 on Schedule 1-A, Schedule 8812, Forms 8863, 8839, 8815, 8880, 8936 | stated rule |
| Line 15 on the Pub. 970 and Pub. 915 worksheets | stated rule |
| Form 1040 line 9 with income that is not excluded | unsupported (item 1) |
| Schedule A, alimony, self-employment and Additional Medicare lines | unsupported |
