# Form 4255: open questions

Each place where the form and its instructions do not settle a rule. Block ids are in `irs-4255-inst-2025::sec` unless named. Every item is under one of three headings: two texts conflict (decided, with a `DECISION` comment and a row in `docs/rule-decisions.md`), should we do this now (done, or why not), and pattern change.

## Two texts conflict

### A38. The part of a penalty the ratios leave out

- Source: the ratios (excessive-payments-eps-excessive-credit::b02) against "If you do not have an EPE enter the full penalty amounts in columns (o)(3) and/or (p)(3)" (the same block).
- Decided: columns (1) and (2) take their ratios, and column (3) is the rest of the penalty. `DECISION` in `penalties.ts`, row A38.

### A39. Column (m)(3) of lines 1z and 2z

- Source: column (r) adds "Lines 1b, 1g, and 1j in column (m)(3)" and column (q) adds no (m)(3) (totals-by-type::b01); the blank form has an (m)(3) cell on lines 1z and 2z.
- Decided: line 1z's (m)(3) in column (r), line 2z's in column (q). `DECISION` in `partOne.ts`, row A39.

### A40. Form 4255 amounts the Schedule 2 list does not name

- Source: "on the appropriate line of your tax return" (lines-1-and-2::b02) against the lists of Schedule 2 lines 1y, 17a and 17z (irs-1040-inst-2025::sec::line-1y::b01, ::line-17a::b01, ::line-17z::b01).
- Decided: each amount goes on the Schedule 2 line that takes the same kind of amount. `DECISION` in `schedule2.ts`, row A40.

## Should we do this now

### 1. One recapture, used more than one way

- Source: "Column (j). Enter portion of column (h) recapturing non-EPE credit applied against regular tax in column (e). Column (k). ... gross EPE amount applied against regular tax from column (c). Column (l). ... net EPE amount from column (d)." (amounts-from-prior-year-s-returns::b01, b02)
- Default: with one kind of use (only (e), only (c) or only (d) above 0), the whole increase in tax goes in that column. With no elective payment, it is column (j). With more than one kind, the form is unsupported.
- Not now: the text gives no split, and a guess would move dollars between Schedule 2 Part I and Part II (line 2a) or between lines 17a and 19 (line 1d).

### 2. Column (g) with no percentage

- Source: "Column (g). Enter recapture percentage. See Line 15, later. Enter "N/A" if more than one recapture event on one line." (amounts-from-prior-year-s-returns::b01)
- Done: one event with no line 15 percentage (a Section C increase in financing, Part III, an amount figured on Form 8933 or 8911 without one) leaves column (g) blank. Each property, Part III, each Worksheet 3 entry and each amount figured elsewhere counts as one event. No dollars change.

### 3. Worksheet 3 dates

- Source: Worksheet 3 line 3, "Date property/project/facility/technology was placed in service" (property-project-facility-or-technology::b01). Line 10 of Part II uses "the first day of the month" (line-10::b01).
- Done: Worksheet 3 uses the date as stated. The first-of-the-month rule is written for line 10 only. Near an anniversary a full year can count one month later.

### 4. Subtractions that could go below zero

- Source: line 9 "Subtract line 8 from line 7", line 14 "Subtract line 13 from line 6", Part III line 8 "Subtract line 7 from line 4" (the form).
- Done: each is at least 0. Worksheets 1 and 2 cannot give back more than the credit; a higher energy percentage this year is no emissions tier recapture event (description-of-emissions-tier-recapture::b02). No dollars change for consistent inputs.

### 5. Section C when section 49 does not apply

- Source: line 3, "If section 49(a)(1) didn't apply to the property, enter -0-" (line-3::b01); line 7, "If zero or less, enter -0-" (the form).
- Done: lines 3, 7, 8 and 9 print 0. A property with line 7 above 0 and no Worksheet 1 amount makes the form unsupported.

### 6. The carryover reduction

- Source: "reduce any remaining carryforwards and carrybacks from the property by the recapture percentage used for the property on Part II, line 15" (carryover-adjustment-on-recapture::b01). Example 1: $64,000 less 60% is $25,600 (part-iii::b02).
- Done: each disposed property states its own unused credit; column (i) is the line 15 percentage of it, and column (h) adds it to the tax (Example 1: $21,600 + $38,400 = $60,000). Column (f) is not split among properties. A Section C increase and Part III reduce no carryforward. No tax changes; columns (h) and (i) only.

### 7. Amounts the taxpayer states from a notice or another form

- Columns (n)(1) and (n)(2): the IRS determines the excessive payment (excessive-payment::b01); the fact states both parts. Column (n)(3) is 20% of them unless there is reasonable cause.
- Columns (m)(1) and (m)(3): the excessive credit transfer and the transferee's recapture are stated. Column (m)(2) is 20% of (m)(1) unless there is reasonable cause.
- The penalties of Form 7220 (Part IV column (f), Part III column (i)) are stated before the split of row A38.
- Lines 8 and 13 (Worksheets 1 and 2) and line 6 come from earlier years' returns the engine does not read.
- Done as stated inputs. Figuring Worksheets 1 and 2 is under "Pattern change".

### 8. Elective payments on Form 1040

- Source: Schedule 2 lines 1e and 1f have boxes for Form 4255 lines 1a, 1c, 1d and 2a only (irs-1040-inst-2025::sec::line-1e-2::b01, line-1f-2::b01).
- Done: an elective payment amount (column (b) or an excessive payment) on any other line makes the form unsupported. Section 6417(d) limits an individual's election to those credits.

### 9. Line 2a column (m)(3)

