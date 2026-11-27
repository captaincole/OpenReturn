# Form 7218 — open questions

Form 7218 figures the section 45Z clean fuel production credit, one form for each fuel facility. 2025 is the credit's first year. The only published example with numbers is the applicable amount example in the instructions. Each item says the source text, the default the engine applies, and whether it changes dollars.

## 1. Column (f) and the registration date (decided: docs/rule-decisions.md row A110)

- Column (f): "Enter the number of gallons or gallon equivalents of fuel sold in the calendar year" (`irs-7218-inst-2025::sec::part-iii-clean-aviation-and::b03`).
- Line 5b: no credit "for any transportation fuel produced and sold by the taxpayer before June 30, 2025" with a letter of that date (`line-5b::b01`).
- Default: column (f) holds only the gallons produced on or after the letter. The fact states the gallons made before it (`gallonsProducedBeforeRegistration`), asked when the letter is dated after January 1, 2025. A sale with no gallons produced after the letter takes no row, the same as the other sales that earn no credit. A facility with no row files no Form 7218: "File a separate Form 7218 for each qualified facility for which you claim the section 45Z credit" (`how-to-claim-the-credit::b02`). So a letter dated after 2025 files no form for that facility (blind case 8, fixed 2026-11-27: the engine printed a row of 0 gallons and line 25 of 0).
- Gallons produced on the date of the letter count: the example allows fuel "produced and sold on or after June 30, 2025" (`line-5b::b01`). The fact states the gallons made before the letter, so this is the taxpayer's count.
- Changes dollars: yes.

## 2. Where the credit is rounded

