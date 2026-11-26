# Form 8863 — open questions

Each item is a place where the form and its instructions do not settle a rule. It gives the text, the block id, the default the engine applies, and whether the default can change a dollar amount. Block ids are in `irs-8863-inst-2025` unless named.

## 1. Part I with no American opportunity student

- Text: line 1 "enter the total of all amounts from all Parts III, line 30" (blank form; `part-i-refundable-american::b01`). The form has no "if zero" rule for Part I.
- Default: when no student completes lines 27–30, lines 1–9 stay blank. Credit Limit Worksheet line 2 reads 0.
- Other reading: the blind fill (Form 8863 batch check) printed line 1 as 0, figured lines 4 and 6 (for example 3,750 and 0.375), and printed 0 on lines 7–9. The line 1 instruction speaks only to a filer "claiming the American opportunity credit" (`part-i-refundable-american::b01`), and line 10, not line 1, has an "If zero" rule. The text does not settle it; the engine keeps Part I blank.
- Changes dollars: no. Line 4 and line 15 use the same MAGI and limit, so Part II and line 19 are the same either way.

## 2. The stops on lines 4 and 15

- Text: line 4 "If zero or less, stop; you can't take any education credit". Line 15 "If zero or less, skip lines 16 and 17, enter -0- on line 18".
- Default: the engine cannot un-file a form. Line 4 prints 0 and lines 5–9 stay blank. Part II runs on its own: line 15 has the same MAGI and limit, so it prints 0 and line 18 is 0. Line 19 is then 0.
- Other reading: the blind fill left lines 10–19 blank after the line 4 stop. The credit is $0 either way.
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
- Default: with Form 4563 filed, lines 3 and 14 add its line 15 (every copy). With Form 2555 filed, lines 3–9 and 11–19 are unsupported (lines 11 and 12 come with the part), and so are Form 1040 line 29 and Schedule 3 line 3. No fact holds a Puerto Rico exclusion, so the engine cannot see one.
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

## 16. "Full-time student" on line 7

- Text: condition 1c reads "a full-time student (defined later)" (`line-7::b02`). The definition opens "Solely for purposes of determining whether a scholarship is considered support, you were a full-time student for 2025 if during any part of any 5 calendar months during the year you were enrolled as a full-time student" (`line-7::b05`). Pub. 970 gives the same 5-month test without "solely".
- Default: question 3 uses the 5-month test (the `fullTimeStudent` answer). The blind fill made the same choice.
- Changes dollars: yes. It moves the refundable 40% (line 8) to line 9 for a filer aged 19–23.

## 17. Tax-free assistance larger than one period's expenses

- Text: the worksheet is "a separate worksheet for each student for each academic period", and line 4 reads "If zero or less, enter -0-" (`adjusted-qualified-education-expenses::b01`). Line 2a is assistance "allocable to the academic period".
- Default: each period floors at 0 on its own, so the excess of one period does not reduce another period's expenses. The blind fill made the same choice.
- Changes dollars: yes, when a scholarship for one term is larger than that term's expenses and another term (such as a prepaid period that begins in the first 3 months of 2026) has expenses.

## 18. Course materials and the lifetime learning credit

- Text: "Lifetime learning credit: Qualified education expenses include amounts paid for books, supplies, and equipment only if required to be paid to the institution as a condition of enrollment or attendance" (`qualified-education-expenses::b01`).
- Default: `courseMaterialsPaid` counts for the American opportunity credit only. Materials that must be paid to the school belong in `tuitionAndFeesPaid`. The blind fill made the same choice.
- Changes dollars: yes, if materials that must be paid to the school are stated as course materials.

## Second opinions

- **PolicyEngine-US 2.152.16** (commit 794e17e6), `variables/gov/irs/credits/education/` and `parameters/gov/irs/credits/education/`.
  - Same: the MAGI limits and phase-out ranges ($80,000 + $10,000; $160,000 + $20,000 joint); the American opportunity tiers (100% of the first $2,000, 25% of the next $2,000); 40% refundable; the lifetime learning $10,000 cap and 20% rate; no credit on a separate return; the American opportunity student tests (degree program and half-time, first 4 years, fewer than 4 earlier claims, no felony drug conviction); an American opportunity student never adds to the lifetime learning expenses; the worksheet's earlier credits (Schedule 3 lines 1, 2 and 6d; 6l not modeled there).
  - Differs, form decides, no change:
    - Line 7: PolicyEngine makes 40% refundable for every filer. The form takes the refundable part away from a filer under 24 who meets conditions 1, 2 and 3 (`line-7::b02`). The engine follows the form; PolicyEngine lacks this rule.
    - Lines 6 and 17: PolicyEngine uses the exact ratio. The form rounds it "to at least three places" (item 4); at most $1.
    - Lines 3 and 14: PolicyEngine adds back the section 911, 931 and 933 exclusions. The engine adds the section 931 exclusion (Form 4563 line 15) and makes the lines unsupported with Form 2555 (item 10). This is the same rule, with the engine's gap stated.
    - Worksheet line 4: PolicyEngine uses its tax before credits. The form says Form 1040 line 18 (`credit-limit-worksheet::b01`). The engine fills the form.
    - The order: PolicyEngine limits the American opportunity part first, then the lifetime learning credit. The worksheet limits their sum (line 3). The total is the same.
    - Who cannot claim: PolicyEngine holds a dependency bar and a bar after a denied or reckless claim (`american-opportunity-credit::b01`: "Don't claim the American opportunity credit for 2 years after there was a final determination that your claim was due to reckless or intentional disregard of the rules or 10 years after..."). No engine fact holds either; Cade asks (item 8). The improper-claim bar and Form 8862 are not modeled.
    - Rounding: PolicyEngine does not round to whole dollars. The engine rounds by form line (line 29, lines 7, 8, 12 and 18).
- **IRS Direct File**: the repo names no checkout of it (issue #140 is open), so it was not compared.

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
| Lines 3–9 and 11–19 with Form 2555; line 19 with foreign tax, Form 1116 or 8978 | unsupported |
