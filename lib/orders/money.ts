/** ISO 4217 currencies without minor units — integer amounts are major units. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export function parseMoneyStringToMinorUnits(
  amount: string,
  currency: string,
): number {
  const normalized = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("invalid_money_format");
  }

  const upperCurrency = currency.trim().toUpperCase();
  const [wholePart, fractionPart = ""] = normalized.split(".");

  if (ZERO_DECIMAL_CURRENCIES.has(upperCurrency)) {
    return Number.parseInt(wholePart, 10);
  }

  const fraction = (fractionPart + "00").slice(0, 2);
  return Number.parseInt(wholePart, 10) * 100 + Number.parseInt(fraction, 10);
}
