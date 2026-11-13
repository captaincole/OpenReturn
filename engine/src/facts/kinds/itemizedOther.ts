/* Schedule A answers with no fact kind of their own. */

export const ITEMIZED_OTHER_KEYS = {
  /* Line 6: other taxes (a number), such as foreign income taxes not taken as a credit. */
  otherTaxes: "state_local_tax.other_taxes",
  /* Line 6: the type of the other taxes (text). */
  otherTaxesDescription: "state_local_tax.other_taxes_description",
  /* Line 16: impairment-related work expenses of a person with a disability (a number). */
  impairmentRelatedWorkExpenses: "other_itemized.impairment_related_work_expenses",
} as const;
