/* One fact per Form W-2G. Box 1 goes on Schedule 1 line 8b; box 4 on Form 1040 line 25c. */

type FactRow = { key: string; value: unknown; category: string };

export interface GamblingWinningsFactValue {
  payerName: string;
  payerTin?: string;
  box1: number; // Reportable winnings
  box2?: string; // Date won
  box3?: string; // Type of wager
  box4?: number; // Federal income tax withheld
  box7?: number; // Winnings from identical wagers
  box13?: string; // State / payer's state identification no.
  box14?: number; // State winnings
  box15?: number; // State income tax withheld
}

const W2G_CATEGORY = "other";

/* One payer can send several W-2Gs (one per win), so the key also holds an id for the form. */
export function makeGamblingWinningsFactKey(payerSlug: string, winId: string): string {
  return `payer.${payerSlug}.w2g.${winId}`;
}

export function isGamblingWinningsFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 4 && parts[0] === "payer" && parts[2] === "w2g";
}

export function getGamblingWinningsFacts(
  facts: ReadonlyArray<FactRow>,
): GamblingWinningsFactValue[] {
  return facts
    .filter((fact) => fact.category === W2G_CATEGORY && isGamblingWinningsFactKey(fact.key))
    .map((fact) => fact.value as GamblingWinningsFactValue);
}
