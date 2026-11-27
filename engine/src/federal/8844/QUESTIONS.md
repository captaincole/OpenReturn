# Form 8844 — doubts and defaults

The engine fills Form 8844 for an individual who employs people in an empowerment zone through a Schedule C business or a Schedule F farm. The instructions (Rev. December 2021) publish no example with numbers, and no filled example was found on the web (2026-11-27). The tests are the stated rules, limit tests, and the synthetic taxpayers `jaret` (a business, with a K-1 credit) and `marin` (a farm, with a work opportunity credit). Section 1396 and 26 CFR 1.1396-1 were read in the law library on 2026-11-27 (items 9, 10 and 11).

## Confidence by field group

| Field group                                                             | Confidence                                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Header (name, SSN)                                                      | Stated rule                                                                 |
| Line 1 (qualification tests, $15,000 limit, work opportunity reduction) | Stated rule; the end of the 90 days is a decision (item 9); item 10 statute |
| Line 2 (20%)                                                            | Stated rule                                                                 |
| Line 3 (K-1 and stated pass-through credits)                            | Stated rule                                                                 |
| Line 4                                                                  | Stated rule (the form's arithmetic)                                         |
| Lines 5 and 6 (cooperatives, estates, trusts)                           | Stated rule: blank on an individual's return                                |
| Schedule C line 26, Schedule F line 22 (wage deduction less line 2)     | Stated rule; the split among employers is own reading (item 2)              |
| Form 3800 Part III line 3                                               | Stated rule                                                                 |
| Schedule CA (540) line 3 column B (the wages given back)                | Statute (item 11): no FTB text names Form 8844                              |

## Two texts conflict

### 9. An employee still employed who has fewer than 90 days at year end

- Source: "Any individual employed by the employer for less than 90 days. For exceptions, see Early termination of employee, later" (`irs-8844-inst-2025::sec::qualified-zone-employees::b01`). "Generally, an individual is not a qualified zone employee unless employed for at least 90 days" (`qualified-zone-employees::b03`). Section 1396(d)(2)(C) has the same words (`usc-26-2025::sec::s1396::d-2`), and 26 CFR 1.1396-1 does not discuss the 90 days. No text says whether the count ends with the tax year.
- Decided (DECISION comment above `isQualifiedZoneEmployee` in `lines.ts`; `docs/rule-decisions.md` row A103): the answer `employedAtLeast90Days` counts the days by December 31. An employee hired on October 13, 2025, still employed with 80 days at year end, does not count on the 2025 return.
- Other reading: count her, because her employment passes 90 days in January 2026, before the return is filed. The blind fill took this reading.
- Dollars: $6,000 of her wages is $1,200 of credit, and Schedule C line 26 moves by $1,200. The decision claims less.

## Should we do this now

### 1. The qualification tests are the taxpayer's answers

- Source: "Performs substantially all of the services for that employer within an empowerment zone ... and Has his or her principal residence within that empowerment zone while performing those services" (`irs-8844-inst-2025::sec::empowerment-zones::b02`); the list of persons who are not qualified (`qualified-zone-employees::b01`, `::b02`).
- Default: the fact holds one yes/no answer for each test, and `zoneWages` holds only the wages for the time the person lived and worked in the zone. The engine applies the tests; it does not check the zone map, the 5% ownership under section 318, or the farm asset test of $500,000.
- Not now: the zone map and the ownership tests are facts only the taxpayer knows, so Cade asks them.

### 2. Line 2 split among the businesses that paid the wages

- Source: "you must reduce your deduction for salaries and wages ... by the line 2 credit amount" (`line-2::b01`). Schedule C line 26 and Schedule F line 22 each name Form 8844 (`irs-1040sc-inst-2025::sec::line-26::b01`, `irs-1040sf-inst-2025::sec::line-22::b01`).
- Done: line 2 is split by each employer's counted wages, in whole dollars that add to line 2 (`prorateDollars`). Each share lowers its own schedule's wages. At most $1 moves between two schedules.

### 3. The wage deduction goes down even when Form 8844 is decided off

- Source: "You must make this reduction even if you cannot take the full credit this year because of the tax liability limit" (`line-2::b01`).
- Default: the reduction is applied where the facts are read (`facts/kinds/activitiesOnReturn.ts`, `facts/kinds/farm.ts`), which cannot see a decision. So with `decisions.scope.must_file_8844` false and employee facts present, the wages still go down while no credit is claimed.
- Not now: a Cade answer of "do not claim" should drop the employee facts instead; the case changes dollars only then.

### 4. A spouse's business on a joint return is one employer with the taxpayer's

- Source: none for individuals; "Members of a controlled group ... and businesses under common control are treated as a single employer" (`line-2::b01`).
- Default: one fact per employee and employer. An employee of two of the return's businesses would need two facts, and the $15,000 limit would then apply to each.
- Not now: only an employee of two businesses on one return reaches it.

### 5. A farm's stated employment credits

- Source: Schedule F line 22 names Forms 5884, 8844, 8932 and 8994 (`irs-1040sf-inst-2025::sec::line-22::b01`).
- Done: the farm fact's `employmentCredits` holds the credits no employee fact figures; the engine adds the Form 5884 credit and the Form 8844 share of the farm's employee facts (`FARM_LABOR_CREDITS` in `facts/kinds/farm.ts`). The field's comment says so. California Schedule CA line 6 column B gives back the labor hired those two credits took off, in one amount (item 11). A farm that states a credit in `employmentCredits` stays a gap on line 6, because the farm fact does not split the stated credits by form.

### 6. A stated own line 3 credit while Form 8844 files

- Source: "All other filers figuring a separate credit on earlier lines must report the above credits on line 3" (`line-3::b01`).
- Done: a `general_business_credit` fact for line 3 with no pass-through EIN is a gap on Form 3800 while the employee facts file Form 8844 (state the employees instead). A fact with an EIN is a pass-through credit and goes on Form 8844 line 3. No dollars change.

### 7. Zone wages above the deducted wages

- Done: when one employer's counted zone wages are more than its Schedule C line 26 or Schedule F line 22 wages, lines 1, 2 and 4 are a gap: the facts disagree.

### 8. The designation ends on December 31, 2025

- Source: "The credit is extended to December 31, 2025" (`what-s-new::b01`).
- Not now: 2025 wages count; a 2026 return needs a new check.

### 10. The work opportunity credit wages leave the zone wages

- Source: the instructions say only "The $15,000 amount for any employee is reduced by the amount of wages ... that are used in figuring the work opportunity credit (Form 5884)" (`irs-8844-inst-2025::sec::specific-instructions::b01`). The statute also says "The term 'qualified zone wages' shall not include wages taken into account in determining the credit under section 51" (`usc-26-2025::sec::s1396::c`, paragraph (3)(A)). The instructions do not contradict the exclusion; they leave it out. For `docs/law-findings.md`.
- Done (2026-11-27): `countedWagesOf` takes the work opportunity wages out of `zoneWages` and lowers the limit by them. The default is that those wages were paid while the person was a zone employee, so the fact's `zoneWages` includes them. Example: zone wages $9,800.50 with $6,000 of work opportunity wages count $3,800.50, not $9,000; the credit is $1,040 lower. `marin` does not change (Eliseo stays at $9,000).
- The same person in both facts (2026-11-27, after Form 5884 got rules): the Form 5884 employee fact and the zone employee fact do not name each other, and a name is not a match. So the zone fact keeps its own `workOpportunityCreditWages`. When the employer's own employees figure a Form 5884 credit, a qualified zone employee of that employer with the field not stated is a missing input of Form 8844 (`waitingOnWorkOpportunity` in `facts/kinds/empowermentZone.ts`): lines 1, 2 and 4 wait, Form 3800 waits on the same keys, and the wage deduction keeps only the Form 5884 reduction until Cade records the answer (0 for a person who is not certified). Without Form 5884 employee facts, an absent field is still none. `tests/unit/federal/creditsThatLowerDeductions.test.ts` holds the case.

### 11. California gives the reduced wages back

- Source: "The provisions of Section 280C(a) of the Internal Revenue Code (relating to rule for employment credits) shall not apply" (`ca-rtc-2025::sec::s17270::b`). No FTB text names Form 8844. Schedule CA line 3 adjustments come from "the difference between California and federal law relating to ... special credits", and Pub. 1001 puts the same reduction for the Work Opportunity Credit in column B (`ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b07`). For `docs/law-findings.md`: the statute decides where the FTB is silent.
- Done (2026-11-27): Schedule CA (540) line 3 column B adds the Schedule C wages that the Form 8844 credit took off, in one amount with the Form 5884 credit's (`wageCreditReduction` in `facts/kinds/activitiesOnReturn.ts`, `state/ca/schedule-ca/answerLines.ts`); line 6 column B does the same for a farm (`figuredLaborCreditReduction` in `facts/kinds/farm.ts`). The amount is the stated wages less the wages after both credits, so a dollar is given back once. Schedule CA (540NR) runs the same rules. Example: `jaret` as a California resident has $5,640 in column B and Form 540 line 14; California AGI is $117,224.
- Not now: FTB 3461 (California's excess business loss) does not see the larger California loss of a business with this credit; only a business loss above the limit reaches it.

## Pattern change

None. The fixes stay inside this form's fact kind, its lines and Schedule CA's line 3 and line 6 rules. Since the merge with Forms 5884 and 8846, the credits that lower a Schedule C line are one list (`BUSINESS_CREDIT_REDUCTIONS` in `facts/kinds/activitiesOnReturn.ts`) and those that lower Schedule F line 22 another (`FARM_LABOR_CREDITS` in `facts/kinds/farm.ts`); a new credit form adds one entry. How facts and forms work does not change.

## Blind fill

- 2026-11-27, 15 cases filled by hand from the blank form and the instructions only. Every line matches the engine, blank against 0 included, except case 6 (item 9): the blind fill counted the employee with 80 days at year end, so its lines 1, 2 and 4 are $6,000, $1,200 and $1,200 higher and its Schedule C line 26 is $1,200 lower. The engine keeps its decision.
- The blind fill's other doubts change no dollars: line 2 is 20% of the rounded line 1 (the engine does the same), the split of line 2 between a Schedule C and a Schedule F (item 2; the same dollars in its case), and line 3 blank with no K-1 credit (the engine does the same).

## Second opinions

- **PolicyEngine-US** 2.154.1 (commit 0fbed6ddb1, 2026-11-26): it does not model the empowerment zone employment credit. No variable or parameter under `gov/irs` names it, so nothing was compared.
- **Other projects.** The repository names no other reference implementation that models Form 8844. IRS Direct File (issue #140) does not support business credits.

## Rows and limits

Form 8844 has no rows per employee or per entity: lines 1 to 4 are totals, so no count of employees or K-1s runs past the form. Form 3800 Part V lists each employer's share and each K-1 as its own row, by Form 3800's own rules.

## Proposals for a discussion

- **A rental property as the employer.** Schedule E has no wage line; the wages are in line 19 (other) or line 9 (insurance) and so on. The fact rejects a rental key (a gap). The proposal: a rental fact field for wages paid, reduced the same way.
- **A passive business's credit** goes to Form 8582-CR as Worksheet 4 (`activity.rentalRealEstate` false). The business fact's material participation answer decides it. A passive Schedule C also changes Schedule SE and other forms, which is outside this form.
