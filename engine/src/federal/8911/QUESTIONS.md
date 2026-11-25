# Form 8911: open questions

The instructions have no example with numbers. Two IRS publications do (`.scratch` evidence, not committed): Publication 6027 (a home charger, $900) and Publication 6029 (60 charging ports, $8,250 each). Both are unit tests in `tests/unit/federal/8911/lines.test.ts`.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Item A (count of properties) | Own reading (item 9) |
| Schedule A lines 8–16, Form 8911 line 1 | Published example with numbers (Pub. 6029); 6% rate a stated rule |
| Line 2 (K-1 code AO) | Stated rule (line-2::b01) |
| Line 3 | Stated rule (the form's arithmetic); 0 when the form leaves (item 3) |
| Schedule A lines 17–21, Form 8911 line 4 | Published example with numbers (Pub. 6027) |
| Lines 5, 6a, 6c, 7, 9, 10 | Stated rule (the blank form) |
| Line 6b | Stated rule (line-6b::b01), with item 1 |
| Line 8 | Stated rule, with a decision (docs/rule-decisions.md row A1) |
| Schedule 3 line 6j | Stated rule (irs-1040-inst-2025::sec::line-6j::b01) |
| Header (name, SSN) | Stated rule |

No field of the form is unsupported in general. These cases are gaps (unsupported with a reason): line 8 when Form 6251 does not file by decision, or when Form 1116 files; lines 5–10 when a credit that line 6b adds is a gap; lines 5–10 when the foreign tax credit is a gap. The business credit on line 3 is figured, but Form 3800 has no rules, so Schedule 3 line 6a is a gap on that return.

## 1. Line 6b and Schedule 3 line 7

- Text: "Enter the total of any credits or adjustments on Form 1040 ... line 19, and Schedule 3 (Form 1040), lines 2 through 5, and 7 (reduced by any general business credit reported on line 6a, any credit for prior-year minimum tax reported on line 6b, or any credit to holders of tax credit bonds reported on line 6k)" (irs-8911-inst-2025::sec::line-6b::b01).
- Schedule 3 line 7 also holds line 6j, this form's own credit. A credit cannot limit itself.
- Default: line 6b leaves out line 6j as well. Line 6e is reserved and line 6z is blank for 2025.
- Dollars: none. Any other reading has no answer.

## 2. Line 8 when Form 6251 leaves its line 8 blank

Decided by the author: docs/rule-decisions.md row A1, and the `DECISION` comment in `credit.ts`.

## 3. The form leaves the return with no credit

- Text: lines 7 and 9: "If zero or less, enter -0- and stop here; do not file this form unless you are claiming a credit on line 3."
- The resolver cannot see the tax. The form names line 3 and Schedule 3 line 6j in `filesOnlyWithAmountOn`. With no business part, line 3 is blank while line 10 holds a credit or waits, and 0 when the personal part ends with none, so the form leaves.
- Schedule 3 and Form 6251 still file from the facts in that case (KNOWN GAP, as for Form 8936).
- Dollars: none.

## 4. Line 6b credits the engine cannot figure

- Lines 5–10 are unsupported while Form 5695 (line 5a), Form 8859 (6h), Form 8834 (6i) or Form 8978 (6l) files, or while another credit line 6b adds is a gap. The total would leave a credit out.
- Dollars: the whole credit, on those returns.

## 5. Section 179 on line 11

- Text: "Enter any section 179 expense deduction you took for the property from Part I of Form 4562" (line-11::b01).
- Default: the property fact states it. The engine does not check it against Form 4562.
- Dollars: yes, when the two differ.

## 6. Line 9 for a change of use

- Text: "Multiply that percentage by the number of months ... and divide the result by 12" (line-9::b01).
- Default: line 9 keeps the fraction (60% × 7 ÷ 12 = 35.0%), and line 10 rounds to the dollar.
- Dollars: at most $1 on line 10.

## 7. Line 12 below 0

- Default: line 12 is at least 0. A section 179 deduction above the business part of the cost should not happen.
- Dollars: none on a correct return.

## 8. Placed in service in another year

- Text: "You placed the refueling property in service during your tax year" (qualified-alternative-fuel-vehicle::b01). After June 30, 2026, no credit (what-s-new::b01).
- Default: a property with a date outside 2025 files no Schedule A on this return.
- Dollars: none.

## 9. Item A

- Text: "Enter the total number of qualified alternative fuel vehicle refueling properties for which you are claiming this credit ... If your only ... credit is from line 2, enter -0-" (specific-instructions-for-form::b01).
- Default: the count of Schedules A with an amount on line 16 or line 21.
- Dollars: none.

## 10. Line 13 and Form 7220

- Text: "You must file Form 7220 ... to establish compliance with the prevailing wage requirements" (line-13::b01).
- Default: the property fact states the line 13 answer. The engine does not prepare Form 7220.
- Dollars: the 30% rate in place of 6%, on a business part.

## 11. Two- and three-wheel vehicles

- Text: a charger for these vehicles qualifies "only if the property is of a character subject to depreciation" (qualified-alternative-fuel-vehicle::b04).
- Default: the fact does not name the vehicle. Cade must not record a personal use part for such a charger.
- Dollars: up to $1,000 an item.

## Proposals for a discussion

- **Print Schedule A (Form 8911).** The engine figures each Schedule A in `lines.ts`, but there is no catalog for it, so the return prints only Form 8911. A new form `form-8911-schedule-a` that repeats for each property would print lines 1–21. It needs a catalog and the repeating-form pattern (issue #174).
- **Basis reduction.** "You must reduce the basis of the property by the sum of the amounts entered on lines 16 and 21" (basis-reduction::b01). The business part's depreciation (Form 4562, Schedule C or E) does not read the credit. A depreciation fact for the charger would have to take its basis from the Schedule A.
- **Recapture.** "If the property no longer qualifies ... you may have to recapture" (basis-reduction::b01; Schedule 2 line 1y "ARPCR"). No fact holds a recapture. A new fact kind and a Schedule 2 line 1y rule would add it.
- **The K-1 credit's route.** Line 2 reads the K-1 fact's code AO box. The pass-through layer has no route for a credit item, so such a K-1 still makes Schedule E line 41 unsupported. Routes by the item's detail (the credit's name) would let a credit reach its form.
- **Form 3800.** The business part reaches Form 3800 Part III line 1s, which has no rules. Schedule 3 line 6a stays a gap until it does.
