# Form 8834 — doubts and defaults

Form 8834 now only claims a qualified electric vehicle credit from a passive activity: a credit for a vehicle placed in service before 2007 that an earlier Form 8582-CR did not allow. The engine fills it for an individual. The form and its instructions (Rev. October 2024) publish no example with numbers, and no prior revision with this layout has one. The synthetic couple `ronde` is the scenario; `tests/unit/federal/8834/` holds the limit tests.

## Second opinions

- Blind fill (2026-11-26): a preparer filled 14 cases from the blank form and the 2025 instructions only. All 126 values match the engine (no blank-against-0 differences either). None of the preparer's doubts changes dollars: line 5 follows A58, line 6i left out is item 2, a zero line 1 is item 4, and Form 6251 line 9 below zero is $0 in both fills.
- PolicyEngine-US 2.154.0 (commit 363e9fc5e4): does not model Form 8834, the section 30 credit or passive activity credits. Its nonrefundable credits share one cap, the income tax before credits, with no tentative minimum tax limit, and `amt_foreign_tax_credit` is a bare input that no formula reads. Nothing to compare.
- IRS Direct File (commit e365f9f): its fact dictionary (backend/src/main/resources/tax) has no Form 8834, Form 8582-CR or Form 6251 module. Nothing to compare.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header | Stated rule |
| Line 1 (from Form 8582-CR) | Stated rule; the row on Form 8582-CR is own reading (item 1) |
| Lines 2, 3a, 3c, 4 | Stated rule |
| Line 3b | Stated rule; line 6i left out is own reading (item 2) |
| Line 5 | Stated rule; the foreign tax credit taken off: decision A58 |
| Lines 6, 7 | Stated rule |
| Line 1 next to a current-year passive Form 3800 credit | Unsupported (proposal below) |
| Line 1 for a publicly traded partnership | Unsupported (Form 8582-CR's PTP gap) |

## Two texts conflict

- **A58, line 5 with the minimum tax foreign tax credit.** Form 8834 line 5 is Form 6251 line 9; Form 6251 leaves its line 8 blank when it owes no minimum tax. The engine takes line 7 less the credit line 8 would hold, as Forms 8801, 8911 and 3800 do. `credit.ts`, `docs/rule-decisions.md` row A58.

## Should we do this now

These are doubts with no conflicting text. Each one is done, or says why not.

### 1. Which column of Form 8582-CR

- Source: "See the Instructions for Form 8834 for the amount to enter in column (a) of Worksheet 1 or 4" (`irs-8582cr-inst-2025::sec::form-8834-qualified-electric-vehicle-credit-see-the::b01`); prior year unallowed credits go "in column (b) of Worksheet 1, 2, 3, or 4" (`prior-year-unallowed-credits::b01`).
- Done: column (b). No credit can arise in 2025 ("available for certain vehicles placed in service before 2007", `irs-8834-form-2025::sec::face-page-1::b01`), so column (a) is always empty. Worksheet 1 for rental real estate with active participation in both years, else Worksheet 4.
- Changes dollars: no.

### 2. Line 3b leaves out line 6i

- Source: line 3b adds "Schedule 3 (Form 1040), lines 2 through 5, and 7 (reduced by ... line 6a, ... line 6b, ... line 6j, ... line 6k)" (`irs-8834-form-2025::sec::line-3b::b01`). Line 7 also holds line 6i, this credit.
- Done: line 6i is left out. The line is titled "Credits that reduce regular tax before the qualified electric vehicle credit", and a credit cannot limit itself. Form 8911 line 6b has the same reading.
- Changes dollars: no; the other reading has no answer (a loop).

### 3. The credit that line 6 does not allow

- Source: "If you can't use part of the credit because of the tax liability limit, the unused credit is lost" (`irs-8834-form-2025::sec::line-7::b01`). Form 8801 line 20 takes "any qualified electric vehicle credit not allowed for 2024 solely because of the limitation under section 30(b)(3)(B)" (`irs-8801-inst-2025::sec::part-ii-minimum-tax-credit-and::b01`).
- Done: nothing on this return. The two texts fit together: the credit itself is gone, and next year's Form 8801 adds its amount to the minimum tax credit. Next year that amount (line 1 less line 7) is the answer `prior_year.unallowed_qualified_electric_vehicle_credit`, which Form 8801 line 20 already reads. It is a separate amount from this form's input, the passive carryover.
- Changes dollars: not on the 2025 return.

### 4. A zero line 1

- Source: "Use Form 8834 to claim any qualified electric vehicle passive activity credit allowed for the current tax year" (`purpose-of-form::b01`).
- Done: when Form 8582-CR allows none, line 1 is 0 and the form leaves the return (`filesOnlyWithAmountOn`). Line 7 is then 0 before the tax limit is read ("Enter the smaller of line 1 or line 6", `face-page-1::b02`), so Schedule 3 line 6i is blank even when lines 2 to 6 have a gap (Form 1116 files, or Form 6251 is turned off). Before the tax-review fix of 2026-11-26, that gap reached line 6i and, through it, Form 3800 line 10b, Form 8801 line 22 and Form 8911 line 6b (unit test "no credit allowed and a gap in the tax limit"). Form 6251 still files: its resolver cannot see line 1 (a known gap, as for Form 8911).
- Changes dollars: no.

### 5. Line 2 and Form 8621

- Source: line 2 is "the sum of the amounts from Form 1040 ... line 16; and Schedule 2 (Form 1040), line 1z" (`face-page-1::b01`). Form 3800 line 7 leaves out a Form 8621 tax; this form says nothing of it.
- Done: the form's words, with no Form 8621 change.
- Changes dollars: only with a section 1291 tax on the return.

### 6. Part VI of Form 8582-CR for this credit

- Source: Part VI lets a taxpayer who disposed of an activity raise the basis of credit property by the unallowed credit (`irs-8582cr-inst-2025::sec::line-38::b01`).
- Done: the fact has no election. A vehicle placed in service before 2007 is fully depreciated, and its basis election would not change the form.
- Changes dollars: no for this form.

### 7. The name on Schedule 3 of a joint return

- Source: Schedule 3 asks for the "Name(s) shown on Form 1040, 1040-SR, or 1040-NR". The ronde render shows only "Ronde Tallowmere" there, while Form 8834, Form 8582-CR and Form 6251 show both spouses (`namesOnReturn`). Schedules 1 and 2 print no name and an SSN with no dashes.
- Not now: the headers belong to Schedules 1, 2 and 3, not to this form, and a fix there re-locks the golden PDFs of every joint scenario. It goes in its own pull request.
- Changes dollars: no.

### 8. Rows and copies

- Form 8834 has no rows: line 1 adds every prior year unallowed credit that Form 8582-CR allows, however many facts there are. Nothing repeats past a limit.

## Pattern change

Proposals for a discussion: each one is not made, and the case stays unsupported.

- **A current-year passive Form 3800 credit next to this credit.** Before: line 1 is unsupported. Form 8582-CR shares its allowed credit among all passive credits, and the engine figures Form 3800's current-year credits after its Part II tax lines, whose line 10b subtracts this credit (and Form 8911's line 3 reads its line 6b, which subtracts it too). After: Form 3800 would split its current credits into a step with no tax read (the stated amounts, the caps of lines 1e and 1k) and the research limitation; Form 8582-CR and this form would read the first step.
