# Form 8844 — doubts and defaults

The engine fills Form 8844 for an individual who employs people in an empowerment zone through a Schedule C business or a Schedule F farm. The instructions (Rev. December 2021) publish no example with numbers, and no filled example was found on the web (2026-11-27). The tests are the stated rules, limit tests, and the synthetic taxpayers `jaret` (a business, with a K-1 credit) and `marin` (a farm, with a work opportunity credit). The law library was not installed, so section 1396 was not read.

## Confidence by field group

| Field group                                                             | Confidence                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| Header (name, SSN)                                                      | Stated rule                                                    |
| Line 1 (qualification tests, $15,000 limit, work opportunity reduction) | Stated rule; the end of the 90 days is own reading (item 9)    |
| Line 2 (20%)                                                            | Stated rule                                                    |
| Line 3 (K-1 and stated pass-through credits)                            | Stated rule                                                    |
| Line 4                                                                  | Stated rule (the form's arithmetic)                            |
| Lines 5 and 6 (cooperatives, estates, trusts)                           | Stated rule: blank on an individual's return                   |
| Schedule C line 26, Schedule F line 22 (wage deduction less line 2)     | Stated rule; the split among employers is own reading (item 2) |
| Form 3800 Part III line 3                                               | Stated rule                                                    |

## Doubts with no conflicting text

### 1. The qualification tests are the taxpayer's answers

- Source: "Performs substantially all of the services for that employer within an empowerment zone ... and Has his or her principal residence within that empowerment zone while performing those services" (`irs-8844-inst-2025::sec::empowerment-zones::b02`); the list of persons who are not qualified (`qualified-zone-employees::b01`, `::b02`).
- Default: the fact holds one yes/no answer for each test, and `zoneWages` holds only the wages for the time the person lived and worked in the zone. The engine applies the tests; it does not check the zone map, the 5% ownership under section 318, or the farm asset test of $500,000.
- Changes dollars: no.

### 2. Line 2 split among the businesses that paid the wages

- Source: "you must reduce your deduction for salaries and wages ... by the line 2 credit amount" (`line-2::b01`). Schedule C line 26 and Schedule F line 22 each name Form 8844 (`irs-1040sc-inst-2025::sec::line-26::b01`, `irs-1040sf-inst-2025::sec::line-22::b01`).
- Default: line 2 is split by each employer's counted wages, in whole dollars that add to line 2 (`prorateDollars`). Each share lowers its own schedule's wages.
- Changes dollars: at most $1 between two schedules.

### 3. The wage deduction goes down even when Form 8844 is decided off

- Source: "You must make this reduction even if you cannot take the full credit this year because of the tax liability limit" (`line-2::b01`).
- Default: the reduction is applied where the facts are read (`facts/kinds/activitiesOnReturn.ts`, `facts/kinds/farm.ts`), which cannot see a decision. So with `decisions.scope.must_file_8844` false and employee facts present, the wages still go down while no credit is claimed. Section 1396 has no election out in the instructions, so the credit is still "determined".
- Changes dollars: yes, only in that rare case. A Cade answer of "do not claim" should drop the employee facts instead.

### 4. A spouse's business on a joint return is one employer with the taxpayer's

- Source: none for individuals; "Members of a controlled group ... and businesses under common control are treated as a single employer" (`line-2::b01`).
- Default: one fact per employee and employer. An employee of two of the return's businesses would need two facts, and the $15,000 limit would then apply to each. Not checked.
- Changes dollars: only for an employee of two businesses on one return.

### 5. A farm's stated employment credits

- Source: Schedule F line 22 names Forms 5884, 8844, 8932 and 8994 (`irs-1040sf-inst-2025::sec::line-22::b01`).
- Default: the farm fact's `employmentCredits` now holds the other three; the engine adds the Form 8844 share. A farm fact that already counted the zone credit would reduce twice. The field's comment says so.
- Changes dollars: only for a fact written the old way. California Schedule CA line 6 is a gap for any farm with an employment credit (`state/ca/schedule-ca/answerLines.ts`), and stays one.

### 6. A stated own line 3 credit while Form 8844 files

- Source: "All other filers figuring a separate credit on earlier lines must report the above credits on line 3" (`line-3::b01`).
- Default: a `general_business_credit` fact for line 3 with no pass-through EIN is the credit of the taxpayer's own employees. When the employee facts file Form 8844, that fact is a gap on Form 3800 (state the employees instead). A fact with an EIN is a pass-through credit and goes on Form 8844 line 3.
- Changes dollars: no.

### 7. Zone wages above the deducted wages

- Default: when one employer's counted zone wages are more than its Schedule C line 26 or Schedule F line 22 wages, lines 1, 2 and 4 are a gap: the facts disagree.
- Changes dollars: no.

### 8. The designation ends on December 31, 2025

- Source: "The credit is extended to December 31, 2025" (`what-s-new::b01`).
- Default: 2025 wages count. A 2026 return needs a new check.
- Changes dollars: not for 2025.

### 9. An employee still employed who has fewer than 90 days at year end

- Source: "Any individual employed by the employer for less than 90 days. For exceptions, see Early termination of employee, later" (`irs-8844-inst-2025::sec::qualified-zone-employees::b01`). "Generally, an individual is not a qualified zone employee unless employed for at least 90 days" (`qualified-zone-employees::b03`). Neither text says whether the 90 days end with the tax year. The law library was not installed, so section 1396 was not read.
- Default: the answer `employedAtLeast90Days` counts the days by December 31. An employee hired on October 13, 2025, still employed with 80 days at year end, does not count on the 2025 return.
- Other reading: count her, because her employment passes 90 days in January 2026, before the return is filed. The blind fill took this reading.
- Changes dollars: yes. Example: $6,000 of her wages is $1,200 more credit, and Schedule C line 26 is $1,200 lower. The default claims less credit; the statute should settle it.

## Blind fill

- 2026-11-27, 15 cases filled by hand from the blank form and the instructions only. Every line matches the engine, blank against 0 included, except case 6 (item 9): the blind fill counted the employee with 80 days at year end, so its lines 1, 2 and 4 are $6,000, $1,200 and $1,200 higher and its Schedule C line 26 is $1,200 lower. The engine keeps its default.
- The blind fill's other doubts change no dollars: line 2 is 20% of the rounded line 1 (the engine does the same), the split of line 2 between a Schedule C and a Schedule F (item 2; the same dollars in its case), and line 3 blank with no K-1 credit (the engine does the same).

## Second opinions

- **PolicyEngine-US** 2.154.1 (commit 0fbed6ddb1, 2026-11-26): it does not model the empowerment zone employment credit. No variable or parameter under `gov/irs` names it, so nothing was compared.
- **Other projects.** The repository names no other reference implementation that models Form 8844. IRS Direct File (issue #140) does not support business credits.

## Proposals for a discussion

- **A rental property as the employer.** Schedule E has no wage line; the wages are in line 19 (other) or line 9 (insurance) and so on. The fact rejects a rental key (a gap). The proposal: a rental fact field for wages paid, reduced the same way.
- **A passive business's credit** goes to Form 8582-CR as Worksheet 4 (`activity.rentalRealEstate` false). The business fact's material participation answer decides it. A passive Schedule C also changes Schedule SE and other forms, which is outside this form.
