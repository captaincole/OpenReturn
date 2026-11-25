/*
 * Form 461 answers the taxpayer states, for the return as a whole. The two
 * keys below are signed numbers, category "other", recorded only when the
 * taxpayer has one: absent means none. A rental property's answer is its
 * fact's tradeOrBusiness (rental.ts); a K-1 entity's rental answer is a
 * boolean fact of its own (makeK1RentalTradeOrBusinessKey). No document
 * prints these answers: each comment gives the question to ask and what the
 * taxpayer looks at to answer it.
 */
export const BUSINESS_LOSS_LIMIT_KEYS = {
  /*
   * The net capital gain or loss of the year from capital assets of the
   * taxpayer's trades or businesses: the gains less the losses that are
   * "attributable to a trade or business" (irs-461-inst-2025::sec::line-3::b01).
   * Form 461 keeps a capital gain on line 3 only up to the lesser of this net
   * gain and the return's capital gain net income. Absent: no capital gain or
   * loss of the return comes from a trade or business.
   * Question: "Did any of this year's capital gains or losses come from
   * something a business of yours owned or used, not from investments? If
   * so, what was the net gain or loss from those sales?" The taxpayer looks
   * at the capital gain boxes of each business K-1 (partnership boxes 8 to
   * 9c, S corporation boxes 7 to 8c) and at the Form 8949 rows for assets a
   * business of theirs held.
   */
  businessCapitalGain: "business_loss_limit.business_capital_gain",
  /*
   * Form 461 line 8: other income, gain or loss from a trade or business that
   * the return reports outside Schedule 1 lines 3 to 6 and Form 1040 line 7a
   * (irs-461-inst-2025::sec::line-8::b01). A loss is negative. The amount is
   * already on the return: this answer only says that it is business income.
   * Question: "Is any of the other income on your return (Schedule 1 line 8)
   * from a business you run or ran, such as a recovered bad debt of a closed
   * business? How much?" The taxpayer looks at the line 8 items they gave,
   * and the Form 1099-MISC or 1099-K behind them.
   */
  otherBusinessIncome: "business_loss_limit.other_business_income",
} as const;

const K1_RENTAL_PREFIX = "business_loss_limit.k1_rental_trade_or_business.";

/*
 * Form 461: a K-1 entity's rental activity (a partnership's or an S
 * corporation's box 2 or 3, a trust's box 7 or 8) is a trade or business, a
 * boolean, category "other", keyed by the same id as the entity's K-1 fact.
 * "If you own an interest in a partnership or S corporation, the trade or
 * business determination is made at that entity's level"
 * (irs-461-inst-2025::sec::who-must-file::b03). Asked when Form 461 files and
 * the K-1 has a rental amount on Schedule E.
 * Question: "Does <entity> run its rentals as a business, with regular,
 * continuous work and a profit motive, rather than as an investment?" The
 * taxpayer looks at the K-1's statements (a section 199A statement that lists
 * the rental as a trade or business is a sign of yes) or asks the entity.
 */
export function makeK1RentalTradeOrBusinessKey(entityId: string): string {
  return `${K1_RENTAL_PREFIX}${entityId}`;
}
