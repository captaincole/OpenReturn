// ITINs share the SSN brand: both are 9 digits on IRS forms.
export type SSN = string & { readonly __brand: "SSN" };

export const ssn = (raw: string): SSN => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 9) {
    throw new Error(`SSN must be 9 digits, got "${raw}" (${digits.length} digits).`);
  }
  return digits as SSN;
};

export const SSN = {
  format: (value: SSN): string => `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`,
  digits: (value: SSN): string => value,
};

export type EIN = string & { readonly __brand: "EIN" };

export const ein = (raw: string): EIN => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 9) {
    throw new Error(`EIN must be 9 digits, got "${raw}" (${digits.length} digits).`);
  }
  return digits as EIN;
};

export const EIN = {
  format: (value: EIN): string => `${value.slice(0, 2)}-${value.slice(2)}`,
  digits: (value: EIN): string => value,
};

export type Phone = string & { readonly __brand: "Phone" };

export const phone = (raw: string): Phone => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 10) {
    throw new Error(`Phone must be 10 digits, got "${raw}" (${digits.length} digits).`);
  }
  return digits as Phone;
};

export const Phone = {
  format: (value: Phone): string => `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}`,
  digits: (value: Phone): string => value,
  parens: (value: Phone): string => `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`,
};

export type ISODate = string & { readonly __brand: "ISODate" };

export const isoDate = (raw: string): ISODate => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`ISODate must be YYYY-MM-DD, got "${raw}".`);
  }
  return raw as ISODate;
};

export const ISODate = {
  format: (value: ISODate): string => value,
  usSlash: (value: ISODate): string => {
    const [year, month, day] = value.split("-");
    return `${month}/${day}/${year}`;
  },
};

/*
 * Matches `decisions.scope.filing_status` and the tax-table column names.
 * Keep them aligned, so no translation table is needed.
 */

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household"
  | "qualifying_surviving_spouse";
