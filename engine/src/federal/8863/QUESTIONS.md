# Form 8863 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount. Block ids are in `irs-8863-inst-2025` unless named.

## 1. Part I with no American opportunity student

- Text: line 1 "enter the total of all amounts from all Parts III, line 30" (blank form; `part-i-refundable-american::b01`). The form has no "if zero" rule for Part I.
- Default: when no student completes lines 27–30, lines 1–9 stay blank. Credit Limit Worksheet line 2 reads 0.
- Changes dollars: no.

## 2. The stops on lines 4 and 15

- Text: line 4 "If zero or less, stop; you can't take any education credit". Line 15 "If zero or less, skip lines 16 and 17, enter -0- on line 18".
- Default: the engine cannot un-file a form. Line 4 prints 0 and lines 5–9 stay blank. Part II runs on its own: line 15 has the same MAGI and limit, so it prints 0 and line 18 is 0. Line 19 is then 0.
- Changes dollars: no.

## 3. Credit Limit Worksheet line 6 below zero

- Text: "6. Subtract line 5 from line 4. 7. Enter the smaller of line 3 or line 6" (`credit-limit-worksheet::b01`).
- Default: line 6 is -0- when line 5 is more than line 4, so line 19 is never negative.
- Changes dollars: no. Schedule 3 lines 1, 2 and 6d are each limited by the tax, so their total does not pass line 4 in practice.

## 4. Lines 6 and 17: how many places

- Text: "Enter the result as a decimal (rounded to at least three places)".
- Default: three places, half up. Pub. 970's examples use exact fractions (0.75, 0.95) that three places keep.
- Changes dollars: at most $1 on line 7 or 18 against a preparer who keeps more places.

## 5. Tax-free assistance and the Form 1098-T box 5

- Text: "Generally, any scholarship or fellowship grant is treated as tax-free educational assistance" unless the student includes it in income (`adjusted-qualified-education::b02`). The worksheet reduces each academic period by the assistance "allocable to the academic period" (`adjusted-qualified-education-expenses::b01`).
- Default: the engine does not read box 5. Each academic period states its tax-free assistance (`taxFreeAssistance`, required, 0 when none). The student's choice to include a scholarship in income is in that stated number.
- Changes dollars: yes, if the stated amount is wrong.

## 6. Amounts paid, not box 1

- Text: "use only the amounts you actually paid (plus any amounts you're treated as having paid) in 2025" (`qualified-education-expenses::b02`).
- Default: worksheet line 1 is the stated tuition and fees paid, plus course materials for the American opportunity credit. Box 1 is not read.
- Changes dollars: no (this follows the text).

## 7. Student requirements the form does not ask

- Text: requirement 5 (a TIN by the due date), 6 (a 2025 Form 1098-T, or the request procedure) and 7 (the EIN on Form 8863) (`american-opportunity-credit::b05`, `b06`).
- Default: the engine gates the American opportunity credit on lines 23–26 only. A missing EIN where line 22(4) asks for it makes that line wait, and the form asks for the student fact again. A "No" on line 22(2) for every institution does not block the credit: the request procedure (`future-developments::b03`) is Cade's question.
- Changes dollars: yes, for a student with no Form 1098-T whose filer did not follow the procedure.

## 8. Who cannot claim a credit

- Text: a filer claimed as a dependent, or a nonresident alien for part of 2025 who did not elect resident status, cannot claim a credit (`who-can-claim-an-education-credit::b03`; irs-1040-inst-2025::sec::line-3-2::b01).
- Default: no fact holds either. Cade asks before he records a student fact. Married filing separately is checked: the form does not file, and with an explicit decision lines 2–9 and 11–19 are unsupported.
- Changes dollars: yes, if Cade records a student for such a filer.

## 9. The ages on line 7

- Text: "under age 24 at the end of 2025", "under age 18", "age 18", "over age 18" (`line-7::b02`). The 8863 instructions do not say how a January 1 birthday counts.
- Default: the kiddie-tax rule for the same ages: "A child born on January 1, 2008, is considered to be age 18 at the end of 2025" (irs-1040-inst-2025::sec::tax-table-or-tax-computation-work::b02). Born before January 2, 2002 is 24 or older.
- Changes dollars: yes, only for a filer born on January 1, 2002, 2007 or 2008 (the refundable part moves to line 9).

