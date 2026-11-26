# FTB 3801-CR — open questions

The engine fills FTB 3801-CR for a Form 540 filer from the California passive credit facts (`facts/kinds/caPassiveCredit.ts`). Lines 1a to 16 and Worksheets 1 to 9 are federal Form 8582-CR's rules in California amounts. The 2025 instructions publish no example with numbers. The federal 2005 and 2009 example (Mr. Jones) is a unit test of Part I. The synthetic taxpayers `kiruna` (Part II, Schedule P (540) lines 16 to 18, Form 540 line 45) and `leonin` (lines 2a to 2c, no FTB 3801, Form 540 lines 43 and 44) are the scenarios. Schedule P (540) attaches by itself when the facts hold more than two credits (`schedule-p/creditCount.ts`); `kiruna` has no decision for it.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | Stated rule |
| Lines 1a to 5 (worksheet choice) | Stated rule; Part I logic matches the federal published example (prior-year, logic only) |
| Line 6 | Stated rule (the A to E steps); net passive income without FTB 3801 is own reading (item 5) |
| Line 7 | Stated rule |
| Lines 8 to 16 | Stated rule (the same lines as federal Form 8582-CR) |
| Line 10 | Stated rule; RDPs are own reading (item 6) |
| Line 13 | Stated rule |
| Line 17 | Stated rule; line 7 at zero: decision A46; low-income housing: decision A47 |
| Worksheets 5 to 9 (the allowed credit of each code) | Stated rule (the federal worksheets); Worksheets 6 and 7 share the low-income housing offset (decision A47) |
| Lines 18 to 21 (Part IV) | Stated rule; the lower credit is own reading (item 7) |
| Form 540 lines 43 to 45, Schedule P (540) lines 16 to 18 | Stated rule; the order is decision A48 |

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

### 1. Line 17 when the tax on net passive income is more than the credits (A46)

- Texts: the face, "Add line 6 and line 16"; the instructions, line 7: "enter the amount from line 5 on line 17" (`ca-3801cr-inst-2025::sec::line-7::b01`).
- Decided: line 17 is never more than line 5. `lines.ts`.

### 2. A low-income housing credit with nothing to offset (A47)

- Texts: Important Information says the dollar limit does not apply to the low-income housing credit (`ca-3801cr-inst-2025::sec::rental-real-estate-activities::b01`), and so does R&TC section 17561(d)(1), as the lead read a public copy on 2026-11-26; the form's lines allow lines 2c and 3c only through line 6.
- Decided: the instructions and the statute. Lines 2c and 3c get the rental real estate offset with no dollar limit: line 17 adds the smaller of line 2c plus line 3c, and line 7 less line 16 (line 2c first). Lines 8 to 16 are unchanged. Worksheets 6 and 7 share the offset. A separate return that lived with the spouse has the credits on Worksheet 4, so it gets none. Schedule P (540) Section B2, or Form 540 lines 43 to 45, still limit the credit by the tax. `lines.ts`, `form.ts`, `creditUsed.ts`. Check the Code itself when it is in the library.

### 3. The order of use in Schedule P (540) Section B2 (A48)

- Texts: Section B2, limited carryovers first, or any order "if that is to your advantage" (`ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01`); the business credit limitation, the low-income housing credit "after any business credits" (`::how-to-compute-the-limitation::b01`).
- Decided: research (183), orphan drug (185), low-income housing (172), on every return. `creditUsed.ts`.

## Should we do this now

### 4. The tax on taxable income (lines 6 and 15)

- Source: "B. Tax on line A ... D. Tax on line C" (`ca-3801cr-inst-2025::sec::line-6::b01`, `::line-15::b01`).
- Done: the Tax Table or Tax Rate Schedule of Form 540 line 31, on Form 540 line 19 with and without the amount. Exemption credits are left out: they are the same in both figures. A child's tax on FTB 3800 is a gap. No dollars change for the returns the engine fills.

### 5. Net passive income when FTB 3801 does not file

- Source: "if you did not complete form FTB 3801 because you had net passive income, you will have to figure the tax on the net passive income" (`ca-3801cr-inst-2025::sec::line-6::b01`).
- Done: the sum of the California net income (FTB 3801 worksheet column (f)) of the passive Schedule E activities. FTB 3801's gaps (a passive K-1, a passive business, an entire disposition) pass through.

### 6. Line 10 for an RDP