- The form: "(h) Multiply columns (e) x (f) x (g)" (`part-iii-clean-aviation-and::b03`).
- The statute: "If any amount determined under paragraph (1) is not a multiple of 1 cent, such amount shall be rounded to the nearest cent" (`usc-26-2025::sec::s45z::a-5`).
- Default: each row keeps its cents, prints in whole dollars, and line 25 adds the cents and rounds once (the repository's rule for a total of computed rows). The engine does not round a credit per gallon first.
- Changes dollars: under $1 a row.

## 3. A 2025 emissions rate below zero (statute and instructions differ: for docs/law-findings.md)

- Instructions: "The following are applicable to fuel produced after December 31, 2025: • The emissions rate can't be less than zero" (`irs-7218-inst-2025::sec::emissions-factor::b01`).
- Statute in the library (current text, no effective date): "the emissions rate for a transportation fuel may not be less than zero" (`usc-26-2025::sec::s45z::b-1-E`).
- Default: the instructions decide. A 2025 rate below zero goes through column (e)'s arithmetic, so the factor is above 1 (−40 kg gives 1.8). The library holds no amendment notes, so the effective date of (E) was not read; the instructions say it starts after 2025.
- Changes dollars: yes, for a fuel with a rate below zero (renewable natural gas from manure). No scenario uses one.

## 4. The SAF rate in 2025

- Instructions: SAF takes $0.35 or $1.75 before inflation for fuel produced and sold in 2025, and the special rate ends for fuel produced after 2025 (`applicable-amount::b01`; `sustainable-aviation-fuel-saf-public-law-119-21::b01`).
- The statute in the library no longer has the SAF amount (`usc-26-2025::sec::s45z::a-2`), because it is the text after Public Law 119-21.
- Default: the instructions' 2025 amounts. No conflict for 2025: the change is for fuel produced after 2025.
- Changes dollars: no.

## 5. A credit that passes through only

- "If you are not a filer described above, and your only clean fuel production credit is a credit(s) passed through to you, you can report the credit(s) directly on Form 3800, Part III, line 1q" (`part-ii-clean-aviation-and::b01`).
- Default: a K-1 credit alone files no Form 7218 (the explicit decision can file it). With a facility, the pass-through credits print on a separate Form 7218 with "Credits from Pass-Through Entities" on line 2a. Form 3800 keeps each K-1 credit as its own line 1q source either way.
- Changes dollars: no.

## 6. Elective payment

- "Applicable entities (as defined under section 6417(d)(1)(A)) ... may elect to treat the clean fuel production credit as a payment of income tax" (`emissions-factor::b02`). Section 6417(d)(1)(B) to (D) let other taxpayers elect only for sections 45V, 45Q and 45X (`usc-26-2025::sec::s6417::d-1-B` to `d-1-D-i`).
- Default: an individual cannot make the election, so the facility fact has no elective payment. Line 1 prints the registration number of a section 6418 transfer, the only election an individual makes. A purchased transfer on a facility fact is a gap: a buyer states it on Form 3800 line 1q.
- Changes dollars: no.

## 7. Is the credit income?

- Section 87 puts the alcohol fuel, biodiesel and SAF credits of sections 40, 40A and 40B in gross income (`usc-26-2025::sec::s87::text` to `::3`). It does not name section 45Z, and no other text found says the credit is income or reduces a deduction.
- Default: no line of another form changes. The cash for a credit sold under section 6418 is not income either (section 6418(b)); Schedule C does not include it.
- Changes dollars: no.

## 8. How Form 7218 must connect to Forms 6478 and 8864 (both have no rules on this branch)

- Form 6478: "Don't claim the credit for fuel sold or used after 2024" (`irs-6478-inst-2025::sec::what-s-new::b01`). Form 7218 takes fuel produced and sold after 2024 (`irs-7218-inst-2025::sec::purpose-of-form::b01`). For a 2025 calendar-year return no gallon can be on both forms, so no check is needed.
- Form 8864: the biodiesel, renewable diesel and SAF credits ended for fuel sold after 2024 (`irs-8864-inst-2025::sec::what-s-new::b02`). The small agri-biodiesel producer credit continues, and "For fuel sold or used after June 30, 2025, the section 40A credit is determined in addition to any credit determined under section 45Z" (`irs-7218-inst-2025::sec::emissions-factor::b05`; `usc-26-2025::sec::s40a::b-4-D`). So a gallon sold after June 30, 2025 earns both credits.
- Open: a gallon of agri-biodiesel sold from January 1 to June 30, 2025 (Form 8864 line 7, `irs-8864-inst-2025::sec::line-7::b01`). No text in the corpus says whether it can also earn the section 45Z credit. When Form 8864 gets rules, the rule that checks both forms belongs in it: it reads the clean fuel facility facts (`facts/kinds/cleanFuelFacility.ts`), and a gallon on Form 8864 line 7 that a facility also counts should be a gap there until a person decides.
- Changes dollars: possibly, only for agri-biodiesel sold in the first half of 2025.

## 9. Form 7220

- "If you checked 'Yes' on line 7 and are using an increased applicable amount on Part III, column (g), you must also file Form 7220" (`line-7::b01`).
- Default: the engine has no Form 7220. The credit is figured from the line 7 answer; the PWA proof is the taxpayer's. The same as Form 8911 (its QUESTIONS.md item 10).
- Changes dollars: no.

## 10. Smaller defaults

- Column (c) prints 2025: the return's calendar year.
- Column (a) prints the fuel and "(SAF)" or "(non-SAF)" ("Enter the type of fuel and if it's non-SAF or SAF", `part-iii-clean-aviation-and::b01`).
- A fuel above 50 kg of CO2e per mmBTU is not transportation fuel (`transportation-fuel::b01`) and takes no row. A SAF row without its unrelated party certification (`sustainable-aviation-fuel-saf::b01`) takes no row. Another reading would claim the uncertified SAF as non-SAF fuel at $1.06 or $0.21 a gallon; no text found allows it, so the engine gives it no credit. Changes dollars: yes, for uncertified SAF.
- Column (e) at a halfway value: "Divide the result by 50 kilograms of CO2e, then round to the nearest multiple of 0.1" (`part-iii-clean-aviation-and::b01`). The text does not say how 0.05 rounds. The engine rounds half up (a rate of 47.5 gives 0.1), the same as whole dollars and cents. Half to even would give 0.0. Changes dollars: yes, the whole row (blind case 11: $10,600 against $0). The blind fill chose the same.
- More than 24 rows for one facility: line 25 is a gap. The instructions do not say where more rows go.
- Lines 4 and 5 are for cooperatives, estates and trusts: blank on an individual's return.
- The facility fact states passive or not, like a Form 3468 property, not through the Schedule C business.

## Second opinions

- Blind fill (2026-11-27): 14 cases filled by hand from the blank form and the instructions. One difference: case 8, a registration letter dated after 2025. The engine printed a row of 0 gallons and line 25 of 0; the blind fill filed no form. No credit dollars differed. The instructions decide for the blind fill (item 1), and the engine now files no form for such a facility. Every other case matched to the cent.
- PolicyEngine-US 2.154.2 (commit c1fea42a): it does not model section 45Z or Form 7218 (no variable or parameter names the credit), so nothing was compared.
- No other reference implementation that the repository names models this credit (IRS Direct File has no business credits).

## Confidence

| Field group                                | Confidence                                                |
| ------------------------------------------ | --------------------------------------------------------- |
| Column (g), the applicable amounts         | Published example with numbers (`applicable-amount::b02`) |
| Column (e), the emissions factor           | Stated rule; matches CRS IF12502 Table 1                  |
| Column (h), line 25, Part II lines 1 and 3 | Stated rule                                               |
| Column (f), the registration rule          | Own reading (item 1, decided)                             |
| Part II line 2, the pass-through form      | Stated rule                                               |
| Part I lines 1 to 7, columns (a) to (d)    | Stated rule (printed from the facts)                      |
| Lines 4 and 5                              | Stated rule (blank for an individual)                     |
| A rate below zero                          | Own reading (item 3)                                      |
