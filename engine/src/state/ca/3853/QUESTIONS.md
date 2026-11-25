# FTB 3853 — open points

The rules come from ca-3853-inst-2025. No answer key exists. Each point below is a place the form and its instructions do not settle a rule. Block ids drop the `ca-3853-inst-2025::sec::` prefix.

## Two texts conflict

Decided by the author, not reviewed by a person. Each has a `DECISION` comment in `penalty.ts` and a row in `docs/rule-decisions.md` ("Decided by the author, waiting for a person's review").

- **Which threshold.** Part II compares household income with the AGI chart (`line-1-applicable-household-income-or-gross::b01`). Step 4 uses the gross income chart (`step-2-flat-dollar-amount::b04`). The engine follows Step 4. Changes dollars.
- **A person they can claim but do not.** The Definitions add the MAGI of "each individual in your applicable household" who must file (`part-iii::b05`), and the household includes such a person (`part-iii::b02`). Step 3 question 4 adds only "the dependents you claimed" (`step-2-flat-dollar-amount::b02`), and the Marketplace worksheet line 3 counts only "each claimed dependent who must file" (`members-of::b05`). The engine follows Step 3: the person's MAGI prints in Part I and is not counted, and their nontaxable social security is not on worksheet line 3. In `lelaine` the penalty is $1,173, not $1,615.

## Should we do this now

Each point is a reading with no conflicting text. Each is done as stated, unless it says why not.

