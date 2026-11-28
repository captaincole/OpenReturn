/*
 * The rows of Parts III and IV, as one table each (issue #175: one table in
 * code and one rule per column). A row's fields are `<page>.<part>.<key>_col_<column>`
 * in catalog.json; the columns a row has are the catalog's (shaded cells have
 * no field). The source names the credit form the way a fact states it.
 *
 * Tiers (irs-3800-face-2025::sec::face-part-iii::b01, face-part-iii-2::b01, face-part-iv::b01):
 * lines 1a–1zz and 2a–2zz are the credits not allowed against tentative minimum
 * tax (Part I), line 3 the empowerment zone credit (Part II Section B), lines
 * 4a–4z the specified credits (Part II Section C).
 */

export type Tier = "general" | "empowerment" | "specified";

export interface CreditRow {
  /* The line as the left margin prints it: "1a", "3", "4y". */
  line: string;
  /* The catalog row key after `<page>.<part>.`. */
  key: string;
  page: number;
  /* The source credit form as a fact names it. */
  source: string;
  tier: Tier;
}

const tierOf = (line: string): Tier =>
  line === "3" ? "empowerment" : line.startsWith("4") ? "specified" : "general";

const row = (page: number, line: string, key: string, source: string): CreditRow => ({
  line,
  key,
  page,
  source,
  tier: tierOf(line),
});

/* Part III lines 1a–1zz, 3 and 4a–4z (pages 3 and 4 of the form, catalog pages 2 and 3). */
export const PART_III_ROWS: ReadonlyArray<CreditRow> = [
  row(2, "1a", "1a_form_3468_part_ii", "3468 Part II"),
  row(2, "1b", "1b_form_7207", "7207"),
  row(2, "1c", "1c_form_6765", "6765"),
  row(2, "1d", "1d_form_3468_part_iii", "3468 Part III"),
  row(2, "1e", "1e_form_8826", "8826"),
  row(2, "1f", "1f_form_8835_part_ii", "8835 Part II"),
  row(2, "1g", "1g_form_7210", "7210"),
  row(2, "1h", "1h_form_8820", "8820"),
  row(2, "1i", "1i_form_8874", "8874"),
  row(2, "1j", "1j_form_8881_part_i", "8881 Part I"),
  row(2, "1k", "1k_form_8882", "8882"),
  row(2, "1l", "1l_form_8864_diesel", "8864 diesel"),
  row(2, "1m", "1m_form_8896", "8896"),
  row(2, "1n", "1n_form_8906", "8906"),
  row(2, "1o", "1o_form_3468_part_iv", "3468 Part IV"),
  row(2, "1p", "1p_form_8908", "8908"),
  row(2, "1q", "1q_form_7218_part_ii", "7218 Part II"),
  row(2, "1s", "1s_form_8911_part_i", "8911 Part I"),
  row(2, "1t", "1t_form_8830", "8830"),
  row(2, "1u", "1u_form_7213_part_ii", "7213 Part II"),
  row(2, "1v", "1v_form_3468_part_v", "3468 Part V"),
  row(2, "1w", "1w_form_8932", "8932"),
  row(2, "1x", "1x_form_8933", "8933"),
  row(2, "1y", "1y_form_8936_part_ii", "8936 Part II"),
  row(2, "1aa", "1aa_form_8936_part_v", "8936 Part V"),
  row(2, "1bb", "1bb_form_8904", "8904"),
  row(2, "1cc", "1cc_form_7213_part_i", "7213 Part I"),
  row(2, "1dd", "1dd_form_8881_part_ii", "8881 Part II"),
  row(2, "1ee", "1ee_form_8881_part_iii", "8881 Part III"),
  row(2, "1ff", "1ff_form_8864_saf", "8864 SAF"),
  row(2, "1gg", "1gg_form_7211_part_ii", "7211 Part II"),
  row(2, "1zz", "1zz_other_credits", "other"),
  row(3, "3", "3_form_8844", "8844"),
  row(3, "4a", "4a_form_3468_part_vi", "3468 Part VI"),
  row(3, "4b", "4b_form_5884", "5884"),
  row(3, "4c", "4c_form_6478", "6478"),
  row(3, "4d", "4d_form_8586", "8586"),
  row(3, "4e", "4e_form_8835_part_ii", "8835 Part II"),
  row(3, "4f", "4f_form_8846", "8846"),
  row(3, "4g", "4g_form_8900", "8900"),
  row(3, "4h", "4h_form_8941", "8941"),
  row(3, "4i", "4i_form_6765_esb", "6765"),
  row(3, "4j", "4j_form_8994", "8994"),
  row(3, "4k", "4k_form_3468_part_vii", "3468 Part VII"),
  row(3, "4z", "4z_other_specified_credits", "other"),
];

/* Part IV keys that differ from Part III's on lines 1a–1zz. */
const PART_IV_KEYS: Readonly<Record<string, string>> = {
  "1l": "1l_form_8864",
  "1s": "1s_form_8911",
  "1ff": "1ff_form_8864",
  "1zz": "1zz_other",
};

