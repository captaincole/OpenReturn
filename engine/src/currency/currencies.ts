/*
 * The foreign currencies the engine supports: the 20 that have both a daily
 * rate in the Federal Reserve Board's H.10 release, "Foreign Exchange Rates"
 * (https://www.federalreserve.gov/releases/h10/current/), and an IRS yearly
 * average (rates.ts). H.10 also prints the Malaysian ringgit, the Sri Lankan
 * rupee and the Venezuelan bolivar; the IRS table has no average for them, so
 * they are left out. A fact in any other currency is unsupported.
 */

export interface SupportedCurrency {
  /* ISO 4217 code, as the facts record it. */
  code: string;
  /* The name Form 8938 line 25 or 34 column (a) prints, with the code. */
  name: string;
}

export const H10_CURRENCIES: readonly SupportedCurrency[] = [
  { code: "AUD", name: "Australian dollar" },
  { code: "BRL", name: "Brazilian real" },
  { code: "CAD", name: "Canadian dollar" },
  { code: "CNY", name: "Chinese yuan" },
  { code: "DKK", name: "Danish krone" },
  { code: "EUR", name: "Euro" },
  { code: "HKD", name: "Hong Kong dollar" },
  { code: "INR", name: "Indian rupee" },
  { code: "JPY", name: "Japanese yen" },
  { code: "MXN", name: "Mexican peso" },
  { code: "NZD", name: "New Zealand dollar" },
  { code: "NOK", name: "Norwegian krone" },
  { code: "SGD", name: "Singapore dollar" },
  { code: "ZAR", name: "South African rand" },
  { code: "KRW", name: "South Korean won" },
  { code: "SEK", name: "Swedish krona" },
  { code: "CHF", name: "Swiss franc" },
  { code: "TWD", name: "New Taiwan dollar" },
  { code: "THB", name: "Thai baht" },
  { code: "GBP", name: "British pound" },
];

export function supportedCurrency(code: string): SupportedCurrency | undefined {
  return H10_CURRENCIES.find((currency) => currency.code === code);
}

/* "Euro (EUR)". */
export function currencyLabel(code: string): string {
  const currency = supportedCurrency(code);
  return currency === undefined ? code : `${currency.name} (${code})`;
}

export function unsupportedCurrencyReason(code: string): string {
  return `The amounts are in ${code}: the engine supports only the 20 currencies that have both a Federal Reserve daily rate (the H.10 release) and an IRS yearly average.`;
}
