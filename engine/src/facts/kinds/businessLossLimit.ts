/*
 * Form 461 answers the taxpayer states, for the return as a whole. Each is a
 * signed number, category "other", recorded only when the taxpayer has one:
 * absent means none. A rental property's answer is its fact's tradeOrBusiness
 * (rental.ts); a K-1 entity's rental answer is a fact of its own
 * (makeK1RentalTradeOrBusinessKey).
 */
export const BUSINESS_LOSS_LIMIT_KEYS = {
  /*
   * The net capital gain or loss of the year from capital assets of the
   * taxpayer's trades or businesses: the gains less the losses that are
   * "attributable to a trade or business" (irs-461-inst-2025::sec::line-3::b01).
   * Form 461 keeps a capital gain on line 3 only up to the lesser of this net
   * gain and the return's capital gain net income. Absent: no capital gain or
   * loss of the return comes from a trade or business.
   */
  businessCapitalGain: "business_loss_limit.business_capital_gain",
  /*
   * Form 461 line 8: other income, gain or loss from a trade or business that
   * the return reports outside Schedule 1 lines 3 to 6 and Form 1040 line 7a
   * (irs-461-inst-2025::sec::line-8::b01). A loss is negative. The amount is
   * already on the return: this answer only says that it is business income.
   */
  otherBusinessIncome: "business_loss_limit.other_business_income",
} as const;

const K1_RENTAL_PREFIX = "business_loss_limit.k1_rental_trade_or_business.";

/*
 * Form 461: a K-1 entity's rental activity (a partnership's box 2 or 3, a
 * trust's box 7 or 8) is a trade or business, a boolean, category "other",
 * keyed by the same id as the entity's K-1 fact. "If you own an interest in a
 * partnership or S corporation, the trade or business determination is made
 * at that entity's level" (irs-461-inst-2025::sec::who-must-file::b03). Asked
 * when Form 461 files and the K-1 has a rental amount on Schedule E.
 */
export function makeK1RentalTradeOrBusinessKey(entityId: string): string {
  return `${K1_RENTAL_PREFIX}${entityId}`;
}