1. **Worksheet B line 14 is rounded.** "Divide line 13 by 12.0. Enter the result on line 2 and line 3" (`name-jan-...::b02`). No rounding is stated. The penalty line takes whole dollars, so the engine rounds line 14 to the nearest dollar. Line 4 is whole dollars, so rounding at the end gives the same result. No dollar change.
2. **Line 3 of the Penalty Worksheet with Worksheet B.** The worksheet says "Enter the larger of line 1 or line 2" (`yes-continue::b02`). Worksheet B says to enter line 14 on line 2 and line 3. The engine enters line 14 on line 3. Line 14 is never below Worksheet A line 7, so the result is the same. No dollar change.
3. **The short coverage gap.** "A gap in coverage of 3 continuous months or less" (`federal-poverty-line::b01`). The engine counts a gap as continuous months with no coverage, no stated exemption, no birth month and no code A. A month with another exemption ends the gap. The text does not say this. Can change dollars when an exemption month sits inside a gap.
4. **"The first gap."** "If an individual had more than one short coverage gap during the year, the individual is exempt only for the month(s) in the first gap" (`federal-poverty-line::b01`). The engine reads this as the first short gap: a long gap before it does not use up the exemption. Can change dollars.
5. **A gap that continues into 2026.** The instructions count 2024 months for a gap that starts in January (`example-2-4::b01`), and say nothing about 2026. The engine ends a gap at December. Can change dollars.
6. **Code I from a 2025 birth.** "The months before and including the month that an individual was added to your applicable household by birth" (`coverage-exemption-granted-by::b02`). The engine fills I through the birth month from the date of birth. An adoption is a stated code I. No dollar change against the text.
7. **Code B covers the year.** "Enter code 'B' in Part III, column (a)" (`example-2-2::b02`). The engine applies a stated B to all 12 months. No dollar change.
8. **Age 18 by month.** "An individual is considered 18 for an entire month if they turn 18 on the first day of the month" (`step-2-flat-dollar-amount::b01`). The engine counts a person as 18 from the month after the 18th birthday, or from the birthday's month when it is the first day. No dollar change against the text.
9. **California tax-exempt interest.** Step 3 question 2 uses Schedule CA (540) line 2a and line 2b columns B and C. The engine does not compute those lines yet. With no tax-exempt interest and no U.S. obligation interest, the amount is 0. Otherwise the household income is a floor (the amount is at least 0). The floor settles the penalty only when the bronze amount caps it; else the penalty and Part I line 1 are unsupported. Changes dollars only through the unsupported case.
10. **Gross income for Part II.** Gross income is a stated answer. The engine asks it only when the household income holds amounts that gross income does not (tax-exempt interest, a claimed dependent's own MAGI) and the California wages are not over the threshold. Gross income is at least Form 540 line 17, so the test fails when line 17 is over the threshold. No dollar change.
11. **Part I MAGI of a member who does not file.** "Enter the MAGI for each person" (`modified-adjusted-gross-income-magi::b01`). The engine prints a stated MAGI, an FTB 3803 child's MAGI, or nothing. No dollar change.
12. **Parts I and III with Part II checked.** The form's Part I heading says "List all members of your applicable household whether or not they have an exemption". Part II line 1 says "If you check the box in Part II, line 1, you do not have to complete Part III" (`line-1-applicable-household-income-or-gross::b01`). The engine fills Part I, with its Modified AGI, and leaves Part III blank. The corpus block `part-i::b01` ends "you will need to complete": the parser read the sentence's last words, "Part III", as the next section heading (`part-iii::b01` follows it). The first rules left Part I blank on that cut text; the blind fill found it (cases 4, 5, 13). Changes the printed Part I line 1 amount, not the penalty.
13. **Line 1 with no penalty.** With no X month, or with Part II checked, line 1 is blank, not 0. No dollar change.
14. **Middle initial of a dependent.** The dependent fact has no middle initial, so it prints blank. No dollar change.
15. **Three codes in a month.** The form has two fields a month. The engine keeps the first two stated codes. No dollar change.
16. **Form 540 line 114.** The instructions add line 111, line 112 and line 113 (`ca-540-inst-2025::sec::line-114-total-amount-due::b01`). The engine adds lines 94 and 96 to its existing sum. A return with no FTB 3853 penalty is unchanged.
17. **Whose gross income Part II tests.** "compare ... your gross income to the California gross income filing threshold" (`line-1-applicable-household-income-or-gross::b01`). The text does not say whether a dependent's own income counts. The engine tests the gross income of the filers' own return, as the blind fill did. Example: parents with gross income $55,000 and a child who must file with MAGI $10,000 (household income $65,000, threshold $61,720) check Part II and owe nothing; Step 4 alone gives $2,375. Changes dollars.
18. **Age 18 against the federal rule.** The FTB rule is "considered 18 for an entire month if they turn 18 on the first day of the month" (point 8). The federal day-before rule ("You are considered age 65 on the day before your 65th birthday", `irs-1040sr-inst-2025::sec::age-65::b01`) is written for age 65 on other forms, so it does not apply here. It would make the month before a first-of-month birthday an adult month too. The engine follows the FTB text. About $16 of penalty in the blind case with a September 1 birthday.
19. **Form 540 lines 97, 99 and 115 print 0 with a tax due.** In `lelaine` these lines print 0 where the paper return would leave them blank. Not now: it is a Form 540 rule from before this form, and Form 540 changes wait for a person. No dollar change.

## Pattern change

- **A household member who is not on the return.** Before, every person the engine knew was a filer or a claimed dependent. After, a coverage fact (`ca_health_coverage.unclaimed.<slug>`) names a person the taxpayer can claim but does not, with their own name, SSN and date of birth.
- **Form 540 line 114 adds the penalty balance.** Before, line 114 added lines 100, 110, 112 and 113. After, it also adds lines 94 and 96, as line 111 does (point 16); a return with no use tax balance and no FTB 3853 penalty is unchanged.

## Unsupported

| Field or case | Why |
| --- | --- |
| Line 1, Part II and Part III for a married filer filing separately | The chart combines both spouses' income; the threshold for one spouse's household is not settled. |
| Line 1 for a Form 540NR filer | Form 540NR has no rules in the engine. |
| Line 1 and Part I line 1 MAGI with tax-exempt or U.S. obligation interest | Schedule CA (540) line 2a and line 2b columns B and C are not computed (point 9), unless the bronze amount caps the penalty. |
| Codes with an affordability test and tax-exempt interest | Code A compares a contribution with the exact household income. |
| Part I ECN 3 with more than three ECNs | The other ECNs go on a statement that is not modeled. |
| Row 12 with more than 12 members | The instructions give no continuation statement. |
| A qualifying surviving spouse with no dependents | The chart has no column for it. |

## Second opinions

- PolicyEngine-US 2.153.8 (commit b3edc044), `variables/gov/states/ca/`, `parameters/gov/states/ca/` and `parameters/gov/aca/`. Compared on 2026-11-24.
  - It does not model FTB 3853, the California individual mandate or its filing threshold chart. No formula or constant to compare.
  - Its `gov/aca/required_contribution_percentage` table is the federal premium tax credit's applicable percentage (IRC 36B). The 7.28% affordability rate here is a different rule (`lines-1-12-2::b03`). Not compared.
- IRS Direct File: federal only, no California forms. No checkout is reachable from this project (issue #140). Not compared. The repo names no other reference implementation for this form.

## Confidence by field group

| Fields | Confidence |
| --- | --- |
| Header (name, SSN) | stated rule |
| Part I names, SSN, date of birth, ECNs | stated rule |
| Part I Modified AGI | published example with numbers (Lisa and Jason, Jake's FTB 3803 MAGI); blind fill (15 cases) agrees |
| Part II box | published example with numbers (Lisa and Jason); own reading for the threshold (decided) |
| Part III codes Z, X, stated codes | stated rule |
| Part III code C | published examples (Chris, Roger, Sam) |
| Part III code A | published examples with numbers (Jackie, Sharon, Ethan, April) |
| Part III code I | stated rule; own reading for the birth month (point 6) |
| Part IV line 1, no Worksheet A | published example with numbers (ftb.ca.gov page: 2,375 and 3,457) |
| Part IV line 1, Worksheets A and B | stated rule; no published example; limit tests; blind fill (15 cases) agrees |
| Form 540 lines 92, 96, 114 | stated rule |

## Proposals for a discussion

- **Schedule CA (540) line 2 interest.** Computing line 2a and line 2b columns B and C (U.S. obligation interest, other states' bonds) would make California tax-exempt interest exact. It needs the state of each tax-exempt bond on the 1099-INT fact. That is a change to Schedule CA, not to this form.
- **Coverage documents.** Forms 1095-A, 1095-B and 1095-C show the months of coverage. Today the months are a stated answer. Reading the documents would be a new family of input documents.