- Source: the Schedule 2 instructions name "Form 4255, line 2a, column (m)(3)" (irs-1040-inst-2025::sec::identify-as-epe8933::b01); the blank form has no (m)(3) cell on line 2a.
- Done: no line 2a (m)(3). A credit transfer recapture on line 2a is a missing column, so the form is unsupported.

### 10. The basis increase

- Source: energy property basis rises by "50% of the amount ... of the recapture tax" (basis-adjustment-on-recapture::b01); Example 1, an energy credit, increases basis by $60,000 ($21,600 + $38,400), 100% (part-iii::b02).
- Not now: no line of this form holds the basis. Column (h) follows Example 1. The basis belongs to Form 4562 or 4797.

### 11. Who files with nothing owed

- Done: the form files when a line has an amount in column (h), (q) or (r), or with a gap or a missing line fact. A property held five full years (0%) with nothing else files no form. The explicit decision still files it.

### 12. Line 12 counts from the first day of the month

- Source: line 10, "using the first day of the month in which the property was placed in service" (line-10::b01); line 12 counts the "full years between the date on line 10 and the date on line 11" (the form).
- Done: line 12 counts from the line 10 date, as the form's arithmetic says. The blind fill read it the same way. Placed in service 01/15/2023 and disposed of 01/10/2025: 2 full years from 01/01/2023 (60%), 1 from 01/15/2023 (80%). On a $14,000 line 14, $8,400 against $11,200.

### 13. A penalty column of 0

- Source: the penalty ratios (excessive-payments-eps-excessive-credit::b02) can give $0 to a column, for example (o)(3) with nothing in column (e).
- Done: a column the split leaves at $0 is blank. The blind fill wrote 0. The totals do not change.

### 14. Schedule 2 files because of Form 4255

- Source: "Enter the amount from Part I, line 3, column (r) ... on the appropriate line of your tax return" (lines-1-and-2::b02), and column (q) the same way.
- Done (tax review, 2026-11-25): Schedule 2 files whenever Form 4255 files (`resolveSchedule2Info` in `filingInfoResolvers.ts`). Before, a return whose only Schedule 2 tax was Form 4255 dropped the recapture from Form 1040 lines 17 and 23.

### 15. More than four Part II properties

- Source: "If you need to list additional properties, complete and attach additional Forms 4255" (part-ii::b01). Lines 18 and 19: "Add property columns A through D".
- Done (2026-11-25): copy n prints properties 4n to 4n + 3, and its lines 18 to 20 add its own columns A to D (`copies.ts`). Part I, which adds every property, and Part III print on the first copy only. No dollars change: Part I column (h) takes each property on its own line.

### 16. More than one hydrogen facility

- Not now: Part III has one column, so a second facility needs a second Part III and Part I line 1j adds both. An individual with two specified clean hydrogen facilities is rare; the form is unsupported with a reason.

## Pattern change

- Worksheets 1 and 2 (lines 8 and 13). Before: the taxpayer states the amounts from earlier years' returns. After: the engine figures them from earlier years' Forms 3800 (issue #79, last year's return), which is a new layer of earlier-year facts.
- Forms that repeat (issue #174). Before: each form with fixed rows has its own copies rule (`copies.ts` here and in Form 4797). After: one shared rule could say which parts print on later copies.

## Second opinions

- **Blind fill (2026-11-25).** 15 cases filled by hand from the blank form and the instructions: Part II Sections B and C, Part III, Worksheet 3, the penalty split, the excessive payment and credit transfer columns, and Schedule 2 lines 1e, 1f, 1y, 17a and 19. No dollar difference. One blank-or-zero difference: column (o)(3) of line 1c with nothing in column (e), blank in the engine and 0 in the blind fill (item 13). The blind fill's dollar doubts are items 3, 6, 7 and 12, and rows A38 and A40.
- **PolicyEngine-US 2.154.0 (commit 363e9fc5).** It has one variable, `recapture_of_investment_credit`, a bare input with no formula: no recapture percentages, no Part II or Part III lines, no penalties, no elective payment amounts. It adds the amount to the tax after the nonrefundable credits, as Schedule 2 line 17a does with column (r). No constant or formula to compare, and no disagreement.
- **IRS Direct File.** Not compared: no checkout in reach, and its scope did not include business credits.
- **Page check (2026-11-25).** Every printed value of the liandrin Form 4255, Schedule 2, Form 8959 and Form 1040 worked again by hand from the instructions: no difference.

## Confidence by field group

| Field group                                    | Confidence                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Header (name, identifying number)              | stated rule                                                                                |
| Part I columns (a) to (f)                      | stated rule (stated amounts and the form's arithmetic)                                     |
| Part I columns (g) to (j), no elective payment | published example with numbers (Examples 1 and 2)                                          |
| Part I columns (k) and (l)                     | published example with numbers for (l) (Example 6); own reading for the split (question 1) |
| Part I columns (m) and (n)                     | stated rule                                                                                |
| Part I columns (o) and (p)                     | published example with numbers (the penalty ratio); own reading for the rest (A38)         |
| Part I columns (q) to (t) and line 3           | stated rule; own reading for (m)(3) on 1z and 2z (A39)                                     |
| Part II lines 1 to 9                           | stated rule                                                                                |
| Part II lines 10 to 16                         | published example with numbers (Examples 1 to 4)                                           |
| Part II line 17 and lines 18 to 20             | stated rule; own reading for an additional copy (question 15)                              |
| Part III lines 1 to 9                          | stated rule (no example)                                                                   |
| Worksheet 3 (column (h) of lines 1g and 1j)    | stated rule; own reading for the dates (question 3)                                        |
| Schedule 2 lines 1d, 1e, 1f, 1y, 17a, 17z, 19  | stated rule; own reading for the amounts the list does not name (A40)                      |
