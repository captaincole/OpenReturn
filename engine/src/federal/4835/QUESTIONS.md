# Form 4835: open questions

Each place where the form and its instructions do not settle a rule, sorted in three groups. The one conflict between two texts is a `DECISION` comment in `lines.ts` and row A33 of `docs/rule-decisions.md`.

## Two texts conflict

### Line 10: the base of the 25% limit (row A33)

- Source: Form 4835 line 10 limits the deduction to "25% of your gross income from farming" (irs-4835-inst-2025::sec::line-10::b01); Pub. 225 defines that income as "the income you derive in the business of farming from the production of crops, fish, fruits, other agricultural products, or livestock" (irs-pub-225-2025::sec::assessment-for-depreciable::b07).
- Decided: all of line 7, plus the gains from draft, breeding or dairy livestock. See the `DECISION` comment in `lines.ts`.
- Changes dollars: only when the limit binds ($288 in `jasin`).

## Should we do this now

### 1. Who files Form 8582 for a farm rental with income

- Source: "Note: You may need to include information from Form 4835 on Form 8582 even if you have a net profit" (irs-4835-inst-2025::sec::line-32::b02). Form 8582 files for anyone with passive activity deductions (irs-8582-inst-2025::sec::who-must-file::b01).
- Default: a farm rental does not make Form 8582 file. With net income and no other passive activity, the form would allow every deduction, so no amount changes. When Form 8582 files for another reason, a passive farm rental's line 32 is unsupported (item 8).
- Not now: it needs Form 8582 to take a Form 4835 activity (the first proposal below).

### 2. Line 10: the 25% limit with other farming

- Source: "The total deduction for conservation expenses in any tax year is limited to 25% of your gross income from farming for that year" (irs-pub-225-2025::sec::assessment-for-depreciable::b07).
- Default: when Schedule F files, a Schedule K-1 has gross farming income, or another farm rental is on the return, and the farm rental claims conservation costs, line 10 is unsupported.
- Not now: the limit is on all farming, and no text says how it is split among the forms.

### 3. Line 10: the carryover to 2026

- Source: "The $2,000 excess ($10,000 − $8,000) is carried over to 2026" (irs-pub-225-2025::sec::assessment-for-depreciable::b09).
- Default: the engine figures the excess (`conservationCarryforward`), but no line prints it. Next year Cade records it as `conservationCarryover`.
- Not now: no line of the 2025 form holds it, and no dollars change this year.

### 4. Line 10: the conservation plan

- Source: the expenses "can be deducted only if they are consistent with a conservation plan approved by the Natural Resources Conservation Service" (irs-4835-inst-2025::sec::line-10::b01).
- Done: the fact holds only expenses that meet the plan rule; Cade asks. No field records the plan, and no dollars change.

### 5. Line 4c: a loss on a forfeited CCC loan under the election

- Source: "If you did elect to report the loan proceeds as income, you generally won't have an entry on line 5c. But if the amount forfeited is different from your basis in the commodity, you may have an entry on line 5c" (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b03).
- Default: a gain prints on line 4c. The gain is the forfeited amount less the basis, because the forfeiture "is treated for tax purposes as a sale of the crops" (irs-pub-225-2025::sec::use-form-w-4v-see-how-to-get-tax::b02). The blind fill read it the same way ($5,000 − $4,200 = $800).
- Not now: a forfeited amount below the basis makes the whole form unsupported, because the text does not say whether line 4c takes a negative amount.

### 6. Line 3b: what is not taxable

- Source: "don't report the market gain shown on Form CCC-1099-G on line 4b if you elected to report CCC loan proceeds as income" (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b01).
- Done: line 3b is line 3a less the market gain under the election, and less the cost-sharing payments the owner excludes (`excludedCostSharing`). Cade checks the section 126 exclusion; the engine does not figure it.

### 7. The Schedule E exception

- Source: the exception needs, among others, an overall net loss of $25,000 or less and MAGI of $100,000 or less (irs-1040se-inst-2025::sec::exception-for-certain-rental-real-estate-activities::b01).
- Done: the decision `decisions.scope.must_file_8582` = false says the conditions are met, as on Schedule E line 22. With line A No, line 34c is unsupported. The engine does not test the conditions itself.

### 8. Lines that need Form 8582 or Form 6198

- Source: "If you checked box 34b, you must complete Form 6198 ... before you complete Form 8582" (irs-4835-inst-2025::sec::line-34::b01); "Use Form 8582 to figure the amount of prior year unallowed passive activity losses you may include on line 32" (irs-4835-inst-2025::sec::line-32::b01).
- Default: unsupported in each of these cases: box 34b; a prior-year unallowed loss; a passive loss while Form 8582 files; net income from a passive farm rental while Form 8582 files.
- Supported: a real estate professional who materially participated; a passive loss with Form 8582 decided not to file (the Schedule E exception) and active participation.
- Not now: Form 8582 and Form 6198 do not take a Form 4835 activity (the proposals below).

### 9. Line 12 and Form 4562

- Source: "Enter your depreciation and section 179 expense deduction. For details, including whether you must file Form 4562" (irs-4835-inst-2025::sec::line-12::b01).
- Default: line 12 is the stated amount. The farm's assets are not linked to Form 4562, and Form 4835 does not make Form 4562 file.
- Not now: no dollars change; the link waits for Form 4562 to take a farm activity.

### 10. Other forms that do not read the farm rental

