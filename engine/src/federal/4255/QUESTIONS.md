# Form 4255: open questions

Each place where the form and its instructions do not settle a rule. Block ids are in `irs-4255-inst-2025::sec` unless named. The decisions with two conflicting texts are rows A33 to A35 of `docs/rule-decisions.md`.

## 1. One recapture, used more than one way

- Source: "Column (j). Enter portion of column (h) recapturing non-EPE credit applied against regular tax in column (e). Column (k). ... gross EPE amount applied against regular tax from column (c). Column (l). ... net EPE amount from column (d)." (amounts-from-prior-year-s-returns::b01, b02)
- Default: with one kind of use (only (e), only (c) or only (d) above 0), the whole increase in tax goes in that column. With no elective payment, it is column (j). With more than one kind, the form is unsupported: the text gives no split.
- Changes dollars: yes, between Schedule 2 Part I and Part II on line 2a, and between lines 17a and 19 on line 1d.

## 2. Column (g) with no percentage

- Source: "Column (g). Enter recapture percentage. See Line 15, later. Enter "N/A" if more than one recapture event on one line." (amounts-from-prior-year-s-returns::b01)
- Default: one event with no line 15 percentage (a Section C increase in financing, Part III, an amount figured on Form 8933 or 8911 without one) leaves column (g) blank. Each property, Part III, each Worksheet 3 entry and each amount figured elsewhere counts as one event.
- Changes dollars: no.

## 3. Worksheet 3 dates

- Source: Worksheet 3 line 3, "Date property/project/facility/technology was placed in service" (property-project-facility-or-technology::b01). Line 10 of Part II uses "the first day of the month" (line-10::b01).
- Default: Worksheet 3 uses the date as stated. The first-of-the-month rule is written for line 10 only.
- Changes dollars: yes, near an anniversary: a full year can count one month later.

## 4. Subtractions that could go below zero

- Source: line 9 "Subtract line 8 from line 7", line 14 "Subtract line 13 from line 6", Part III line 8 "Subtract line 7 from line 4" (the form).
- Default: each is at least 0. Worksheets 1 and 2 cannot give back more than the credit; a higher energy percentage this year is no emissions tier recapture event (description-of-emissions-tier-recapture::b02).
- Changes dollars: no for consistent inputs.

## 5. Section C when section 49 does not apply

- Source: line 3, "If section 49(a)(1) didn't apply to the property, enter -0-" (line-3::b01); line 7, "If zero or less, enter -0-" (the form).
- Default: lines 3, 7, 8 and 9 print 0. A property with line 7 above 0 and no Worksheet 1 amount makes the form unsupported.
- Changes dollars: no.

## 6. The carryover reduction

- Source: "reduce any remaining carryforwards and carrybacks from the property by the recapture percentage used for the property on Part II, line 15" (carryover-adjustment-on-recapture::b01). Example 1: $64,000 less 60% is $25,600 (part-iii::b02).
- Default: each disposed property states its own unused credit; column (i) is the line 15 percentage of it, and column (h) adds it to the tax (Example 1: $21,600 + $38,400 = $60,000). Column (f) is not split among properties. A Section C increase and Part III reduce no carryforward.
- Changes dollars: no tax; columns (h) and (i) only.

## 7. Amounts the taxpayer states from a notice or another form

- Columns (n)(1) and (n)(2): the IRS determines the excessive payment (excessive-payment::b01); the fact states both parts. Column (n)(3) is 20% of them unless there is reasonable cause.
- Columns (m)(1) and (m)(3): the excessive credit transfer and the transferee's recapture are stated. Column (m)(2) is 20% of (m)(1) unless there is reasonable cause.
- The penalties of Form 7220 (Part IV column (f), Part III column (i)) are stated before the split of row A33.
- Lines 8 and 13 (Worksheets 1 and 2) and line 6 come from earlier years' returns the engine does not read.
- Changes dollars: no (stated inputs).

## 8. Elective payments on Form 1040

- Source: Schedule 2 lines 1e and 1f have boxes for Form 4255 lines 1a, 1c, 1d and 2a only (irs-1040-inst-2025::sec::line-1e-2::b01, line-1f-2::b01).
- Default: an elective payment amount (column (b) or an excessive payment) on any other line makes the form unsupported. Section 6417(d) limits an individual's election to those credits.
- Changes dollars: no (unsupported, not a guess).

## 9. Line 2a column (m)(3)

- Source: the Schedule 2 instructions name "Form 4255, line 2a, column (m)(3)" (irs-1040-inst-2025::sec::identify-as-epe8933::b01); the blank form has no (m)(3) cell on line 2a.
- Default: no line 2a (m)(3). A credit transfer recapture on line 2a is a missing column, so the form is unsupported.
- Changes dollars: no.

## 10. The basis increase

- Source: energy property basis rises by "50% of the amount ... of the recapture tax" (basis-adjustment-on-recapture::b01); Example 1, an energy credit, increases basis by $60,000 ($21,600 + $38,400), 100% (part-iii::b02).
- Default: no form line holds the basis. Column (h) follows Example 1. The basis belongs to Form 4562 or 4797, not here.
- Changes dollars: not on this form.

## 11. Who files with nothing owed

- Default: the form files when a line has an amount in column (h), (q) or (r), or with a gap or a missing line fact. A property held five full years (0%) with nothing else files no form. The explicit decision still files it.
- Changes dollars: no.

## Proposals for a discussion

- Worksheets 1 and 2 (lines 8 and 13) replay the general business credits of every year the recapture touches. The engine could figure them if it read earlier years' Forms 3800 (issue #79, last year's return). That is a new layer of earlier-year facts, so the worksheets are stated amounts for now.
- More than four Part II properties, or more than one hydrogen facility, needs more copies of Form 4255. The engine prints one copy, so such a return is unsupported. A form that repeats is issue #174.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header (name, identifying number) | stated rule |
| Part I columns (a) to (f) | stated rule (stated amounts and the form's arithmetic) |
| Part I columns (g) to (j), no elective payment | published example with numbers (Examples 1 and 2) |
| Part I columns (k) and (l) | published example with numbers for (l) (Example 6); own reading for the split (question 1) |
| Part I columns (m) and (n) | stated rule |
| Part I columns (o) and (p) | published example with numbers (the penalty ratio); own reading for the rest (A33) |
| Part I columns (q) to (t) and line 3 | stated rule; own reading for (m)(3) on 1z and 2z (A34) |
| Part II lines 1 to 9 | stated rule |
| Part II lines 10 to 16 | published example with numbers (Examples 1 to 4) |
| Part II line 17 and lines 18 to 20 | stated rule |
| Part III lines 1 to 9 | stated rule (no example) |
| Worksheet 3 (column (h) of lines 1g and 1j) | stated rule; own reading for the dates (question 3) |
| Schedule 2 lines 1d, 1e, 1f, 1y, 17a, 17z, 19 | stated rule; own reading for the amounts the list does not name (A35) |
