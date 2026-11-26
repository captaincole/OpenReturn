# Form 4563: open questions

Form 4563 keeps a bona fide resident of American Samoa's income from there off Form 1040. The engine reads one answer fact per person (`facts/kinds/americanSamoaExclusion.ts`). The instructions are `irs-4563-form-2025`. Pub. 570 is not in the corpus; its 2025 web text was read on 2026-11-26.

## 1. Excluded income is never on the return

- Text: "You must report on your tax return your worldwide income for the tax year that does not qualify for the exclusion" (`filing-form-1040-or-1040-sr::b01`).
- Default: the fact holds the qualifying income; it is never a W-2 or 1099 fact. A Form W-2AS is read into the fact, not as a W-2.
- Dollars: no, if Cade records each document once.

## 2. One Form 4563 for each person

- Text: the header asks for "Your social security number"; Part I is one person's residence (`face-header::b01`, `face-part-i::b01`). No text says how spouses file.
- Default: one copy per person, the taxpayer first, as Form 2555. A spouse's fact counts on a joint return only.
- Dollars: no.

## 3. Line 1 "ended" for a residence that goes on

- Text: none. Form 2555 line 10 asks for "Continues".
- Default: "Continues".
- Dollars: no.

## 4. Line 6 column (c): which days count

- Text: "Number of days absent" (the form). Pub. 570, chapter 1: a day is a day of presence when "you are physically present in that territory at any time during the day".
- Default: the full days between the day of leaving and the day of return, and only those in 2025 (the form: "days absent ... during the tax year"). A trip from March 10 to March 24 is 13 days; one from December 20, 2025 to January 3, 2026 is 11.
- Dollars: no.

## 5. More than four absences

- Text: line 6 has four rows; the instructions say nothing more.
- Default: every line 6 field is unsupported with five or more absences.
- Dollars: no.

## 6. A loss on lines 10 to 13

- Text: line 15 is "Add lines 7 through 14" (the form).
- Default: a loss prints as a negative amount and line 15 adds it. The add-backs take line 15 as it is.
- Dollars: yes, for a person with a net loss from American Samoa sources.

## 7. Gross income for the deduction fraction

- Text: Pub. 570 shares the standard deduction by "Gross income subject to U.S. income tax / Gross income from all sources", and gross income from a business is "Schedule C, line 7" (Table 4-1, note **).
- Default: the fact holds each net amount and its gross income. The U.S. side is Form 1040 lines 1z to 8 when each is gross income as it prints. With a Schedule C, E or F amount, Form 4797, a Schedule D, an NOL or Form 2555, line 12e is unsupported.
- Dollars: yes, for those returns.

## 8. The note above line 9

- Text: Pub. 570: "In the space above line 9, enter 'Standard deduction modified due to income excluded under section 931'".
- Default: Form 1040 has no field for it; the engine does not print it.
- Dollars: no.

## 9. Lines that share a deduction the engine does not share

- Text: "Deductions and credits that are not definitely related to a particular type of income must be allocated" (`filing-form-1040-or-1040-sr::b01`). Pub. 570 names alimony, the standard deduction and the itemized deductions.
- Default: the standard deduction is shared. Schedule A lines 5e and 17, Form 1040 line 12e with itemized deductions or a disaster loss increase, and Schedule 1 line 19a are unsupported.
- Dollars: yes, for those returns.

## 10. Student loan interest is not shared

- A DECISION, row A68 of `docs/rule-decisions.md`, in `schedule-1/studentLoanInterest.ts`.

## 11. Deductions and credits definitely related to the excluded income

- Text: "you cannot take any deduction or credit on your tax return that is definitely related to the excluded income" (`filing-form-1040-or-1040-sr::b01`).
- Default: the engine cannot tell which deduction or credit is related. Every deduction and credit on the return is taken as related to U.S. income. Cade must not record an expense of the excluded income.
- Dollars: yes, if one is recorded.

## 12. Self-employment tax on excluded income

- Text: "you will generally have to pay self-employment tax on those earnings even though you can exclude the earnings ... Use Schedule SE" (`filing-form-1040-or-1040-sr::b02`).
- Default: lines 10 and 13 are the self-employment income. With $400 or more of net earnings, or next to a Schedule SE, Schedule 2 lines 4 and 21 and Form 1040 lines 23 and 24 are unsupported; next to a Schedule SE so is Schedule 1 line 15.
- Dollars: yes. See the proposals below.

## 13. Additional Medicare Tax on W-2AS wages

- Text: Form 8959 counts a Form W-2AS as a Form W-2 (`irs-8959-inst-2025::sec::future-developments::b01`).
- Default: when W-2AS box 5, the return's W-2 box 5 and the self-employment income pass the threshold, Schedule 2 lines 11 and 21 and Form 1040 lines 23 and 24 are unsupported. Additional Medicare Tax withheld on a W-2AS is not read.
- Dollars: yes, above the threshold.

## 14. The simple foreign tax credit with Form 4563

- Text: the Form 1040 instructions: the election needs "You aren't filing Form 4563" (`irs-1040-inst-2025::sec::specific-instructions-2::b01`). Form 1116's own list does not name it.
- Default: Form 1116's decision stands (its QUESTIONS.md, item 16). Form 1116 line 12 is unsupported with Form 4563.
- Dollars: yes, rarely.

## 15. Earned income of excluded wages

- Text: none in the Form 4563 instructions.
- Default: excluded wages are not earned income on Schedule 8812 Part II-A, Form 2441 or Schedule EIC. The EIC needs a main home in the United States, which American Samoa is not (Pub. 570, chapter 4).
- Dollars: possibly, for the additional child tax credit.

## Proposals for a discussion

- **Excluded self-employment income on Schedule SE.** The excluded business would be a Schedule C (and a farm a Schedule F) marked "American Samoa". Schedule 1 lines 3 and 6 would leave it out, Schedule SE would keep it, and Schedule 1 line 15 would take the share Pub. 570 gives. This changes how Schedule C reaches Form 1040.
- **Shared itemized deductions.** Schedule A lines 1, 5a to 5c, 8a to 8c, 11 and 12 would take their share by gross income (Pub. 570, Itemized Deductions example), and the SALT worksheet line 3d would add Form 4563 line 15.
- **W-2AS as a document.** A W-2AS could be a W-2 fact with a territory mark, so Form 8959 reads boxes 5 and 6 and Form 4563 line 7 reads box 1.

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
| Line 15 on Schedule 1-A, Schedule 8812, Forms 8863, 8839, 8815, 8936 | stated rule |
| Line 15 on the Pub. 970 and Pub. 915 worksheets | stated rule |
| Schedule A, alimony, self-employment and Additional Medicare lines | unsupported |
