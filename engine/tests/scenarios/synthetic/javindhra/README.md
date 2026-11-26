# javindhra (synthetic, unverified)

Javindhra Selmarre is a made-up taxpayer. No filed return, benchmark case or
answer key stands behind her values. The lines below were checked by hand
against the forms and their instructions, then the engine's output was locked.

## Who she is

- Single, a full-year California resident (Stockton).
- She owns a records scanning business (Schedule C): $300,000 of receipts and
  $90,000 of wages. $40,000 of the wages went to inmates who work for her under
  an approved joint venture with the California Department of Corrections.
- She owns part of Delta Pallet Recovery LP. Its K-1 passes through a $650
  prison inmate labor credit and a $1,500 PTE elective tax credit.
- Her 2024 FTB 3507 line 7 carried $300 to 2025.
- She paid $38,000 of federal and $4,000 of California estimated tax.

## Documents

None. The joint venture agreement stays with the employer (the form's
heading), and the wages come from her payroll records. The K-1 and her 2024
return are not in the engine: their amounts are her answers. The K-1 income is
left out on purpose: the engine has no California K-1, so this scenario tests
the credits alone.

## What it covers

- FTB 3507 lines 1 to 6a, each above 0: her own credit, the K-1 credit and the
  carryover.
- The credit attaches Schedule P (540) (a Section A1 credit). Line 4 uses the
  whole credit and leaves a balance in column (c).
- Form 540 lines 43 and 44: code 162, then the PTE elective tax credit. Line 45
  stays blank.
- The sister scenario `katerine` covers a credit limited by the tax (line 7)
  and three credits on line 45.

## Hand check

| Line | Value | How |
| --- | --- | --- |
| Sch C line 31 | 158,000 | 300,000 − 142,000 of expenses |
| Sch SE lines 12, 13 | 22,324; 11,162 | 145,913 × 15.3%; half |
| 1040 line 11a | 146,838 | 158,000 − 11,162 |
| 540 lines 19, 31, 35 | 141,132; 9,564; 9,411 | 146,838 − 5,706; rate schedule; less 153 |
| Sch P lines 21, 23, 24 | 146,838; 54,089; 3,786 | AMTI; less 92,749; × 7% |
| Sch P Part III line 3 | 5,625 | 9,411 − 3,786 |
| 3507 lines 1, 2 | 40,000; 4,000 | joint venture wages; × 10% |
| 3507 lines 3, 4, 5 | 650; 300; 4,950 | K-1; 2024 line 7; 4,000 + 650 + 300 |
| Sch P line 4 (a), (b), (c) | 4,950; 4,950; 675 | line 5; smaller of 4,950 and 5,625; 5,625 − 4,950 |
| 3507 lines 6a, 6b, 6c, 7 | 4,950; 0; 0; 0 | Sch P line 4 (b); not a corporation; no election; 4,950 − 4,950 |
| Sch P line 11 | 4,461 | 3,786 + 675 |
| Sch P line 21 (a), (b), (c) | 1,500; 1,500; 2,961 | 3804-CR line 3; smaller of 1,500 and 4,461; 4,461 − 1,500 |
| 540 lines 43, 44 | 4,950; 1,500 | code 162; code 242 |
| 540 lines 47, 48 | 6,450; 2,961 | 4,950 + 1,500; 9,411 − 6,450 |
| 540 lines 72, 97, 115 | 4,000; 1,039; 1,039 | estimated tax; 4,000 − 2,961 |
