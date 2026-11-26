# Form 4835: open questions

Each place where the form and its instructions do not settle a rule. Short answers; a person decides. The one conflict between two texts is a `DECISION` comment in `lines.ts` and row A33 of `docs/rule-decisions.md`.

## 1. Who files Form 8582 for a farm rental with income

- Source: "Note: You may need to include information from Form 4835 on Form 8582 even if you have a net profit" (irs-4835-inst-2025::sec::line-32::b02). Form 8582 files for anyone with passive activity deductions (irs-8582-inst-2025::sec::who-must-file::b01).
- Default: a farm rental does not make Form 8582 file. With net income and no other passive activity, the form would allow every deduction, so no amount changes. When Form 8582 files for another reason, a passive farm rental's line 32 is unsupported (item 8).
- Changes dollars: no, in the case the engine fills.

## 2. Line 10: the 25% limit with other farming

- Source: "The total deduction for conservation expenses in any tax year is limited to 25% of your gross income from farming for that year" (irs-pub-225-2025::sec::assessment-for-depreciable::b07).
- Default: when Schedule F files, or a Schedule K-1 has gross farming income, and the farm rental claims conservation costs, line 10 is unsupported. The limit is on all farming, and no text says how it is split among the forms.
- Changes dollars: yes, for that case only.

## 3. Line 10: the carryover to 2026

- Source: "The $2,000 excess ($10,000 − $8,000) is carried over to 2026" (irs-pub-225-2025::sec::assessment-for-depreciable::b09).
- Default: the engine figures the excess (`conservationCarryforward`), but no line prints it. Next year Cade records it as `conservationCarryover`.
- Changes dollars: no, this year.

## 4. Line 10: the conservation plan

- Source: the expenses "can be deducted only if they are consistent with a conservation plan approved by the Natural Resources Conservation Service" (irs-4835-inst-2025::sec::line-10::b01).
- Default: the fact holds only expenses that meet the plan rule; Cade asks. No field records the plan.
- Changes dollars: no.

## 5. Line 4c: a loss on a forfeited CCC loan under the election

- Source: "If you did elect to report the loan proceeds as income, you generally won't have an entry on line 5c. But if the amount forfeited is different from your basis in the commodity, you may have an entry on line 5c" (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b03).
- Default: a gain prints on line 4c. A forfeited amount below the basis makes the whole form unsupported: the text does not say whether line 4c takes a negative amount.
- Changes dollars: yes, for that case only.

## 6. Line 3b: what is not taxable

- Source: "don't report the market gain shown on Form CCC-1099-G on line 4b if you elected to report CCC loan proceeds as income" (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b01).
- Default: line 3b is line 3a less the market gain under the election, and less the cost-sharing payments the owner excludes (`excludedCostSharing`). Cade checks the section 126 exclusion; the engine does not figure it.
- Changes dollars: yes, through the stated amounts.

## 7. Cooperative and program payment documents

- Source: line 2a is "as shown on Form 1099-PATR" (irs-4835-inst-2025::sec::lines-2a-and-2b::b01); program payments are "usually reported to you on Form 1099-G" (irs-1040sf-inst-2025::sec::lines-4a-and-4b::b01).
- Default: the farm rental fact holds the amounts the owner states from those forms. The engine has a Form 1099-G fact (box 7), but no fact links it to a farm, and Schedule F needs the same link. See the proposal below.
- Changes dollars: no.

## 8. Lines that need Form 8582 or Form 6198

- Source: "If you checked box 34b, you must complete Form 6198 ... before you complete Form 8582" (irs-4835-inst-2025::sec::line-34::b01); "Use Form 8582 to figure the amount of prior year unallowed passive activity losses you may include on line 32" (irs-4835-inst-2025::sec::line-32::b01).
- Default: unsupported in each of these cases: box 34b; a prior-year unallowed loss; a passive loss while Form 8582 files; net income from a passive farm rental while Form 8582 files.
- Supported: a real estate professional who materially participated; a passive loss with Form 8582 decided not to file (the Schedule E exception) and active participation.
- Changes dollars: yes, for those cases only.

## 9. The Schedule E exception

- Source: the exception needs, among others, an overall net loss of $25,000 or less and MAGI of $100,000 or less (irs-1040se-inst-2025::sec::exception-for-certain-rental-real-estate-activities::b01).
- Default: the engine does not test these conditions. The decision `decisions.scope.must_file_8582` = false says they are met, as on Schedule E line 22. With line A No, line 34c is unsupported.
- Changes dollars: yes, if the decision is wrong.

## 10. Line 12 and Form 4562

- Source: "Enter your depreciation and section 179 expense deduction. For details, including whether you must file Form 4562" (irs-4835-inst-2025::sec::line-12::b01).
- Default: line 12 is the stated amount. The farm's assets are not linked to Form 4562, and Form 4835 does not make Form 4562 file.
- Changes dollars: no.

## 11. Other places the farm rental is not read

- The qualified business income deduction (Form 8995) and Form 461 do not take the farm rental. Form 461 shows a gap when Form 4835 files. Form 8960 takes it through Schedule 1 line 5 as rental income.
- California's FTB 3801 shows its farm gap when Form 4835 files, by the fact or by the decision.
- Lines 19a and 19b: the business interest limit (Form 8990) is not applied.
- A joint farm rental on a separate return, and more than one farm rental, make the whole form unsupported.

## Proposals for a discussion

- **Form 8582 takes a Form 4835 activity.** Add the farm rental to Form 8582's activities as Schedule E's properties are (`federal/8582/activities.ts`): Part IV with active participation, Part V without, and its allowed loss on line 34c and Schedule E line 40. This changes how Form 8582 collects activities, so it waits for a discussion. It would support items 1 and 8.
- **Form 6198 takes a Form 4835 activity.** The at-risk amounts would sit on the farm rental fact, as a Schedule C business keeps them (`facts/kinds/atRisk.ts`). It would support box 34b.
- **Farm documents linked to a farm.** Form 1099-PATR, Form 1099-G box 7, Form CCC-1099-G, Form 1099-A and Form 1099-MISC box 9 go to a farm activity, on Form 4835 or Schedule F. A shared link from the document fact to the farm would let both forms read the documents. This is a new family of input documents, shared with Schedule F.

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
| Schedule E lines 40 to 43 | Stated rule |
