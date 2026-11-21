# Form 8815 — open questions

Each item is a place where the form and its instructions do not settle a rule. The engine applies the default shown. "Dollars" says whether the choice can change an amount.

## 1. Places on lines 7 and 12

- Source: "Enter the result as a decimal (rounded to at least three places)" (`irs-8815-form-2025::sec::omb-no-1545-0074::b02`).
- Default: three places, rounded to nearest. Lines 8 and 13 multiply by the printed ratio.
- Dollars: yes, by $1 at most. Pub. 550's Max and Helene use the exact fraction ($746.90); three places give $747.35. Both round to $747. The blind fill found two cases that move: $9,000 / $9,500 on line 7 with line 6 of $4,500 gives line 8 of $4,262 at three places and $4,263 exact; a line 12 of 10,750 / 30,000 gives line 14 of $676 at three places and $675 exact.

## 2. The digit before the decimal point

- Source: the form prints "× ." for lines 7 and 12. The filled form in Pub. 970 (2007), p. 57, leaves the digit empty below 1 ("× . 850").
- Default: empty below 1, "1" for "1.000".
- Dollars: no.

## 3. Line 11 when line 9 is at or below line 10

- Source: "Subtract line 10 from line 9. If zero or less, skip line 12, enter -0- on line 13" (`omb-no-1545-0074::b02`). It does not say what line 11 shows.
- Default: line 11 prints 0. Line 12 is blank, line 13 is 0.
- Dollars: no.

## 4. The form files above the income limit

- Source: "Note: If line 9 is $114,500 or more ... stop. You cannot take the exclusion" (`omb-no-1545-0074::b02`).
- Default: the resolver cannot see line 9, so the form files. Lines 1–9 print; lines 10–14 and Schedule B line 3 are blank.
- Dollars: no. A preparer may leave the form off the return.

## 5. Line 4 zero or less, or married filing separately, with the explicit decision

- Source: "If zero or less, stop" (line 4); "any status except married filing separately" (`who-can-take-the-exclusion::b01`).
- Default: without the decision the form does not file. With `decisions.scope.must_file_8815 = true`: line 4 zero or less leaves lines 5–14 blank; married filing separately leaves lines 10–14 blank.
- Dollars: no.

## 6. The ownership test is a stated answer

- Source: bonds "in your name, or ... your name and your spouse's name. Also, you must have been age 24 or older before the bonds were issued" (`u-s-savings-bonds-that-qualify-for-exclusion::b01`).
- Default: each bond fact carries `ownerQualifies`; the engine does not check the age against a birth date. A bond that fails it is left off line 5.
- Dollars: yes, if the answer is wrong.

## 7. Lines 2 and 3 are stated net amounts

- Source: line 2 leaves out expenses "Used to figure an education credit on Form 8863" and Coverdell or QTP tax-free amounts (`line-2::b01`).
- Default: the expense fact holds line 2 already reduced. Form 8863 has no rules yet, so the engine cannot check that an expense is not counted twice.
- Dollars: yes, if the stated amount is wrong.

## 8. Educator expenses on line 9

- Source: "do not reduce your educator expenses, if any, by the amount on Form 8815, line 14" (`step-action::b02`).
- Default: line 9 reads Schedule 1 line 11 as stated. The educator expense fact is recorded after its reductions (`facts/kinds/educatorExpenses.ts`), which include this exclusion.
- Dollars: yes, at most $300 per educator, and only with both.

## 9. Schedule 1 lines the engine leaves unsupported

- Source: line 9 adds Schedule 1 lines 1–7 and 9 and subtracts lines 11–20, 23 and 25 (`step-action::b03`).
- Default: a Schedule 1 line that is unsupported (for example line 17, self-employed health insurance) counts as 0. Step 2 (PTC with that deduction) is therefore not reached.
- Dollars: yes, only when such a line applies.

## 10. Interest on the 1099-INT and on line 6

- Source: line 6 is "the interest included on line 5" (Line 6 Worksheet).
- Default: line 6 comes from the bond facts. The engine does not check it against 1099-INT box 3, and Schedule B line 1 lists the 1099-INT amounts.
- Dollars: yes, if the bond records and the 1099-INT disagree.

## 11. Puerto Rico income

- Source: line 9 adds "Any exclusion of income from Puerto Rico" (`step-action::b03`).
- Default: no fact holds it, so nothing is added.
- Dollars: yes, only for a bona fide resident of Puerto Rico.

## 12. Rounding inside the chain

- Source: the form says nothing on rounding. The 1040 rule rounds each line to the nearest dollar, and a sum keeps its cents until the total.
- Default: line 5 adds the proceeds with cents and rounds the total. Lines 8 and 13 multiply the rounded line 6 and line 8 by the printed ratio, then round. Exactly $0.50 rounds up.
- Dollars: yes, by $1 at most. Two $1,000.40 proceeds give line 5 of $2,001 and line 6 of $1,001; with cents kept through line 8, line 6 is $1,000.80.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Lines 2–4 | published example with numbers (8815 line 3 example) |
| Lines 5–8 | published example with numbers (Pub. 970 2025; Pub. 550 Max and Helene) |
| Line 6 Worksheet lines 1–6 | published example with numbers (Max and Helene); lines 7–8 stated rule |
| Lines 10–14 | published example with numbers (Pub. 970 2007, logic only); 2025 amounts stated rule |
| Line 9 and the Line 9 Worksheet | stated rule |
| Line 1 rows, header | stated rule; more than three rows unsupported (no attached statement) |
| Line 9 with an IRA contribution, Form 2555 or 4563, adoption benefits, royalty interest | unsupported |
| Ratio printing (lines 7, 12), line 11 at zero | own reading |

## Second opinions

- **Blind fill (15 cases).** A second preparer filled lines 4–14 from the blank form and its instructions only. Every line of every case matches the engine; no difference, not even blank against 0.
- **PolicyEngine-US 2.152.15** (commit b274cacc). It does not model Form 8815. `us_bonds_for_higher_ed` is a bare person input with no formula, so it has no line 10 start, no line 12 range, no Line 6 Worksheet and no ownership test to compare. Its only rule is where the amount goes: an above-the-line exclusion, left out of modified AGI for the IRA deduction, and counted for the filer when recorded on a dependent. That matches the form: line 14 reduces Schedule B, and a bond in a child's name does not qualify.
- **The engine's constants against the form.** Line 10 ($99,500; $149,250), the line 12 divisors ($15,000; $30,000) and the line 9 Note ($114,500; $179,250) match `irs-8815-form-2025::sec::omb-no-1545-0074::b02`.
- **IRS Direct File.** No checkout is reachable from this project (issue #140 is open), so it was not compared.
