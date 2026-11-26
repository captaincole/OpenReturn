# Form 7206: open questions

Each place where the form and its instructions do not settle a rule. Short answers.

## 1. Who files: the worksheet or the form

- Source: "Generally, you can use the worksheet in the Form 1040 instructions to figure your deduction. However, if any of the following apply, you must use Form 7206." (irs-7206-inst-2025::sec::general-instructions::b04, ::b05; irs-1040-inst-2025::sec::line-17::b06)
- Default: Form 7206 files for more than one plan, more than one source of self-employment income, Form 2555, or long-term care premiums. Otherwise no form files, and Schedule 1 line 17 takes the same arithmetic, which equals the worksheet's line 3.
- A "source" counts every Schedule C business and farm on the return, a losing one too, and every partnership K-1 with box 14 code A. Filing the form is always allowed, so counting more never changes dollars.
- An S corporation plan next to self-employment income files the form: decision row A44 in `docs/rule-decisions.md`.
- Changes dollars: no.

## 2. A business with no net profit

- Source: "One of the following statements must be true. You were self-employed and had a net profit for the year" (irs-7206-inst-2025::sec::general-instructions::b01).
- Default: the plan's line 4 prints the loss; line 6 is 0; line 14 is 0. Line 5 leaves the loss out (the form's line 5).
- Other reading: line 4 is 0, because a loss is not a "net profit" (irs-7206-face-2025::sec::face-page-1::b01, line 4: "Enter your net profit* and any other earned income**"). The blind fill and PolicyEngine-US (`max_(0, …)` on line 4) both read it so. Then lines 8, 10 and 13 print 0, not the loss. The text does not settle it: line 5 says "Don't include any net losses", line 4 says nothing. The engine keeps the loss.
- Changes dollars: no (line 14 is 0 either way; only lines 4, 8, 10 and 13 print differently).

## 3. Line 6 decimal places

- Source: "Divide line 4 by line 5" (irs-7206-face-2025::sec::face-page-1::b03). No rounding rule. Pub. 974 prints "1.0" (irs-pub-974-2025::sec::the-simplified-calculation-method-for-carla::b03).
- Default: 4 places, printed, and line 7 multiplies by the printed value. Never more than 1.
- Changes dollars: at most $1 on line 7 for each $20,000 of Schedule 1 line 15.

## 4. Line 9 with more than one business

- Source: line 9 takes line 16 "attributable to the same trade or business" (the form).
- Default: the plan fact states that part (`retirementPlanDeduction`). Absent, all of line 16 with one business or farm on the return; with more, the plan is a gap while line 16 has an amount. QBI reads line 16 the same way (`qbi/resolveInfo.ts`).
- Changes dollars: no (a gap, not a guess).

## 5. Line 12: the part of Form 2555 line 45

- Source: "Enter any amount from Form 2555, line 45, attributable to the amount entered on line 4 or 11 above" (irs-7206-face-2025::sec::face-page-1::b03). No rule shares line 45 out.
- Default: blank without the person's Form 2555. 0 when that form excludes no income of this kind (no line 20a business for a Schedule C or F plan; no wages, noncash income or allowances for an S corporation plan). All of line 45 when the form excludes only the income of the return's one business. Any other mix is a gap.
- A negative line 45 enters 0: the form asks for an amount attributable to earned income, and a negative one would raise line 13 above line 10.
- Changes dollars: yes, only for a negative line 45.

## 6. Schedule A and the premiums line 14 does not take

- Source: "any medical insurance payments not deductible on Schedule 1 (Form 1040), line 17, can be included as medical expenses on Schedule A" and "Don't include the amount on line 14 when figuring any medical expense deduction" (irs-7206-inst-2025::sec::general-instructions::b09). Pub. 502 Example 1: the excess for a nondependent child is not a medical expense (irs-pub-502-2025::sec::health-insurance-costs-for::b05).
- Default: Schedule A line 1 stays the stated `medical.expenses_total`. The engine adds nothing to it. The stated total must leave out line 14's premiums.
- Changes dollars: possibly, for an itemizer whose stated total leaves out the excess premiums.

## 7. Facts the engine does not have

