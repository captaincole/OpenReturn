import type { RefundAccountType } from "../../facts/index.js";

/*
 * "The routing number must be nine digits. The first two digits must be 01
 * through 12 or 21 through 32" (irs-8888-form-2025::sec::lines-1b-2b-and-3b::b01).
 */
export const ROUTING_NUMBER_LENGTH = 9;
export const ROUTING_PREFIX_RANGES: ReadonlyArray<readonly [number, number]> = [
  [1, 12],
  [21, 32],
];

/*
 * "The account number can be up to 17 characters (both numbers and letters).
 * Include hyphens but omit spaces and special symbols"
 * (irs-8888-form-2025::sec::lines-1d-2d-and-3d::b01).
 */
export const ACCOUNT_NUMBER_MAX_LENGTH = 17;
const HYPHEN = "-";

const ACCOUNT_TYPES: ReadonlyArray<RefundAccountType> = ["checking", "savings"];

/* One account as the form prints it (lines b, c and d of its line). */
export interface RefundAccount {
  routingNumber: string;
  /* The account number as entered: letters, numbers and hyphens only. */
  accountNumber: string;
  accountType: RefundAccountType;
  /* The stated dollars; undefined: the account takes what the others leave. */
  amount?: number;
}

const isDigit = (character: string) => character >= "0" && character <= "9";
const isLetter = (character: string) =>
  (character >= "a" && character <= "z") || (character >= "A" && character <= "Z");

export function isValidRoutingNumber(routingNumber: string): boolean {
  const characters = [...routingNumber];
  if (characters.length !== ROUTING_NUMBER_LENGTH || !characters.every(isDigit)) return false;
  const firstTwo = Number(routingNumber.slice(0, 2));
  return ROUTING_PREFIX_RANGES.some(([low, high]) => firstTwo >= low && firstTwo <= high);
}

/* The account number with spaces and special symbols left out; hyphens stay. */
export function accountNumberAsEntered(accountNumber: string): string {
  return [...accountNumber]
    .filter((character) => isDigit(character) || isLetter(character) || character === HYPHEN)
    .join("");
}

export function isValidAccountNumber(entered: string): boolean {
  return entered.length > 0 && entered.length <= ACCOUNT_NUMBER_MAX_LENGTH;
}

const isAmount = (amount: unknown) =>
  amount === undefined || (typeof amount === "number" && Number.isFinite(amount) && amount >= 0);

/*
 * The account the fact states, or undefined when the form cannot use it: a
 * routing or account number the instructions do not accept, no box for line
 * c, or an amount that is not a number of dollars. Cade then asks again.
 */
export function refundAccountOf(value: unknown): RefundAccount | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const stated = value as Record<string, unknown>;
  const { routingNumber, accountNumber, accountType, amount } = stated;
  if (typeof routingNumber !== "string" || !isValidRoutingNumber(routingNumber)) return undefined;
  if (typeof accountNumber !== "string") return undefined;
  const entered = accountNumberAsEntered(accountNumber);
  if (!isValidAccountNumber(entered)) return undefined;
  const type = ACCOUNT_TYPES.find((each) => each === accountType);
  if (type === undefined || !isAmount(amount)) return undefined;
  return {
    routingNumber,
    accountNumber: entered,
    accountType: type,
    amount: amount as number | undefined,
  };
}
