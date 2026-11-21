/*
 * The Form 8283 fields the engine does not fill. Section B is for a gift over
 * $5,000 that Section A does not take (irs-8283-inst-2025::sec::which-sections-to-complete::b05);
 * page 2 (Parts II to V) belongs to Section B. Such a gift is left off Section A
 * (lines.ts needsSectionB) and still counts on Schedule A line 12.
 */

import type { Form8283 } from "./types.js";

/* which-sections-to-complete::b02–b03: a gift made through a pass-through entity. */
const PASS_THROUGH =
  "The engine has no fact for a noncash gift made through a partnership or S corporation, so it prints no donating entity's name, identifying number or family pass-through box.";
/* section-b::b01, line-2::b01, line-3::b01. */
const SECTION_B_PART_I =
  "Section B (a gift over $5,000 that needs a qualified appraisal) is not modeled: the engine fills only Section A.";
/* part-ii-partial-interests-and-restricted-use::b01. */
const SECTION_B_PART_II =
  "Section B Part II (a partial interest in, or a restriction on the use of, a Section B property) is not modeled.";
/* part-iii-taxpayer-donor-statement::b01. */
const SECTION_B_PART_III =
  "Section B Part III (the items of a Section B group appraised at $500 or less) is not modeled.";
/* part-iv-declaration-of-appraiser::b01. */
const SECTION_B_PART_IV =
  "Section B Part IV is the appraiser's declaration for a Section B property, which the engine does not model.";
/* part-v-donee-acknowledgment::b01. */
const SECTION_B_PART_V =
  "Section B Part V is the donee's acknowledgment of a Section B property, which the engine does not model.";

export const FORM_8283_UNSUPPORTED: Partial<Record<keyof Form8283, string>> = {
  "0.header.original_entity_name": PASS_THROUGH,
  "0.header.original_entity_identifying_number": PASS_THROUGH,
  "0.header.family_pass_through_entity": PASS_THROUGH,
  "0.line.2a_art_20000_or_more": SECTION_B_PART_I,
  "0.line.2d_other_real_estate": SECTION_B_PART_I,
  "0.line.2i_vehicles": SECTION_B_PART_I,
  "0.line.2b_qualified_conservation_contribution": SECTION_B_PART_I,
  "0.line.2e_equipment": SECTION_B_PART_I,
  "0.line.2j_clothing_household_items": SECTION_B_PART_I,
  "0.line.2b1_certified_historic_structure": SECTION_B_PART_I,
  "0.line.2f_securities": SECTION_B_PART_I,
  "0.line.2k_digital_assets": SECTION_B_PART_I,
  "0.line.2b1_nps_number": SECTION_B_PART_I,
  "0.line.2g_collectibles": SECTION_B_PART_I,
  "0.line.2l_other": SECTION_B_PART_I,
  "0.line.2c_art_less_than_20000": SECTION_B_PART_I,
  "0.line.2h_intellectual_property": SECTION_B_PART_I,
  "0.line.3_row_a_col_a_property_description": SECTION_B_PART_I,
  "0.line.3_row_a_col_b_physical_condition": SECTION_B_PART_I,
  "0.line.3_row_a_col_c_appraised_value": SECTION_B_PART_I,
  "0.line.3_row_b_col_a_property_description": SECTION_B_PART_I,
  "0.line.3_row_b_col_b_physical_condition": SECTION_B_PART_I,
  "0.line.3_row_b_col_c_appraised_value": SECTION_B_PART_I,
  "0.line.3_row_c_col_a_property_description": SECTION_B_PART_I,
  "0.line.3_row_c_col_b_physical_condition": SECTION_B_PART_I,
  "0.line.3_row_c_col_c_appraised_value": SECTION_B_PART_I,
  "0.line.3_row_a_col_d_date_acquired": SECTION_B_PART_I,
  "0.line.3_row_a_col_e_how_acquired": SECTION_B_PART_I,
  "0.line.3_row_a_col_f_cost_basis": SECTION_B_PART_I,
  "0.line.3_row_a_col_g_bargain_sale_amount": SECTION_B_PART_I,
  "0.line.3_row_a_col_h_conservation_relevant_basis": SECTION_B_PART_I,
  "0.line.3_row_a_col_i_deduction_claimed": SECTION_B_PART_I,
  "0.line.3_row_b_col_d_date_acquired": SECTION_B_PART_I,
  "0.line.3_row_b_col_e_how_acquired": SECTION_B_PART_I,
  "0.line.3_row_b_col_f_cost_basis": SECTION_B_PART_I,
  "0.line.3_row_b_col_g_bargain_sale_amount": SECTION_B_PART_I,
  "0.line.3_row_b_col_h_conservation_relevant_basis": SECTION_B_PART_I,
  "0.line.3_row_b_col_i_deduction_claimed": SECTION_B_PART_I,
  "0.line.3_row_c_col_d_date_acquired": SECTION_B_PART_I,
  "0.line.3_row_c_col_e_how_acquired": SECTION_B_PART_I,
  "0.line.3_row_c_col_f_cost_basis": SECTION_B_PART_I,
  "0.line.3_row_c_col_g_bargain_sale_amount": SECTION_B_PART_I,
  "0.line.3_row_c_col_h_conservation_relevant_basis": SECTION_B_PART_I,
  "0.line.3_row_c_col_i_deduction_claimed": SECTION_B_PART_I,
  "1.line.4a_partial_interest_property_letter": SECTION_B_PART_II,
  "1.line.4b_1_deduction_this_tax_year": SECTION_B_PART_II,
  "1.line.4b_2_deduction_prior_tax_years": SECTION_B_PART_II,
  "1.line.4c_prior_year_donee_name": SECTION_B_PART_II,
  "1.line.4c_prior_year_donee_address": SECTION_B_PART_II,
  "1.line.4c_prior_year_donee_city_state_zip": SECTION_B_PART_II,
  "1.line.4d_tangible_property_location": SECTION_B_PART_II,
  "1.line.4e_person_with_possession": SECTION_B_PART_II,
  "1.line.4e_person_with_possession_continued": SECTION_B_PART_II,
  "1.line.5a_restriction_on_donee_use_yes": SECTION_B_PART_II,
  "1.line.5a_restriction_on_donee_use_no": SECTION_B_PART_II,
  "1.line.5b_rights_given_to_others_yes": SECTION_B_PART_II,
  "1.line.5b_rights_given_to_others_no": SECTION_B_PART_II,
  "1.line.5c_restriction_particular_use_yes": SECTION_B_PART_II,
  "1.line.5c_restriction_particular_use_no": SECTION_B_PART_II,
  "1.part3.items_appraised_500_or_less": SECTION_B_PART_III,
  "1.part4.appraiser_name": SECTION_B_PART_IV,
  "1.part4.appraiser_title": SECTION_B_PART_IV,
  "1.part4.appraiser_business_address": SECTION_B_PART_IV,
  "1.part4.appraiser_identifying_number": SECTION_B_PART_IV,
  "1.part4.appraiser_city_state_zip": SECTION_B_PART_IV,
  "1.part5.date_property_received": SECTION_B_PART_V,
  "1.part5.unrelated_use_yes": SECTION_B_PART_V,
  "1.part5.unrelated_use_no": SECTION_B_PART_V,
  "1.part5.donee_name": SECTION_B_PART_V,
  "1.part5.donee_ein": SECTION_B_PART_V,
  "1.part5.donee_address": SECTION_B_PART_V,
  "1.part5.donee_city_state_zip": SECTION_B_PART_V,
  "1.part5.donee_authorized_signer_title": SECTION_B_PART_V,
};
