/** ISO 4217 currencies without minor units. */
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

export function formatMoneyMinor(amountMinor: number, currency: string): string {
  const upperCurrency = currency.toUpperCase();
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: upperCurrency,
    minimumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(upperCurrency) ? 0 : 2,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(upperCurrency) ? 0 : 2,
  });

  const majorUnits = ZERO_DECIMAL_CURRENCIES.has(upperCurrency)
    ? amountMinor
    : amountMinor / 100;

  return formatter.format(majorUnits);
}

export function formatOrderDisplayIdentifier(input: {
  orderNumber: string | null;
  externalOrderId: string;
}): string {
  if (input.orderNumber) {
    return input.orderNumber.startsWith("#")
      ? input.orderNumber
      : `#${input.orderNumber}`;
  }

  return input.externalOrderId;
}

export function formatOrderCustomerContact(input: {
  customerEmail: string | null;
  customerPhone: string | null;
}): string | null {
  return input.customerEmail ?? input.customerPhone;
}
