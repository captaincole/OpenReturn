# Form 8835 — open questions

Form 8835 figures the renewable electricity production credit (section 45) for one facility: kilowatt-hours sold times a rate, less the tax-exempt bond reduction and the wind phase-down, times 5 for a qualified facility, plus two 10% bonuses. Line 15 goes to Form 3800 line 4e (the first 4 years) or line 1f (later). Sources: the form face (`irs-8835-face-2025`) and the 2025 instructions (`irs-8835-inst-2025`). They publish no example with numbers. The scenario is `wit` (two wind facilities). Tests: `engine/tests/unit/federal/8835/`.

## Two texts conflict

Each is decided by the author, with a `DECISION` comment and a row in `docs/rule-decisions.md`.

1. **A pre-2022 facility takes no energy community bonus** (row A110, `partI.ts`). The bonus text has no date (`increased-credit-in-energy-communities::b01`); the instructions say the IRA amendments "apply to facilities placed in service after 2021" (`qualified-facilities::b01`). The engine checks 10c and puts 0 on line 11. Changes dollars only when a taxpayer says "yes" for a pre-2022 facility: 10% of line 9.
2. **A K-1 credit alone does not file Form 8835** (row A111, `resolveInfo.ts`). The K-1 instructions offer "Form 8835; or Form 3800, Part III, line 1f" (`irs-1065k1-inst-2025::sec::box-15-credits::b08`); Form 8835's own instructions say such a taxpayer is "not required to complete or file this form" (`general-instructions::b01`, `line-14::b01`). No dollars.

## Doubts with no conflicting text

