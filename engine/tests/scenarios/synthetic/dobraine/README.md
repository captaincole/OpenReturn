# dobraine — a business property exchange with recapture (synthetic)

Dobraine Halvorsen is single and lives in Walla Walla, Washington. Every name and amount here is made up. There is no outside source and no answer key: the expected values are the engine's output, checked by hand against the form instructions, then locked (`verification: "unverified"`).

He traded a grain storage site that he held for use in a business for a light industrial lot in Spokane, through an intermediary, and got $30,000 in cash. The site's grain bins are section 1245 real property with $18,000 of depreciation. The lot he got has a building (section 1250), fixtures (section 1245) and an access easement (intangible). No Schedule C business or rental is on the 2025 return. He takes the standard deduction. The return is federal only: Washington has no income tax.

The scenario covers the Form 4797 branch of Form 8824: line 21 goes to Form 4797 line 16 and on to Schedule 1 line 4, and line 22 goes to Form 4797 line 5 and on to Schedule D line 11. `gaul` covers investment property, Part II and Part IV.

Forms that file: Form 1040, Schedule 1, Schedule D, Form 4797, Form 8824.

## Inputs

| Input | Amounts |
| --- | --- |
| W-2, Blue Mountain Grain Cooperative | box 1 $76,000, box 2 $8,100 |
| Site given up | basis $60,000; section 1245 depreciation $18,000; held since 06/02/2014 |
| Lot received | FMV $260,000: building $180,000, fixtures $50,000, easement $10,000, land $20,000 |
| Cash received; exchange expenses | $30,000; $4,000 |
| Prior net section 1231 losses (Form 4797 line 8) | $0 |

No input documents: closing statements and depreciation records have no official form.

## Hand check

| Line | Rule | Value |
| --- | --- | --- |
| 8824 line 5 | received 105 days after the transfer: the identification date | 04/10/2025 |
| 8824 line 7 | no related party | No |
| 8824 line 15 | 30,000 − 4,000 | 26,000 |
| 8824 lines 16–20 | 260,000; 286,000; 60,000; 226,000; smaller of 26,000 and 226,000 | as listed |
| 8824 line 21 | smaller of 18,000 and 26,000 + (260,000 − 50,000) | 18,000 |
| 8824 lines 22, 23, 24 | 26,000 − 18,000; 26,000; 226,000 − 26,000 | 8,000; 26,000; 200,000 |
| 8824 line 25 | 60,000 + 26,000 − 26,000 | 60,000 |
| 8824 line 25a | 60,000 × 180,000 / 260,000 = 41,538.46 | 41,538 |
| 8824 line 25b | 60,000 × 50,000 / 260,000 = 11,538.46 | 11,538 |
| 8824 line 25c | 60,000 × 10,000 / 260,000 = 2,307.69 | 2,308 |
| 4797 line 5, 7 | 8824 line 22, held more than 1 year | 8,000 |
| 4797 line 16, 17, 18b | 8824 line 21 | 18,000 |
| Schedule D line 11, 16 | 4797 line 7, no line 8 losses | 8,000 |
| Schedule 1 line 4, 10 | 4797 line 18b | 18,000 |
| 1040 line 9, 11a | 76,000 + 8,000 + 18,000 | 102,000 |
| 1040 line 15 | 102,000 − 15,750 | 86,250 |
| 1040 line 16 | QDCG worksheet, below | 13,335 |
| 1040 line 37 | 13,335 − 8,100 | 5,235 |

Line 16: the net capital gain is 8,000. Tax on 78,250 from the tax table (single) is 12,135. All 8,000 is in the 15% band: 1,200. Line 16 is 13,335.

The $20,000 of land on the lot is in no line of 25a–25c: those lines take only the parts they name.