- Optional methods (Schedule SE Part II): not modeled, so the asterisk rule (Schedule SE line 4b) never applies.
- Ministers (Pub. 517, irs-pub-517-2025::sec::health-insurance-costs-of::b02): no fact says a person is a minister. Not handled.
- Retired public safety officers: line 1 is stated without those amounts; the engine does not read the 1099-R election.
- "Other earned income" on lines 4 and 5 (gains from property the person created): no fact. Lines 4 and 5 take net profit only.
- Changes dollars: no for the cases the facts cover.

## 8. Line 13 below zero

- Source: line 13 "Subtract line 12 from line 10 or 11, whichever applies"; line 14 "Enter the smaller of line 3 or line 13" (irs-7206-face-2025::sec::face-page-1::b03, ::b04). A Form 2555 amount larger than line 10 makes line 13 negative, and no text says what line 14 does then.
- Default: line 13 prints the negative amount (the form's arithmetic); line 14 is 0, because a deduction on Schedule 1 line 17 cannot add income. The blind fill reads it the same way.
- Changes dollars: yes against a literal reading (blind case 12: a literal line 14 is −$2,119; the engine enters $0).

## Proposals for a discussion

- Partnership plans: Schedule SE needs a route for Schedule K-1 (Form 1065) box 14 code A. Then line 4 is the K-1's box 14 code A of that partnership, and the gap for other plans goes away.
- Marketplace plans with the premium tax credit: Pub. 974's simplified or iterative method would be a new loop between Form 8962 and Schedule 1 line 17. That is a change to how forms are evaluated, so it waits.
- An S corporation plan and QBI: the shareholder's deduction comes off the QBI "attributable to the trade or business", and the K-1 statement already gives the S corporation's QBI. A decision is needed on whether it comes off the statement's QBI. Until then the S corporation's QBI row is a gap.
- A spouse's business on a joint return waits for the spouse's Schedule SE.

## Second opinions

- Blind fill (14 cases, 2026-11-26): every line 14 matches. 21 lines differ only as blank against 0 (lines 1, 2 and 9 with nothing to enter). One case differs in dollars on printed lines: a loss in the plan's business (lines 4, 8, 10, 13: the engine prints −$3,000, the blind fill $0; question 2).
- PolicyEngine-US 2.154.0 (commit 363e9fc5, `self_employed_health_insurance_earned_income_limit.py`, `self_employed_health_insurance_ald_person.py`, `long_term_care_premium_limit.yaml`), compared 2026-11-26:
  - Line 2 limits for 2025 ($480, $900, $1,800, $4,810, $6,020; band tops 40, 50, 60, 70): the same.
  - Lines 3, 5, 7, 11, 14: the same formula (line 5 leaves out losses; line 7 shares Schedule 1 line 15 by line 6; line 14 the smaller of line 3 and the limit).
  - Line 4 with a loss: PolicyEngine enters 0 (question 2). No dollars change.
  - Line 6: PolicyEngine keeps the full fraction; the engine keeps 4 places (question 3).
  - Line 10: PolicyEngine floors each business at 0; the engine floors line 14 (question 8). Same deduction.
  - Scope differences, not bugs: PolicyEngine adds every Schedule C business into one line 4, gives all of Schedule 1 line 16 to Schedule C, and treats line 12 as already netted in its inputs.
- IRS Direct File: not compared. The repo names no Direct File checkout, and Direct File did not support Schedule C or this deduction.

## Confidence by field group

| Field group | Confidence |
| --- | --- |
| Header name and TIN | stated rule (the return's names and SSN) |
| Line 1 | stated rule (the amount stated) |
| Line 2 | stated rule (the age table; the shared limit across forms) |
| Line 3 | stated rule |
| Lines 4, 5 | published example with numbers (Pub. 974, Carla) |
| Line 6 | published example with numbers; own reading for the places (question 3) |
| Lines 7–10 | published example with numbers (Pub. 974, Carla) |
| Line 11 | stated rule |
| Line 12 | own reading (question 5) |
| Line 13 | published example with numbers (Pub. 974, Carla) |
| Line 14 | published example with numbers (Pub. 502, Example 2; Pub. 974) |
| Schedule 1 line 17 | stated rule |
| Schedule CA line 17 column A | stated rule |
| Form 8995 line 1(c), 8995-A line 2 | stated rule; unsupported next to an S corporation plan |