3. **One resource per facility.** The form has ten rows on line 1; the instructions say "a separate Form 8835 ... at each qualified facility". Done: a facility fact names one resource, so one row is filled. No dollars.
4. **Line 8 can check more than one "Yes" box.** "Check the appropriate box on line 8" (`line-8::b01`); the statement lists items for each box checked. Done: each box the facts show is checked (8b from line 4's date; 8a and 8c from the answers), 8d when none. No dollars: line 9 multiplies by 5 once.
5. **Line 8 is blank before 2022.** "Applies to facilities placed in service after December 31, 2021" (`line-8::b01`). Done: no box; line 9 is line 8. No dollars: the pre-2022 rate (3.0 or 1.5 cents) is already the full rate.
6. **Line 9a and 9b before 2023.** Domestic content is "For qualified facilities placed in service after 2022" (`domestic-content::b01`). Done: 9b for an earlier facility, line 10 is 0. Stated rule.
7. **Offshore wind is a wind facility for line 7.** Line 7 says "wind facilities" (`face-part-ii::b02`); section 45(b)(5) says "any facility using wind" (`usc-26-2025::sec::s45::b-5`). Done. Changes dollars only for an offshore facility begun 2017 to 2021 and placed in service before 2022.
8. **Line 3 is 0.** "Calendar year filers enter -0- on line 3" (`line-3::b01`). The engine has no fiscal year filer. The dollar and multiplier boxes stay blank. No dollars.
9. **Line 13 is line 12.** The 90% applies only to an elective payment election under section 6417 (`line-13::b01`), which only an applicable entity makes for this credit (`how-to-figure-the-credit::b03`). An individual makes none, as Form 3468 line 30 (3468 QUESTIONS.md item 1). The fact has no elective payment field. No dollars.
10. **The 4-year split is by kilowatt-hours.** Line 15: "report the applicable part" (`face-part-ii-2::b01`). Every kilowatt-hour of one facility earns the same rate and multipliers, so the part is the credit times the share of kilowatt-hours in the period. The fact asks for that share only when the period ends during 2025 (placed in service from January 2 to December 31, 2021). Rounding: the parts add up to line 15 (`prorateDollars`). Changes dollars between lines 4e and 1f only.
11. **Bonds for construction on or before August 16, 2022.** Lines 5a to 5d "reflect IRA 2022 amendments applicable to facilities, whose construction began after August 16, 2022" (`line-3::b01`, Lines 5a–5d). The instructions give no rule for an older facility. Done: such a facility with bonds is unsupported from line 5a on. No change for a facility without bonds.
12. **The ratio on line 5a prints 6 places, every digit kept.** As Form 3468 (row A99): the same "Divide" line and the same "lesser of 15% or a fraction" text. Small: under $1 on these amounts.
13. **No credit outside the credit period.** The credit is for electricity "produced ... during the 10-year period beginning on the date the facility was originally placed in service" (`how-to-figure-the-credit::b01`). Column (a) is the stated kilowatt-hours of that period sold in 2025. A facility whose period ended before 2025, a facility not in service by the end of 2025, and a facility begun after 2024 (Form 7211's) are unsupported with the reason. No dollars for a facility in its period.
14. **A section 1603 grant: no Form 8835.** "No production credit under section 45 ... is allowed for the property for the tax year in which the grant is made or any subsequent tax year" (`coordination-with-department-of-treasury::b01`). Done: the facility files no copy. Stated rule.
15. **Solar before 2022 has no rate.** The 2025 rates list no solar rate for a facility placed in service before 2022 (`how-to-figure-the-credit::b02`). Unsupported from line 1. No 2025 credit is known for such a facility.
16. **A Form 3468 election on the same facility.** A facility treated as energy property under section 48(a)(5) is one "for which no credit has been allowed under section 45" (`election-to-treat-a-qualified-facility-as-energy::b01`). The engine cannot link a Form 3468 property to a facility fact. Done: a Form 3468 qualified investment credit facility (section L) makes each Form 8835 facility unsupported unless the address or coordinates show another place.
17. **K-1 credits go to Form 3800 line 1f.** The partnership and S corporation K-1 instructions send code AB to "Form 3800, Part III, line 1f" (`irs-1065k1-inst-2025::sec::box-15-credits::b08`), and Form 3800 already routes them so (`3800/k1Credits.ts`). Form 8835 line 15 splits by the 4-year period, which the K-1 does not show. Not changed here: the K-1 route is Form 3800's. Changes dollars only for the TMT limit (line 4e is a specified credit).
18. **A trust K-1 code J.** The fiduciary's statement splits the credit (`irs-1041k1-inst-2025::sec::note-form-1041-t-allocation-of-estimated-tax-payments-to::b02`); the trust box table has no route. Line 14 is unsupported. Form 1099-PATR box 12 and a K-1 stated by hand enter as a stated Form 3800 credit from "8835 Part II" with the entity's EIN.
19. **Lines 16 and 17 are blank.** They are for cooperatives, estates and trusts (`face-part-ii-2::b01`, `line-16::b01`). No dollars.
20. **The rates of a fiscal year.** "If you have sales in 2025 and 2026 ... make separate calculations" (`part-ii-renewable-electricity-production::b01`). The engine has calendar year filers only. No dollars.

## Statute and instructions

The statute agrees with the line 7 percentages (`usc-26-2025::sec::s45::b-5`) and the bond fraction (`usc-26-2025::sec::s45::b-3`). The effective date of the energy community bonus (item 1) is in the statutory notes, which the library does not hold.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header, Part I lines 1 to 5 | stated rule |
| Part I line 6, 8 to 12 | stated rule; line 8 more than one box is own reading (item 4) |
| Part II line 1 rates | stated rule (the 2025 rates) |
| Lines 2 to 4 | stated rule |
| Lines 5a to 6 | stated rule; before August 17, 2022 unsupported (item 11) |
| Lines 7a to 8 | stated rule |
| Lines 9 to 13 | stated rule; line 11 before 2022 own reading (item 1) |
| Line 14 | stated rule; trust K-1 unsupported (item 18) |
| Line 15 and the Form 3800 split | stated rule; the split by kilowatt-hours is own reading (item 10) |
| Lines 16 and 17 | stated rule (blank for an individual) |

## Proposals for a discussion

None.