- The qualified business income deduction (Form 8995, Form 1040 line 13a) does not take the farm rental, so line 13a is blank for `jasin`. A crop-share rental can be a trade or business for section 199A; the engine does not ask. See the QBI proposal below.
- Form 461 shows a gap when Form 4835 files. Form 8960 takes the farm rental through Schedule 1 line 5 as rental income.
- California's FTB 3801 files for a farm rental only with a passive loss, or a gap that may hide one (a prior-year unallowed loss). It then shows its farm gap. Net income from a farm rental does not file it (ca-3801-inst-2025::sec::b-who-must-file::b01).
- Lines 19a and 19b: the business interest limit (Form 8990) is not applied.
- A joint farm rental on a separate return makes the whole form unsupported: the fact does not hold the taxpayer's share.
- Not now: each needs a change to another form.

### 11. Lines 5a to 5d: a deferral of part of the crop insurance

- Source: "Generally, if you elect to defer any eligible crop insurance proceeds, you must defer all such crop insurance proceeds (including federal crop disaster payments)" (irs-4835-inst-2025::sec::lines-5a-through-5d::b01); the Schedule F lines 6a to 6d text in the next block adds "from a single trade or business" (irs-4835-inst-2025::sec::lines-5a-through-5d::b02).
- Done: line 5b is line 5a less the stated `cropInsuranceDeferredTo2026`. Cade asks for the eligible amount; part of a payment can be ineligible (Pub. 225, chapter 3). The blind fill read a partial amount the same way.

### 12. Line 7 with no income

- Source: "Add amounts in the right column for lines 1 through 6" (the form face). Nothing says whether a total of no amounts prints 0 or blank.
- Done: line 7 is blank when lines 1 to 6 are all blank (`sumOrBlank`); line 32 and line 10 read it as 0. The blind fill printed 0. No dollars change.

### 13. More than one farm rental

- Source: Form 4835 is one farm's form (line A: "this farm", irs-4835-inst-2025::sec::face-header::b01), and Schedule E line 40 is the "Net farm rental income or (loss) from Form 4835" (irs-1040se-face-2025::sec::face-part-v::b01).
- Done: each farm rental fact prints its own copy (the copies mechanism, `farmTotals.ts`). Schedule E line 40 adds each copy's line 32 or 34c, line 42 each line 7, and line 43 the farms a real estate professional materially participated in.

### 14. Form 4835 decided with no farm rental fact

- Done: every line of the form, and Schedule E lines 40 and 41, are unsupported ("no farm rental fact gives its amounts"), so the return names the gap. FTB 3801 files with its farm gap in that case on a California return.

## Pattern change

### Farm documents linked to a farm

- Before: the farm rental fact holds the amounts the owner states from Form 1099-PATR (line 2a), Form 1099-G box 7 and Form CCC-1099-G (line 3a); the engine's Form 1099-G fact is not linked to any farm.
- After: each farm document fact names the farm it belongs to, and Form 4835 and Schedule F read the document amounts from it. See the third proposal below.

## Second opinions

- **PolicyEngine-US 2.154.0 (commit 363e9fc5e4).** It models Form 4835 only as one input, `farm_rent_income`, the net amount on Schedule E line 40. It has no formula for any line of Parts I and II, no conservation limit and no CCC rules, so no constant or line formula could be compared. It counts the net amount in net investment income (the engine agrees, through Schedule 1 line 5), in qualified business income and in the section 461(l) business loss limit. The engine does not take the farm rental on Form 8995 or Form 461 (item 10); those are scope gaps already listed, not differences in a rule.
- **IRS Direct File:** not compared. The repository names no checkout of it, and its scope has no farm income.

## Proposals for a discussion

- **Form 8582 takes a Form 4835 activity.** Add the farm rental to Form 8582's activities as Schedule E's properties are (`federal/8582/activities.ts`): Part IV with active participation, Part V without, and its allowed loss on line 34c and Schedule E line 40. This changes how Form 8582 collects activities, so it waits for a discussion. It would support items 1 and 8.
- **Form 6198 takes a Form 4835 activity.** The at-risk amounts would sit on the farm rental fact, as a Schedule C business keeps them (`facts/kinds/atRisk.ts`). It would support box 34b.
- **Farm documents linked to a farm.** Form 1099-PATR, Form 1099-G box 7, Form CCC-1099-G, Form 1099-A and Form 1099-MISC box 9 go to a farm activity, on Form 4835 or Schedule F. A shared link from the document fact to the farm would let both forms read the documents. This is a new family of input documents, shared with Schedule F.
- **The farm rental in the QBI deduction.** Add a `qualifiedBusiness` answer to the farm rental fact, as a Schedule E property has, and let the QBI layer (`federal/qbi/`) take Schedule E line 40's amount for a farm that is a trade or business. Today line 13a is blank for a farm rental, which understates the deduction when the farm qualifies (20% of `jasin`'s $21,812 would be $4,362).

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, line A | Stated rule |
| Line 1 | Stated rule |
| Lines 2a, 2b | Stated rule |
| Lines 3a, 3b | Published example with numbers (Pub. 225, Mike Green) |
| Lines 4a to 4c | Stated rule; a forfeiture loss under the election is unsupported |
| Lines 5a to 5d | Stated rule |
| Line 6 | Published example (Pub. 225 Table 3-3), no numbers |
| Line 7 | Stated rule (the form's arithmetic) |
| Lines 8, 9, 11 to 29 | Stated rule (stated amounts) |
| Line 10 | Published example with numbers (Pub. 225, $32,000 and $100,000); own reading of the base (row A33); unsupported with other farming |
| Lines 30a to 30g | Stated rule (the 263A row); more rows than the form holds is unsupported |
| Line 31 | Stated rule |
| Line 32 | Stated rule; unsupported with a prior-year loss or a passive farm rental on Form 8582 |
| Lines 34a, 34b | Stated rule |
| Line 34c | Stated rule for a professional and the Schedule E exception; unsupported with Form 8582 or Form 6198 |
| Schedule E lines 40 to 43 | Stated rule; one copy of Form 4835 for each farm rental |