/* Part IV lines 1a–1zz, 2a–2zz, 3, 4a–4z (pages 5 to 7 of the form, catalog pages 4 to 6). */
export const PART_IV_ROWS: ReadonlyArray<CreditRow> = [
  ...PART_III_ROWS.filter((each) => each.line.startsWith("1")).map((each) =>
    row(4, each.line, PART_IV_KEYS[each.line] ?? each.key, each.source),
  ),
  row(5, "2a", "2a_form_5884a", "5884-A"),
  row(5, "2b", "2b_form_8586_pre_2008", "8586 pre-2008"),
  row(5, "2c", "2c_form_8845", "8845"),
  row(5, "2d", "2d_form_8907", "8907"),
  row(5, "2e", "2e_form_8909", "8909"),
  row(5, "2f", "2f_form_8923", "8923"),
  row(5, "2g", "2g_form_8834", "8834"),
  row(5, "2h", "2h_form_8931", "8931"),
  row(5, "2i", "2i_form_1065b", "1065-B"),
  row(5, "2j", "2j_form_5884_pre_2007", "5884 pre-2007"),
  row(5, "2k", "2k_form_6478_pre_2005", "6478 pre-2005"),
  row(5, "2l", "2l_form_8846_pre_2007", "8846 pre-2007"),
  row(5, "2m", "2m_form_8900_pre_2008", "8900 pre-2008"),
  row(5, "2n", "2n_trans_alaska_pipeline_liability", "Trans-Alaska pipeline liability"),
  row(5, "2o", "2o_form_5884a_section_a", "5884-A Section A"),
  row(5, "2p", "2p_form_5884a_section_b", "5884-A Section B"),
  row(5, "2q", "2q_form_5884a_section_a", "5884-A Section A"),
  row(5, "2r", "2r_form_5884a_section_b", "5884-A Section B"),
  row(5, "2s", "2s_form_5884b", "5884-B"),
  row(5, "2t", "2t_form_8847", "8847"),
  row(5, "2u", "2u_form_8861", "8861"),
  row(5, "2v", "2v_form_8884", "8884"),
  row(5, "2w", "2w_form_8942", "8942"),
  row(5, "2x", "2x_form_8910", "8910"),
  row(5, "2zz", "2zz_other_credits", "other"),
  row(5, "3", "3_form_8844", "8844"),
  row(6, "4a", "4a_form_3468_part_vi", "3468 Part VI"),
  row(6, "4b", "4b_form_5884", "5884"),
  row(6, "4c", "4c_form_6478", "6478"),
  row(6, "4d", "4d_form_8586_post_2007", "8586 post-2007"),
  row(6, "4e", "4e_form_8835", "8835"),
  row(6, "4f", "4f_form_8846", "8846"),
  row(6, "4g", "4g_form_8900", "8900"),
  row(6, "4h", "4h_form_8941", "8941"),
  row(6, "4i", "4i_form_6765_esb_credit", "6765"),
  row(6, "4j", "4j_form_8994", "8994"),
  row(6, "4k", "4k_form_3468_part_vii", "3468 Part VII"),
  row(6, "4y", "4y_esbc", "ESBC"),
  row(6, "4z", "4z_other_specified_credits", "other"),
];

/*
 * "Order in which credits are used" (irs-3800-inst-2025::sec::credit-ordering-rule::b02
 * to ::b04), as the Part III and Part IV lines that hold each credit. A
 * carryforward-only credit takes its Part IV line. The lines the list does not
 * name (1zz, 2j, 2n, 2t, 2u, 2v, 2zz, 4y, 4z) come after it, in form order
 * (QUESTIONS.md). It only splits a tier's allowed credit among rows.
 */
// prettier-ignore
const ORDER: ReadonlyArray<string> = [
  "4k", "4a", "1a", "1d", "2w", "1o", "1v", "4b", "2j", "4c", "2k", "1c", "4i", "4d", "2b",
  "1t", "1e", "1f", "4e", "3", "2c", "4f", "2l", "1h", "1i", "1j", "1k", "4g", "2m", "1l",
  "1m", "1bb", "1n", "1cc", "2d", "1p", "2e", "2x", "1s", "2f", "2h", "1w", "1x", "2g", "1y",
  "4h", "2a", "2o", "2p", "2q", "2r", "2s", "4j", "1dd", "1u", "1ff", "1g", "1aa", "1b",
  "1gg", "1q", "1ee", "2i",
];

const FORM_ORDER = PART_IV_ROWS.map((each) => each.line);

/* A line's place in the order of use: listed lines first, the rest in form order. */
export function rankOf(line: string): number {
  const listed = ORDER.indexOf(line);
  return listed >= 0 ? listed : ORDER.length + FORM_ORDER.indexOf(line);
}

/*
 * The Part III lines whose column (f) is open: the credits a section 6418
 * transfer election can move (irs-3800-inst-2025::sec::transfer-of-eligible-credits-under-section-6418::b01).
 */
// prettier-ignore
export const TRANSFER_LINES: ReadonlyArray<string> = [
  "1b", "1d", "1f", "1g", "1l", "1q", "1s", "1u", "1v", "1x", "1gg", "4a", "4e",
];

/* The Part III lines whose column (h) is open: the elective payment credits (elective-payment-of-certain-business-credits::b01 to ::b03). */
// prettier-ignore
export const ELECTIVE_PAYMENT_LINES: ReadonlyArray<string> = [
  "1b", "1d", "1g", "1o", "1q", "1s", "1u", "1v", "1x", "1aa", "1gg", "4a", "4e",
];

/* The research credit lines (irs-3800-inst-2025::sec::lines-1c-and-4i::b01). */
export const RESEARCH_LINES: ReadonlyArray<string> = ["1c", "4i"];

/* Lines the engine figures from a source form it has: Form 8911 line 3, Form 8936 lines 8 and 21, Form 8820 line 2c, Form 8846 line 4, Form 7210 line 10, Form 8941 line 12. */
export const ENGINE_FORM_LINES: Readonly<Record<string, string>> = {
  "1g": "Form 7210",
  "1s": "Form 8911",
  "1y": "Form 8936",
  "1aa": "Form 8936",
  "1h": "Form 8820",
  "4f": "Form 8846",
  "4h": "Form 8941",
};

export const partIIIRow = (line: string) => PART_III_ROWS.find((each) => each.line === line);
export const partIVRow = (line: string) => PART_IV_ROWS.find((each) => each.line === line);
