# odessa — a made-up couple who cash savings bonds for tuition (synthetic)

Odessa and Rafael Lindqvist are married and file jointly. They live in Reno, Nevada. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Each has a W-2. In 2025 they cashed four savings bonds and paid tuition for both of them. Three bonds qualify for the exclusion; one was issued in 1988, so its interest stays taxable. Their modified AGI is inside the joint phase-out range, so part of the exclusion phases out. They take the standard deduction. The return is federal only: Nevada has no income tax.

The scenario renders a filled Form 8815, with both worksheets, and checks that line 14 reaches Schedule B line 3 and the tax on Form 1040. The published examples that check the rules are unit tests (`tests/unit/federal/8815/`).

Forms that file: Form 1040, Schedule 1, Schedule B, Form 8815.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, High Desert Water Authority (Odessa) | box 1 $96,500, box 2 $12,000 |
| W-2, Comstock Tile Works (Rafael) | box 1 $58,200, box 2 $5,800 |
| 1099-INT, Sierra Federal Credit Union | box 1 $412.37, box 2 $45, box 3 $9,040 |
| 1099-INT, TreasuryDirect | box 3 $4,590 |
| Paper EE bond, issued 2004 | face $10,000, proceeds $10,420 |
| Electronic EE bond, issued 2012 | face $5,000, proceeds $6,310 |
| Series I bond, issued 2015 | $8,000, proceeds $11,280 |
| Paper EE bond, issued 1988 (does not qualify) | face $2,000, proceeds $4,620 |
| Odessa, University of Nevada, Reno | tuition $12,600; tax-free grant $3,000 paid to her |
| Rafael, Truckee Meadows Community College | tuition $3,400 |
| Rafael, QTP contribution | $2,000 |

## Made documents

`docs/01-savings-bonds-cashed.pdf` is the written record of the four bonds that the Form 8815 instructions require: one row for each bond, with its serial number, series, paper or electronic, issue date, face value and total redemption proceeds. `generate-docs.ts` makes it from the bond facts (`documents/savingsBondRecord.ts`; run `npx tsx tests/scenarios/synthetic/odessa/generate-docs.ts` from `engine/`). The layout follows Form 8818, but with each bond's proceeds on its row: Form 8818 prints only their total. The two electronic bonds print no serial number, because their facts hold none. The ownership test (in Odessa's name, bought after she turned 24) is her answer, not on the record. The W-2s, the 1099-INTs and the expense records have no PDF yet.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8815 line 2 | 12,600 + 3,400 + 2,000 | 18,000 |
| 8815 line 3 | the grant | 3,000 |
| 8815 line 4 | 18,000 − 3,000 | 15,000 |
| 8815 line 5 | 10,420 + 6,310 + 11,280 (the 1988 bond is left out) | 28,010 |
| Line 6 Worksheet lines 1–6 | 28,010; 10,000; 5,000; 5,000 + 8,000 = 13,000; 18,000; 10,010 | 10,010 |
| 8815 line 6 | worksheet line 6 (no interest reported before) | 10,010 |
| 8815 line 7 | 15,000 / 28,010 = 0.5355 | .536 |
| 8815 line 8 | 10,010 × .536 = 5,365.36 | 5,365 |
| Line 9 Worksheet lines 1–5 | Schedule B line 2 14,042; wages 154,700; 168,742; Schedule 1 line 18 45; 168,697 | 168,697 |
| 8815 line 10 | joint | 149,250 |
| 8815 line 11 | 168,697 − 149,250 | 19,447 |
| 8815 line 12 | 19,447 / 30,000 = 0.6482 | .648 |
| 8815 line 13 | 5,365 × .648 = 3,476.52 | 3,477 |
| 8815 line 14 | 5,365 − 3,477 | 1,888 |
| Schedule B line 1 | 412.37 + 9,040; 4,590 | 9,452; 4,590 |
| Schedule B line 2 | 14,042.37 | 14,042 |
| Schedule B line 3 | 8815 line 14 | 1,888 |
| Schedule B line 4 | 14,042 − 1,888 | 12,154 |
| 1040 line 2b | Schedule B line 4 | 12,154 |
| 1040 line 9 | 154,700 + 12,154 | 166,854 |
| 1040 line 10, line 11a | Schedule 1 line 26 (45); 166,854 − 45 | 166,809 |
| 1040 line 15 | 166,809 − 31,500 | 135,309 |
| 1040 line 16 | joint rates: 2,385 + 8,772 + 22% × 38,359 = 19,595.98 | 19,596 |
| 1040 line 37 | 19,596 − 17,800 withheld | 1,796 |
