export type ShippingIntegrationType = "direct" | "broker-required";

export interface ShippingProvider {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn?: string;
  logo: string;
  website: string;
  isFree: boolean;
  integrationType: ShippingIntegrationType;
}

export const SHIPPING_PROVIDERS: ShippingProvider[] = [
  {
    slug: "sendit",
    nameAr: "Sendit",
    nameEn: "Sendit",
    descriptionAr: "شحن وطني مع تتبع لحظي",
    logo: "/shipping/sendit.png",
    website: "https://sendit.ma",
    isFree: true,
    integrationType: "direct",
  },
  {
    slug: "mylerz",
    nameAr: "Mylerz",
    nameEn: "Mylerz",
    descriptionAr: "توصيل للتجارة الإلكترونية داخل المغرب",
    logo: "/shipping/mylerz.svg",
    website: "https://www.mylerz.com",
    isFree: true,
    integrationType: "direct",
  },
  {
    slug: "cathedis",
    nameAr: "Cathedis",
    nameEn: "Cathedis",
    descriptionAr: "توصيل سريع في نفس اليوم",
    logo: "/shipping/cathedis.png",
    website: "https://cathedis.ma",
    isFree: true,
    integrationType: "direct",
  },
  {
    slug: "chrono-diali",
    nameAr: "Chrono Diali",
    nameEn: "Chrono Diali",
    descriptionAr: "توصيل سريع داخل المدن",
    logo: "/shipping/chrono-diali.svg",
    website: "https://www.chronodiali.ma",
    isFree: true,
    integrationType: "direct",
  },
  {
    slug: "amana-cec",
    nameAr: "Amana CEC",
    nameEn: "Amana CEC",
    descriptionAr: "شبكة بريد وتوصيل وطنية",
    logo: "/shipping/amana-cec.svg",
    website: "https://www.amana.ma",
    isFree: true,
    integrationType: "direct",
  },
  {
    slug: "boxship",
    nameAr: "Boxship",
    nameEn: "Boxship",
    descriptionAr: "شحن طرود للمتاجر الإلكترونية",
    logo: "/shipping/boxship.svg",
    website: "https://boxship.ma",
    isFree: true,
    integrationType: "direct",
  },
  {
    slug: "coliix",
    nameAr: "Coliix",
    nameEn: "Coliix",
    descriptionAr: "شائعة في السوق المغربي",
    logo: "/shipping/coliix.png",
    website: "https://coliix.com",
    isFree: true,
    integrationType: "broker-required",
  },
  {
    slug: "ameex",
    nameAr: "Ameex",
    nameEn: "Ameex",
    descriptionAr: "تغطية وطنية ورسوم دفع عند الاستلام",
    descriptionEn: "Nationwide coverage with competitive COD fees",
    logo: "/shipping/ameex.png",
    website: "https://ameex.ma",
    isFree: true,
    integrationType: "broker-required",
  },
  {
    slug: "ozon-express",
    nameAr: "Ozon Express",
    nameEn: "Ozon Express",
    descriptionAr: "تركيز على الدفع عند الاستلام",
    logo: "/shipping/ozon-express.png",
    website: "https://ozonexpress.ma",
    isFree: true,
    integrationType: "broker-required",
  },
  {
    slug: "digylog",
    nameAr: "Digylog",
    nameEn: "Digylog",
    descriptionAr: "تغطية أكثر من 270 مدينة",
    logo: "/shipping/digylog.png",
    website: "https://digylog.ma",
    isFree: true,
    integrationType: "broker-required",
  },
  {
    slug: "tawssil",
    nameAr: "Tawssil",
    nameEn: "Tawssil",
    descriptionAr: "شبكة توصيل متنامية",
    logo: "/shipping/tawssil.svg",
    website: "https://tawssil.ma",
    isFree: true,
    integrationType: "broker-required",
  },
  {
    slug: "forcelog",
    nameAr: "Forcelog",
    nameEn: "Forcelog",
    descriptionAr: "شحن وطني مع API متكامل",
    logo: "/shipping/forcelog.png",
    website: "https://forcelog.ma",
    isFree: true,
    integrationType: "broker-required",
  },
  {
    slug: "colis-swift",
    nameAr: "Colis Swift",
    nameEn: "Colis Swift",
    descriptionAr: "شحن سريع للتجارة الإلكترونية",
    logo: "/shipping/colis-swift.svg",
    website: "https://colisswift.ma",
    isFree: true,
    integrationType: "broker-required",
  },
  {
    slug: "ozonexpress",
    nameAr: "Ozonexpress",
    nameEn: "Ozonexpress",
    descriptionAr: "توصيل سريع وموثوق",
    logo: "/shipping/ozonexpress.png",
    website: "https://ozonexpress.ma",
    isFree: true,
    integrationType: "broker-required",
  },
];

export function getShippingProvider(slug: string): ShippingProvider | undefined {
  return SHIPPING_PROVIDERS.find((provider) => provider.slug === slug);
}
