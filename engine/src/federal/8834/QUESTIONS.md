# Form 8834 — doubts and defaults

Form 8834 now only claims a qualified electric vehicle credit from a passive activity: a credit for a vehicle placed in service before 2007 that an earlier Form 8582-CR did not allow. The engine fills it for an individual. The form and its instructions (Rev. October 2024) publish no example with numbers, and no prior revision with this layout has one. The synthetic couple `ronde` is the scenario; `tests/unit/federal/8834/` holds the limit tests.

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

## Doubts with no conflicting text

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
- Done: when Form 8582-CR allows none, line 1 is 0 and the form leaves the return (`filesOnlyWithAmountOn`). Schedule 3 line 6i is blank. Form 6251 still files: its resolver cannot see line 1 (a known gap, as for Form 8911).
- Changes dollars: no.

### 5. Line 2 and Form 8621

- Source: line 2 is "the sum of the amounts from Form 1040 ... line 16; and Schedule 2 (Form 1040), line 1z" (`face-page-1::b01`). Form 3800 line 7 leaves out a Form 8621 tax; this form says nothing of it.
- Done: the form's words, with no Form 8621 change.
- Changes dollars: only with a section 1291 tax on the return.

### 6. Part VI of Form 8582-CR for this credit

- Source: Part VI lets a taxpayer who disposed of an activity raise the basis of credit property by the unallowed credit (`irs-8582cr-inst-2025::sec::line-38::b01`).
- Done: the fact has no election. A vehicle placed in service before 2007 is fully depreciated, and its basis election would not change the form.
- Changes dollars: no for this form.

## Proposals for a discussion

- **A current-year passive Form 3800 credit next to this credit.** Before: line 1 is unsupported. Form 8582-CR shares its allowed credit among all passive credits, and the engine figures Form 3800's current-year credits after its Part II tax lines, whose line 10b subtracts this credit (and Form 8911's line 3 reads its line 6b, which subtracts it too). After: Form 3800 would split its current credits into a step with no tax read (the stated amounts, the caps of lines 1e and 1k) and the research limitation; Form 8582-CR and this form would read the first step.
