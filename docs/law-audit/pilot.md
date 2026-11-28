# Law audit: pilot run

Run on 2026-11-27, on three forms: Form 8959 (simple), Form 8582 (compound) and California's Form FTB 3514. No binding was changed. The working files (every claim, every law answer, every flag) are in `.scratch/law-audit/<form>/` of the `law-audit-pilot` worktree.

## The process

| Stage | Who | Reads | Writes |
| --- | --- | --- | --- |
| 1. Code reader | Sonnet | the form's code only | `fields.json` (a kind for each field), `claims.json` (single claims) |
| 2. Blind step | script | `claims.json` | `questions.json`: the questions with no code answers |
| 3. Law reader | Sonnet | the form face, instructions, statute, regulations; never the code | `law.json`: one answer per question, each text's own answer, quotes |
| 4. Quote check | script | `law.json` and the stored blocks | pass or fail for each quote, word for word |
| 5. Comparer | Sonnet | `claims.json` and `law.json` only | `compare.json`: agrees or flag, with a class |
| 6. Verification | Fable | each flag, the code, the stored text; a sample of "agrees" | the findings below |

## One claim through the six stages

The young child tax credit on Form 3514 is a compound rule. The code reader split it into separate claims: the maximum amount, the threshold (C43), the reduction (C42), the floor, and whether the count of children matters (C45). This is claim `3514-C42`.

**Stage 1, code reader** (from `engine/src/state/ca/3514/youngChildAndFosterYouth.ts:56`):

> Question: "What is the maximum young child tax credit and what reduces it?"
> Code answer: "1,189 for one claimant. When earned income (line 19) is over 27,425, the credit is reduced by 21.71 for each 100 of the excess over 27,425 (excess divided by 100, times 21.71, cut to two decimals with no rounding). Credit = 1,189 minus the reduction. If that is 0 or less, 0; if between 0 and 1, entered as 1; if over 1, rounded to the nearest whole dollar."

**Stage 2, blind step.** The law reader gets the question and the field name. It does not get the code answer.

**Stage 3, law reader.** It marked the texts `unclear` and gave each text's own answer:

- Instructions (`ca-3514-inst-2025::sec::line-26-and-line-27::b01`): "For every $100 over the threshold amount, your credit is reduced by $21.71."
- California statute (`ca-rtc-2025::sec::s17052.1::a-2-C-i`): "reduced by twenty dollars ($20) for each one hundred dollars ($100), or fraction thereof"
- Its note: "Statute: 'or fraction thereof' implies a $20 step for each started $100. Form lines 26 and 27 divide by 100 as a decimal to two places and multiply by $21.71 (no round-up). ... Example: $27,500 earned income, $75 over the threshold, statute-style reduction $21.71 versus form reduction $0.75 x 21.71 = $16.28."

**Stage 4, quote check.** All 4 quotes of this claim are in their blocks word for word. (Form 3514: 144 quotes, 0 failed.)

**Stage 5, comparer.** Flag, class 3: "Texts unclear: statute reduces per $100 or fraction thereof; form divides by 100 to two decimals. Engine follows the form (proportional, truncated). Example: $75 over gives 16.28 (form) versus 21.71 (stepwise)."

**Stage 6, verification.** I read the whole of section 17052.1(a)(2)(C) in the law file.