- Source: "For RDPs, enter your federal modified adjusted gross income from your refigured federal Form 8582-CR, line 10" (`ca-3801cr-inst-2025::sec::line-10::b01`).
- Not now: the engine has no fact that says a spouse is an RDP, so line 10 is federal Form 8582-CR line 10 as built for the return. A military servicemember domiciled outside California files Form 540NR, which is a gap. Dollars change only for an RDP whose refigured amount differs.

### 7. Part IV lowers the carried credit

- Source: the California instructions say only that the taxpayer "may elect to increase the basis of the credit property" (`ca-3801cr-inst-2025::sec::dispositions::b01`). Federal Form 8582-CR: "The amount of the unallowed credit that may be applied against tax is reduced by the amount of the basis adjustment" (`irs-8582cr-inst-2025::sec::line-38::b01`), and the California text says "Get federal Form 8582-CR for definitions" (`::b-special-note::b01`). No text conflicts.
- Done: the federal rule. Column (b) of that credit is its carryover less line 21. Part IV has room for one election; a second election is a named gap, because the form files once per return and the engine writes no statements.

### 8. The business credit limitation and FTB 3870

- Source: business credits "may not reduce the 'net tax' by more than $5,000,000"; column (d) subtracts any credit elected refundable on FTB 3870 (`ca-540-sched-p-inst-2025::sec::part-iii-credits-that-reduce-tax::b01`, `::column-a-through-column-d-instructions::b01`).
- Not now: the cap binds only above $5,000,000 of credits, and no fact records an FTB 3870 election.

### 9. The publicly traded partnership steps

- Source: "Do not enter credits from PTPs on the worksheets or on form FTB 3801-CR" (`ca-3801cr-inst-2025::sec::credits-from-publicly-traded-partnerships-ptps::b01`).
- Not now: a PTP credit stays off the form, and the Form 540 credit lines are a named gap. The PTP steps are a separate computation that no scenario needs yet.

### 10. Lines 6 and 15 together can be more than the tax

- Source: line 6 is the tax on net passive income and line 15 the tax on line 14, each from full taxable income (`ca-3801cr-inst-2025::sec::line-6::b01`, `::line-15::b01`; the federal lines read the same).
- Done as written. When net passive income plus line 14 is more than taxable income, line 17 is more than the regular tax (a $45,000 taxable income: line 6 $886 and line 15 $946 against a $1,235 tax). Schedule P (540) column (b) then stops at the tax, so the tax this year does not change; the rest is column (d) carryover. A unit test (`form.test.ts`, "column (d) carries the rest") covers it.

### 11. Form 540 lines 43 and 44 when Schedule P (540) attaches but only one or two credits are used

- Source: "To claim more than two credits, use Schedule P (540), Part III" (`ca-540-inst-2025::sec::line-43-through-line-45-additional-special-credits::b01`).
- Not now: Form 540 counts the credits with an amount used this year (`540/credits.ts`, all its credits), so a third credit used at $0 leaves the other two on lines 43 and 44 while Schedule P (540) also lists it. Line 47 is the same either way.

### 12. Not covered by a scenario

- Line 13 (FTB 3801 line 9 above 0) needs a passive loss, which leaves line 6 at 0; a unit test covers it.
- Part IV needs the sale of an entire interest on the return; unit tests cover lines 18 to 21.
- A research credit from a rental activity (Worksheet 1) is unusual; `kiruna` has one so that Part II shows.
- Schedule S line 2 with a passive credit, and a Schedule P (540) column (d) above 0, are unit tests (`form.test.ts`).

## Pattern change

None.

## Second opinions

- **PolicyEngine-US 2.154.0** (commit `363e9fc5`, 2026-11-25). It does not model this form. Its California code (`variables/gov/states/ca`, `parameters/gov/states/ca`) has no passive activity credit, no research, orphan drug or low-income housing credit, and no special allowance. Its federal code applies no section 469 limit to credits either (see `federal/8582-cr/QUESTIONS.md`). There is nothing to compare.
- **Other projects.** The repository names no other reference implementation that models California passive credits. IRS Direct File (issue #140) is federal only, is not checked out here, and does not support passive activities or business credits.
- **Blind fill** (2026-11-26, 14 cases): no line differs, in dollars or as blank against 0. The blind preparer's dollar doubts are decisions A46 (line 17 when line 6 is more than line 5) and A47 (item 2). Its other doubts change no dollars: line 17 is 0, not blank, when line 6 is an entered 0 and Part II is blank; line 12 rounds to the nearest dollar; a low-income housing credit through a pass-through interest bought before 1990 goes on line 2; an orphan drug carryover goes in column (b).

## Proposals for a discussion

None.
