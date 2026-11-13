# Test OpenReturn against your filed return

> If you run Claude Code in this repo, it follows the `verify-with-filed-return` skill (`.claude/skills/verify-with-filed-return/SKILL.md`) for this: it runs the kit, reads the reports, and never reads your folder.

[← Back to the README](../README.md)

You can check the OpenReturn engine against a tax return you already filed.
You enter your documents and the numbers from your filed return. OpenReturn
computes the return itself and reports which lines match. You send the
report to the maintainer, privately. Each report shows us what to fix
next — and every line that matches counts as proof the engine is right.

Checkers are approved people, like code contributors. Ask the maintainer
before you start (see [Contributing](contributing.md#who-can-contribute)).

## Your privacy

- **Your data stays on your computer.** Your files live in a folder you
  choose, outside the repo. Nothing is uploaded.
- **The report has no dollar amounts, names, or payers.** It lists line
  numbers, how far each line is off, and counts of your documents.
- **You decide what to send.** Read the report first, then send it
  yourself.

## What OpenReturn supports

Tax year 2025, **single** filers, **California** full-year residents.
A single California TaxCalcBench scenario with one small W-2 claims the
California earned income tax credit (FTB 3514) with no qualifying child.
Married filing separately has one unverified test scenario. Married
filing jointly has one federal-only test scenario (TaxCalcBench), with
Form 8606 (nondeductible IRA basis, Roth conversions) and Schedule 1-A
(the senior deduction only). Married filing separately also has one
federal-only TaxCalcBench scenario with a sole-proprietor business
(Schedules C and SE, Form 8995-A), and a second with a 1099-NEC
business (vehicle mileage, a home office), gifts on Schedule A, a
capital loss carryover and Form 8995. A third married-filing-separately
scenario lived with the spouse and has two self-rentals and a passive
royalty (Schedule E, Form 8582). A fourth has two stock sales and
Marketplace coverage whose advance payments are repaid on Form 8962.
A second married-filing-jointly
TaxCalcBench scenario itemizes (Schedule A: gifts, medical under the
floor, state tax withheld, investment interest on Form 4952) with a
dependent (Schedule 8812), a small business, Social Security and a
stock sale. A third, married filing jointly in California, itemizes on
the CA return (Schedule CA Part II, FTB 3526), takes the dependent
exemption credit, owes the CA alternative minimum tax on an incentive
stock option exercise (Schedule P) and the early-distribution tax on a
1099-R (FTB 3805P). A fourth, federal-only, has a real estate
professional's rental and a passive royalty (Schedule E, Form 8582) and
nets a rental's QBI loss against a business (Schedule C (Form 8995-A)).
A fifth, checked on the California return only, is a couple 65 or
older and blind with a grandchild, Social Security and student loan
interest (Form 1098-E), who get the California earned income and young
child tax credits (FTB 3514).
Head of household has two federal-only TaxCalcBench scenarios: one with
mortgage interest on a Form 1098, investment interest, and the
alternative minimum tax on an incentive stock option exercise (Form
6251); one with casualty losses (Form 4684), a qualified disaster loss
that raises the standard deduction (Schedule A line 16), the earned
income credit (Schedule EIC) and the additional child tax credit.
A third head of household scenario is a California return (FTB 3532)
with a business, Social Security, educator expenses, a penalty on early
withdrawal of savings, the blind exemption and an extension payment.
Qualifying surviving spouse has one federal-only TaxCalcBench scenario:
a filer under 65 retired on disability, with a disability pension on
line 1h, forced itemizing with general sales tax, child and dependent
care for a disabled adult son (Form 2441), the credit for the elderly
or the disabled (Schedule R) and the earned income credit.
A second, checked on the California return only, is a filer of 67 with
an HSA (Form 8889), a pension, Social Security and cash gifts, who
itemizes for California only and completes the CA alternative minimum
tax on an incentive stock option exercise (Schedule P).
A fifth married-filing-separately scenario, checked on the California
return only, has three businesses (a Form 8829 home office, amortization
on Form 4562), a self-rental with a new asset (Form 4562, FTB 3885A), a
Roth IRA distribution (Form 8606 Part III), alimony and other Schedule 1
items, and itemizes.

Documents: W-2, 1099-INT, 1099-DIV, 1099-B, 1099-DA, 1099-MISC, 1099-R,
1099-SA, 1098, 1098-E, SSA-1099, W-2G, 1099-K, 1099-NEC, 1095-A, a W-2 you issued to a household employee
(Schedule H, without FUTA tax), and invoices for home energy improvements
(Form 5695 Part II). The last two have one unverified test scenario.
A business you run yourself is answers, not a document: receipts and
expenses by Schedule C line, vehicles at the standard mileage rate, a
home office by the simplified method or, in a rented home, by Form 8829,
and depreciation and amortization on Form 4562 (no section 179 expense,
listed property or cost of goods sold). A 1099-MISC can pay the business.
A rental property or a royalty is answers too: rents, royalties and
expenses by Schedule E line, with Form 8582 for passive losses,
depreciation on Form 4562, and no vehicle expenses or sale of the
property. California depreciation without the federal special allowance
goes on FTB 3885A.

A return outside this list still helps: the report shows what your
return needs that OpenReturn lacks.

## Before you start

- OpenReturn runs on your computer — follow the [Quick Start](../README.md#quick-start).
- You have your **tax documents** (W-2, 1099s) and your **filed return** (PDF or paper).

All commands below run from `engine/`.

## Step 1 — Create your folder

Pick a folder **outside the project**, somewhere your AI coding tools for
this repo can't read. The kit refuses a folder inside the project. This
creates it with example files:

```bash
npx tsx scripts/compareFiled/cli.ts ~/taxes/2025-return --init
```

The example files hold a fake taxpayer ("Jordan") with a return like a
typical OpenReturn user's. You replace Jordan's values with yours.

| File | What you put in it |
| --- | --- |
| `facts.ts` | Your documents: each W-2 and 1099, with the cents as printed |
| `decisions.ts` | Your filing status, yes/no answers, and the Form 8949 box for each sale |
| `expected.ts` | Every filled line of your **filed** return, in whole dollars as printed |
| `index.ts` | Who prepared your return, and the forms you filed |
| `AI_PROMPT.md` | Instructions for an AI session that fills in the files for you |

Don't move the folder after this step. If you must, delete it and run
`--init` again.

## Step 2 — Fill in your files

Do it by hand, or give an AI session the contents of `AI_PROMPT.md` plus
your documents. Use an AI only if you trust it with your tax data.

Two things people get wrong:

- **`expected.ts` comes from the filed return, not the documents.** Your
  1099 shows $1,234.56; your filed Schedule B shows $1,235. Type 1235.
- **List every line your return fills,** even ones that look obvious.
  A missing line counts as blank.

In `index.ts`, say who prepared the return:

```ts
preparer: { kind: "cpa", name: "Example CPA LLP" },  // or "software", "enrolled_agent", "self"
```

If your Schedule B line 2 equals the sum of its rounded rows (some
preparers add the rows after rounding), add
`rounding: { scheduleB: "sum_rounded_rows" }` to `preparer`.

## Step 3 — Check your inputs

```bash
npx tsx scripts/compareFiled/cli.ts ~/taxes/2025-return --check
```

It prints two lists. Fix what they show, then run it again until both are
clean.

- **Support check** — inputs OpenReturn does not read (usually a typo) and
  parts of your return OpenReturn does not cover yet.
- **Input check** — a missing preparer, filed lines typed with cents, line
  ids that do not exist.

## Step 4 — Run the comparison

```bash
npx tsx scripts/compareFiled/cli.ts ~/taxes/2025-return
```

It writes two files into your folder:
`openreturn-check-<year>-<date>.md` (for people) and `.json` (for scripts).

To see the dollar amounts yourself, add `--show-values`. They print to
your terminal only — never into the report.

## Step 5 — Read the report, then send it

The report starts with a summary per form: lines on your return, how
many match, how many differ. Then come the **root causes**:

> A root line differs while every line it reads matches.

One root often explains dozens of differences downstream. A wrong taxable
interest line, for example, moves AGI, the tax, and every state line after
it. Fix the roots and the rest usually follows.

Send both files (`.md` and `.json`) privately to the maintainer.

## What happens next

1. The maintainer finds the cause of each root difference. Some are
   engine bugs. Some are choices your preparer made (how to round, for
   example); those become options, with the IRS rule as the default.
2. The maintainer fixes the engine and asks you to run the comparison
   again, until your return matches.
3. The maintainer builds a **fake** scenario with the same shape as your
   return and locks the engine's output as its expected values. Your
   real numbers never enter the repo, but the engine stays correct for
   returns like yours.