- Clause (i) has the words "or fraction thereof". Clause (ii)(III) replaces only the $20 with an amount the Franchise Tax Board calculates, for years from 2024. It does not replace the step.
- So the two texts are not unclear. They state two different methods. I changed the class from 3 to 2: the statute and the form disagree, and the engine follows the form.
- The Franchise Tax Board's $21.71 reaches zero at $32,901 only with the form's method: 54.76 hundreds times $21.71 is $1,189. That supports the form as the intended method, and the statute's words as the loose text.
- Dollars: with $75 over the threshold the credit is $1,173 (form, engine) or $1,167 (statute's step). The difference is never more than $21.71.

**Result:** finding 3514-B below.

## Findings

Ten findings stand. They come from 16 of the 40 flags, on 135 claims.

### Class 1: the bindings are wrong or incomplete

| Id | Form and line | What | Dollars |
| --- | --- | --- | --- |
| 8959-A | Form 8959 line 19 | The engine adds only Form W-2 box 6. The instructions also add uncollected Medicare tax in box 12, codes B and N (`irs-8959-inst-2025::sec::line-19::b01`). | Line 19 is too low by the box 12 amounts. Rare: tips and former employees. |
| 3514-A | Form 3514 line 4 | Investment income counts Form 8814 and Form 4797 as 0, with the comment "no fact kind" (`engine/src/state/ca/3514/lines.ts:35`). The engine now has both forms, and nothing guards the case. The same comment covers Schedule K-1 self-employment earnings on line 18; not checked whether another guard catches it. | A filer can pass or fail the $4,814 test wrongly. |
| 8582-A | Form 8582, which property is a rental | Only the 7-day rule is applied. The other exceptions (30 days with significant services, and four more, in 26 CFR 1.469-1T(e)(3)(ii) and the instructions) are taken not to apply, and no question asks. | Either way: such an activity is not a rental, so no $25,000 allowance, and it is passive only without material participation. |
| 8582-B | Form 8582, must file; lines 3 and 9 | The filing exception is not modeled, so the form prints when it is not required. A prior-year commercial revitalization deduction has no input. | None for the first. The second deduction ended in 2009. |

### Class 2: two official texts disagree, and the engine follows one

| Id | Form and line | Text A | Text B | Engine | Dollars |
| --- | --- | --- | --- | --- | --- |
| 3514-B | Form 3514 lines 26 to 28 and 37 to 39 | Statute: "for each one hundred dollars ($100), or fraction thereof" (`ca-rtc-2025::sec::s17052.1::a-2-C-i`, and section 17052.2) | Form: divide by 100 as a decimal, two places | The form | Up to $21.71 for each credit |
| 8582-C | Form 8582 line 6 | Instructions and Pub. 925: leave out "the deduction allowed for the deductible part of self-employment taxes" (`irs-8582-inst-2025::sec::line-6::b01`) | Statute, section 469(i)(3)(E): the list has sections 219, 221 and 250, and no self-employment tax deduction (`usc-26-2025::sec::s469::i-3-E`) | The instructions | A $5,000 deduction changes the allowance by $2,500, between $100,000 and $150,000 of income |

The code at Form 8582 line 6 cites section 469(i)(3)(F). The statute in the library has no (F); the list is (E).

### Class 3: a text is unclear, or wrong, or not in the library

| Id | Form | What |
| --- | --- | --- |
| 8959-B | Form 8959 line 10 | An error in the statute. Section 1401(b)(2)(B) reduces the threshold by wages used for "the tax imposed under section 3121(b)(2)" (`usc-26-2025::sec::s1401::b`). Section 3121(b) defines employment and imposes no tax. The regulation reads it as section 3101(b)(2) (`cfr-26-2025::sec::s1.1401-1::d-2-i`). The engine follows the form, which matches the regulation. No dollars. |
| 8959-C | Form 8959 Part III | The statute does not plainly carry the 0.9% to railroad compensation; the rule is in 26 CFR Part 31, which the library does not hold. The engine does not compute the part. |
| 3514-C | Form 3514 line 20 | Section 17052(a)(2) multiplies the credit by a factor that is 0% "unless otherwise specified in the annual Budget Act". The library does not hold the Budget Act, so the table's amounts cannot be checked against the law. The indexed threshold ($25,000 in the statute, $27,425 in the instructions) has the same limit. |
| 3514-D | Form 3514 lines 1a and 1b | After an earlier disallowance, the federal bar of 2 or 10 years (section 32(k)) may apply to California's credit through section 17052(a)(1). The texts do not say. The engine prints the answers and never denies the credit. |

### Class 4: a possible loophole

None stands. The comparer raised two on Form 8582, and both were rejected (below).

## What verification rejected, and why

24 of the 40 flags were rejected. The groups:

- **A guarded gap (3).** The engine does not model the case and keeps a question open or returns unsupported, so no wrong number prints. Example: a spouse's Schedule SE on Form 8959.
- **The two readings give the same result (7).** Example: the Form 8582 income line counts 0 for all passive income, and the statute removes only the passive loss. When the line matters, a passive loss exists, and the two are equal. Example: a married person who lives apart gets the $200,000 threshold in the statute, and that person files as head of household or single.
- **Rounding and printing (8).** Whole-dollar rounding is in the Form 1040 instructions. A ratio with five decimal places, the header, the row count and the row labels change no amount.
- **The rule works as written, or the engine already follows the stricter text (3).** The self-rental rule treats net income as nonpassive and a loss as passive. That is the regulation's purpose, and it works against the taxpayer.
- **A path that cannot run today (2).** Example: Form 8959 line 17 when the railroad line is unsupported.
- **Part of another finding (1).** The indexed threshold on Form 3514 is inside finding 3514-C.

## Did the cheap comparer miss anything?

I read 43 of the 95 claims marked "agrees" (all 23 of Form 8959, 10 each of the others) against both records. I found no miss. The sample is small; the full run should keep a sample of about 10%.

## Cost

| Form | Fields | Rule of law | Claims | Flags | Findings | Sonnet tokens |
| --- | --- | --- | --- | --- | --- | --- |
| Form 8959 | 26 | 13 | 35 | 12 | 3 | 337,000 |
| Form 3514 | 94 | 39 | 55 | 12 | 4 | 414,000 |
| Form 8582 | 198 | 124 | 45 | 16 | 3 | 437,000 |
| Total | 318 | 176 | 135 | 40 | 10 | 1,188,000 |

The token counts are the totals the harness reports for each agent. No Opus tokens were used. Fable did stage 6 in the lead session.

## What the pilot says about the process

- **The blind split works.** The law reader found the statute's wrong cross-reference and the missing self-employment item with no hint from the code.
- **The quote check held.** 373 quotes, 0 failed after the readers' own fixes.
- **The comparer flags too much (60% rejected), and that is the safe direction.** Three rules added after the first form (guarded gaps, whole-dollar rounding, base amounts against the year's amounts) did not reduce it enough.
- **Triage by a script is not worth it yet.** 176 of 318 fields hold a rule of law. The other 142 cost the code reader one short line each, and it has to read the file anyway.
- **A zero-cost check appeared.** A search for "no fact kind" lists every place that may hold a stale gap comment like 3514-A.
- **The library's limits produce class 3 findings.** Part 31 regulations, the Budget Act and the yearly indexed amounts are not held.

## Second run: Form 8959 in the two-pass shape

The first run took every question from our code. The second run splits the work by the chain statute → regulation → form and instructions → bindings.

- **Pass 1, the record (Sonnet, never sees the code).** The reader goes through the form face and the instructions in order and writes each requirement, then reads the statute and the regulation for each one. Output: `.scratch/law-audit/8959-record/requirements.json`, 50 requirements, 117 quotes, 0 failed. 24 requirements are about the paper only and have no law.
- **Pass 2, the match (Fable).** The 35 code claims of the first run are matched to the 50 requirements in both directions. No comparer.

### Against the first run

| First run's finding | Found again? |
| --- | --- |
| Line 19 leaves out box 12 codes B and N | Yes: requirement R41 against claim C27 |
| Section 1401(b)(2)(B) points to the wrong section | Yes: the note of R28. The reader still marked R28 "agree"; a text with an error must not get that label. |
| The 0.9% on railroad compensation is not plainly in the statute | Yes: R05, R36 and R38 |

### What the second direction added

| Kind | What |
| --- | --- |
| A requirement with no claim, and no guard | R03 and R05: file the form when railroad compensation is over $200,000 on one Form W-2, or over the threshold in total. The filing test reads only box 5 wages and self-employment income, so the form does not file for a railroad worker and no line reports the gap. The W-2 fact can hold box 14 entries; the filing test does not read them. |
| Requirements outside the engine's scope | R50 (Forms W-2 of the territories), R08 (a corrected form), R19 and R48 (penalties). |
| Printing only | R17: skip Part I with no Medicare wages. The engine prints zeros on lines 4, 6 and 7. |
| Free test cases | R32 and R33: the instructions' seven examples with their results. The engine can run them. |
| A claim with no requirement | Whole-dollar rounding. Its requirement is in the Form 1040 record, which the topic label will join. |

### Cost

Pass 1 cost 115,000 Sonnet tokens. With the code reader (111,000) the form costs 226,000, against 337,000 in the first shape.