## 10. MAGI add-backs

- Text: with Form 2555 or 4563, or income excluded from Puerto Rico, add the excluded income to line 11b (`line-3::b01`, `line-14::b01`; Pub. 970 Worksheets 2-1 and 3-1).
- Default: with Form 2555 or 4563 filed, lines 3–9 and 11–19 are unsupported (lines 11 and 12 come with the part), and so are Form 1040 line 29 and Schedule 3 line 3. No fact holds a Puerto Rico exclusion, so the engine cannot see one.
- Changes dollars: yes, for those filers only.

## 11. Who files: AGI from facts, and a lone Form 1098-T

- Text: no credit when MAGI is $90,000 or more ($180,000 joint) (`who-can-claim-an-education-credit::b03`). "To be eligible ... the law requires a taxpayer (or a dependent) to have received Form 1098-T" (`future-developments::b01`).
- Default: a student fact or a Form 1098-T files the form, unless the least AGI the facts allow (`agiFloor`, as Form 8880 does) is already at the limit. A Form 1098-T that no student fact names asks for that student (`education.credit_student.<slug>`, the slug of the 1098-T key), and the totals wait. `decisions.scope.must_file_8863 = false` turns the form off for a student the filer does not claim.
- Changes dollars: no; it changes what Cade asks.

## 12. Worksheet line 5 credits the engine does not compute

- Text: line 5 adds Schedule 3 lines 1, 2, 6d and 6l (`credit-limit-worksheet::b01`).
- Default: Schedule 3 lines 1 and 6l have no rules. Line 19 and Schedule 3 line 3 are unsupported when a 1099 shows foreign tax paid, or Form 1116 or 8978 files. A gap in Form 8863 reads as 0 in the other credit worksheets that add Schedule 3 line 3 (Forms 8880, 8396, 8839, 5695 and Schedule 8812), as their other Schedule 3 gaps do.
- Changes dollars: yes, for those filers only.

## 13. A third institution

- Text: "If the student attended more than two educational institutions, attach an additional page 2 completed only through line 22" (`line-22::b01`).
- Default: each later copy appends page 2 only. A continuation page repeats the header, the student's name and SSN (lines 20–21), and the next two institutions; lines 23–31 stay blank.
- Changes dollars: no.

## 14. Rounding the adjusted expenses

- Text: "include cents when adding the amounts and round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
- Default: each period's worksheet line 4 keeps its cents; the student's total rounds once, then line 27 caps it at $4,000. Line 1 and line 10 add whole-dollar Part III lines.
- Changes dollars: at most $1 on line 27 or 31.

## 15. Which credit for a student

- Text: "If you can choose ... the American opportunity credit will always be greater than the lifetime learning credit" (`american-opportunity-credit::b01`); line 26 "No—Complete lines 27 through 30".
- Default: a student who passes lines 23–26 takes the American opportunity credit; no fact chooses the lifetime learning credit instead.
- Changes dollars: no.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (names, SSN), lines 20–21 | stated rule |
| Line 22 (institutions, 1098-T answers, EIN) | stated rule; the EIN gate is a stated rule, requirement 6 is own reading (item 7) |
| Lines 23–26 | published example (Sharon and Wilbert, no dollars) and stated rule |
| Lines 27–30 | published examples with numbers (Pub. 970 Jack and Kay, Bill, Jane; 8863 inst. Example 2) |
| Line 31 | published examples with numbers (Pub. 970 Judy, recapture examples) |
| Lines 1–6, 10–17 | published examples with numbers (Pub. 970 phase-out examples); line 6 places own reading (item 4) |
| Line 7 box, lines 7–9 | published examples with numbers (Bill, Jane); the line 7 questions are a stated rule; ages own reading (item 9) |
| Lines 18–19, Credit Limit Worksheet | published examples with numbers (Bill, Jane, Judy); line 6 floor own reading (item 3) |
| Form 1040 line 29, Schedule 3 line 3 | stated rule |
| Lines 3–9 and 11–19 with Form 2555 or 4563; line 19 with foreign tax, Form 1116 or 8978 | unsupported |
