export type PaymentProvider =
  | "stripe"
  | "paypal"
  | "payoneer"
  | "wise"
  | "redotpay"
  | "cmi"
  | "attijariwafa"
  | "banque-populaire"
  | "bank-of-africa"
  | "cih-bank"
  | "al-barid-bank"
  | "mtc"
  | "payzone";

export type PaymentProviderCategory = "international" | "moroccan-local" | "moroccan-gateway";

export interface PaymentProviderMeta {
  id: PaymentProvider;
  label: { en: string; ar: string };
  category: PaymentProviderCategory;
  status: "planned" | "ready" | "live";
  requiresMerchantAccount: boolean;
  docsUrl?: string;
}

export const PAYMENT_PROVIDERS: PaymentProviderMeta[] = [
  {
    id: "stripe",
    label: { en: "Stripe", ar: "سترايب" },
    category: "international",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "paypal",
    label: { en: "PayPal", ar: "باي بال" },
    category: "international",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "payoneer",
    label: { en: "Payoneer", ar: "بايونير" },
    category: "international",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "wise",
    label: { en: "Wise", ar: "وايز" },
    category: "international",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "redotpay",
    label: { en: "RedotPay", ar: "ريدوت باي" },
    category: "international",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "cmi",
    label: { en: "CMI", ar: "مركز النقديات" },
    category: "moroccan-gateway",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "payzone",
    label: { en: "Payzone", ar: "بايزون" },
    category: "moroccan-gateway",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "mtc",
    label: { en: "M2T", ar: "إم تو تي" },
    category: "moroccan-gateway",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "attijariwafa",
    label: { en: "Attijariwafa Bank", ar: "التجاري وفا بنك" },
    category: "moroccan-local",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "banque-populaire",
    label: { en: "Banque Populaire", ar: "البنك الشعبي" },
    category: "moroccan-local",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "bank-of-africa",
    label: { en: "Bank of Africa", ar: "بنك أفريقيا" },
    category: "moroccan-local",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "cih-bank",
    label: { en: "CIH Bank", ar: "بنك CIH" },
    category: "moroccan-local",
    status: "planned",
    requiresMerchantAccount: true,
  },
  {
    id: "al-barid-bank",
    label: { en: "Al Barid Bank", ar: "البريد بنك" },
    category: "moroccan-local",
    status: "planned",
    requiresMerchantAccount: true,
  },
];
