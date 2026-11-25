/*
 * The text lines of one exchange that the facts do not hold as printed: the
 * line 5 date, the line 15a description and the line 19 entry space.
 */

import type { LikeKindExchangeFactValue } from "../../facts/index.js";
import { formatDollars } from "../../money.js";
import { IDENTIFICATION_DAYS, daysBetween } from "./lines.js";

/*
 * Line 5: the date of the written identification; but "If you received the
 * replacement property before the end of the 45-day period ... enter on line 5
 * the date you received the replacement property" (irs-8824-inst-2025::sec::line-5::b03).
 */
export function line5Date(value: LikeKindExchangeFactValue): string | undefined {
  const { dateReceived, dateIdentified } = value.received;
  const days = daysBetween(value.givenUp.dateTransferred, dateReceived);
  return days <= IDENTIFICATION_DAYS ? dateReceived : dateIdentified;
}

/* The liabilities the other party assumed over what the taxpayer gave for them (lines-15-and-15a::b01). */
function netLiabilitiesRelieved(value: LikeKindExchangeFactValue): number {
  const given =
    (value.received.liabilitiesAssumed ?? 0) +
    (value.cashPaid ?? 0) +
    (value.otherPropertyGivenUp?.fairMarketValue ?? 0);
  return (value.givenUp.liabilitiesAssumedByOtherParty ?? 0) - given;
}

/*
 * Line 15a: what makes up line 15. The examples write "cash" for cash received
 * and "liabilities and cash" for net liabilities figured after cash paid
 * (irs-8824-inst-2025::sec::summary-of-facts::b01, b02). Blank with nothing received.
 */
export function line15aDescription(value: LikeKindExchangeFactValue): string | undefined {
  const parts: string[] = [];
  if (value.otherPropertyReceived) parts.push(value.otherPropertyReceived.description);
  if ((value.cashReceived ?? 0) > 0) parts.push("cash");
  if (netLiabilitiesRelieved(value) > 0) {
    parts.push((value.cashPaid ?? 0) > 0 ? "liabilities and cash" : "liabilities");
  }
  return parts.length === 0 ? undefined : parts.join("; ");
}

/* Line 19's entry space: "Section 121 exclusion" and the amount (irs-8824-inst-2025::sec::property-used-as-home::b01). */
export function line19Entry(value: LikeKindExchangeFactValue): string | undefined {
  const exclusion = value.section121Exclusion ?? 0;
  return exclusion > 0 ? `Section 121 exclusion ${formatDollars(exclusion)}` : undefined;
}
