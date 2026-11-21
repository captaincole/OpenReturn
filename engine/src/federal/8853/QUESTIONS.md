# Form 8853 (2025): open questions

Each item is a place where the form and its instructions do not settle a rule. The engine applies the default shown. Block ids are in the corpus (`irs-8853-inst-2025` unless named).

## 1. Line 3: a deductible outside the HDHP range

- Source: "Enter annual deductible (must be at least $2,850 but not more than $4,300)" (`::start-here::b01`).
- Doubt: the chart does not say what to enter for a plan outside the range.
- Default: such a plan is not an HDHP, so the holder is not an eligible individual that month: -0-.
- Changes dollars: yes (line 3, so line 5).

## 2. Line 3: being someone's dependent

- Source: "You must not be enrolled in Medicare and can't be another person's dependent" (`::section-a-archer-msas::b01`); "you can't deduct contributions if you are someone else's dependent" (`::figuring-your-archer-msa-deduction::b02`).
- Doubt: the chart has no row for it.
- Default: the coverage answer counts only months as an eligible individual, so a dependent states 0 months. No separate fact.
- Changes dollars: no, if the answer is given as defined.

## 3. Lines 9a/9b: which part of line 8 is excepted

- Source: "Enter on line 9b only 20% (0.20) of any amount included on line 8 that doesn't meet any of the exceptions" (`::exceptions-to-the-additional-20-tax::b01`).
- Doubt: line 8 is net of line 7. The instructions do not say how line 7 is spread across distributions that do and do not meet an exception. A 1099-SA has no date.
- Default: every distribution excepted (code 3, or a holder 65 by the end of 2024) → all of line 8; none excepted (a holder born after January 1, 1961, no code 3) → none; otherwise the taxpayer states the excepted part (`hsa.archer_msa.excepted_taxable_distributions`). A stated answer always wins.
- Changes dollars: yes (line 9b).

## 4. "Turns age 65"

- Source: "distributions made after the date that the account holder ... Turns age 65" (`::exceptions-to-the-additional-20-tax::b01`).
- Doubt: whether the IRS rule "you reach an age the day before your birthday" applies.
- Default: it applies. A January 1, 1960 birthday reaches 65 on December 31, 2024, so every 2025 distribution is excepted.
- Changes dollars: yes, for that one birthday.

## 5. Line 13b: excepted part of line 12

- Source: "if either of the exceptions applies to all the distributions included on line 12, enter -0- on line 13b. Otherwise, complete the Additional 50% Tax Worksheet" (`::exceptions-to-the-additional-50-tax::b01`).
- Default: as item 3, with code 3 (disability) the only signal; mixed codes ask for the excepted part.
- Changes dollars: yes (line 13b).

## 6. Worksheet line 2 when the account was worth 0

- Source: "Did you have a Medicare Advantage MSA on December 31, 2024? No. STOP Enter one-half of line 1" (`::additional-50-tax-worksheet-line-13b::b01`).
- Default: a value of 0 is the "No" answer. The result is the same either way: line 5 is 0 and line 6 is line 1.
- Changes dollars: no.

## 7. Line 25 below zero

- Source: "Per diem limitation. Subtract line 24 from line 23" (the form). No "if zero or less".
- Doubt: reimbursements above line 23 would make line 25 negative and line 26 larger than line 20.
- Default: line 25 is at least 0. Section 7702B(d)(2) speaks of an excess, which cannot be negative.
- Changes dollars: yes, only when reimbursements exceed both line 21 and line 22.

## 8. Line 19 and line 16 from Form 1099-LTC box 5

- Source: "Include only amounts you received while the insured was a chronically ill individual" (`::line-19::b01`).
- Doubt: box 5 is optional on Form 1099-LTC, and one form can cover a redesignation within the year.
- Default: box 5 decides per form; with no box 5 on any form, line 16 is asked (`medical.ltc.insured_terminally_ill`) and a form's box 2 counts on line 19 when the insured was not terminally ill. A redesignation within one form is not split.
- Changes dollars: yes (line 19, so line 26).

## 9. Line 24 and contracts issued before August 1, 1996

- Source: "Generally, don't include on line 24 reimbursements ... under a contract issued before August 1, 1996" (`::line-24::b01`).
- Default: line 24 is the taxpayer's stated total (`medical.ltc.reimbursements`); the taxpayer applies the caution. No fact records a contract's issue date.
- Changes dollars: yes, when such a contract exists.

## 10. One LTC period

- Source: "If you have more than one LTC period, you must separately calculate the taxable amount ... on separate Sections C" (`::line-18::b01`).
- Default: the engine takes one period (`medical.ltc.period_days`) and prints one Section C. The answer cannot say there were two.
- Changes dollars: yes, when the rate changed during the year (Method 2).

## 11. Excess employer contributions

- Source: "If the excess wasn't included in income on Form W-2, you must report it as 'Other income'" (`::excess-employer-contributions::b01`).
- Default: not modeled. No Form 8853 line holds it, and no fact says whether box 1 included it. Excess contributions you make go to Form 5329, which has no rules yet.
- Changes dollars: yes, when an employer contributed more than the limit.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header names and SSNs | stated rule (`::specific-instructions::b01`) |
| Line 1 (W-2 code R) | stated rule (`::line-1::b01`) |
| Line 2, line 4 | stated rule (taxpayer answers) |
| Line 3 chart | stated rule; out-of-range deductible own reading (item 1) |
| Line 5, employer contributions bar | stated rule (`::how-to-complete-part-i::b01`) |
| Lines 6a–8 | stated rule (the form) |
| Lines 9a/9b | stated rule with examples, no amounts; split own reading (items 3, 4) |
| Lines 10–12 | stated rule (the form) |
| Lines 13a/13b, worksheet | stated rule; split own reading (item 5) |
| Section C header, 14a, 14b | stated rule (1099-LTC) |
| Lines 15, 16 | stated rule; box 5 reading own (item 8) |
| Lines 17–20 | stated rule (the form) |
| Lines 21–26 | published example with numbers (Examples 1 and 2); line 25 floor own reading (item 7) |
| Multiple payees (line 15 Yes) | unsupported: the aggregate statement and allocation are not modeled |
| Two holders in Part I or Section B, codes 4–6 | unsupported |
| More than one Section C | unsupported |
