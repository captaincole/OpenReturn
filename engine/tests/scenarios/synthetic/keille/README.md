# keille — a made-up real estate professional with a farm rental loss (synthetic)

Keille Ravensworth is single and lives in Ocala, Florida. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

Keille owns 60% of a real estate brokerage and is paid by W-2. She works more than 750 hours in real property trades, so she is a real estate professional. She also owns a hay farm that a tenant works for half the hay. She sets the terms and handles the repairs herself, so she materially participates under the passive activity rules. She does no farm work, so the rent is not self-employment income and goes on Form 4835. This year's repairs and taxes make a loss, and all of her investment is at risk. The loss is not passive, so no Form 8582 files (irs-4835-inst-2025::sec::line-34::b01). The return is federal only: Florida has no income tax.

This scenario covers the loss branch that `jasin` cannot show: box 34a, line 34c, and Schedule E line 43.

Forms that file: Form 1040, Schedule 1, Schedule E (page 2 only), Form 4835.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Marion Land Brokers | box 1 $112,000, box 2 $16,800 |
| Real estate professional | yes |
| Farm rental (stated from the farm's records) | hay shares $18,000; crop insurance $1,200; expenses $30,200 |

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 4835 line A | she makes the management decisions | Yes |
| 4835 line 1 | hay shares sold | 18,000 |
| 4835 lines 5a, 5b | crop insurance, none deferred | 1,200; 1,200 |
| 4835 line 7 | 18,000 + 1,200 | 19,200 |
| 4835 lines 12, 15, 18, 19a, 23, 27 | depreciation, fertilizer, insurance, mortgage interest, repairs, taxes | 9,000; 3,000; 2,100; 5,200; 6,400; 4,500 |
| 4835 line 31 | the expenses | 30,200 |
| 4835 line 32 | a loss is not entered here (line-32::b01) | blank |
| 4835 box 34a | all investment at risk | checked |
| 4835 line 34c | nonpassive: the whole loss, 19,200 − 30,200 | (11,000) |
| Schedule E line 40 | Form 4835 line 34c | −11,000 |
| Schedule E line 41 | line 40 only | −11,000 |
| Schedule E line 42 | Form 4835 line 7 | 19,200 |
| Schedule E line 43 | the professional's materially participated rental real estate | −11,000 |
| Schedule 1 lines 5, 10 | Schedule E line 41 | −11,000 |
| 1040 lines 1a, 1z | W-2 box 1 | 112,000 |
| 1040 line 8 | Schedule 1 line 10 | −11,000 |
| 1040 lines 9, 11a | 112,000 − 11,000 | 101,000 |
| 1040 line 12e | single standard deduction | 15,750 |
| 1040 line 15 | 101,000 − 15,750 | 85,250 |
| 1040 line 16 | tax table, 85,250–85,300, single | 13,675 |
| 1040 line 25a | W-2 box 2 | 16,800 |
| 1040 lines 34, 35a | 16,800 − 13,675 | 3,125 |
