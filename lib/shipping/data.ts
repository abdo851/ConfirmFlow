export interface ShippingProvider {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn?: string;
  logo: string;
  website: string;
  isFree: boolean;
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
  },
  {
    slug: "cathedis",
    nameAr: "Cathedis",
    nameEn: "Cathedis",
    descriptionAr: "توصيل سريع في نفس اليوم",
    logo: "/shipping/cathedis.png",
    website: "https://cathedis.ma",
    isFree: true,
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
  },
  {
    slug: "ozon-express",
    nameAr: "Ozon Express",
    nameEn: "Ozon Express",
    descriptionAr: "تركيز على الدفع عند الاستلام",
    logo: "/shipping/ozon-express.png",
    website: "https://ozonexpress.ma",
    isFree: true,
  },
  {
    slug: "digylog",
    nameAr: "Digylog",
    nameEn: "Digylog",
    descriptionAr: "تغطية أكثر من 270 مدينة",
    logo: "/shipping/digylog.png",
    website: "https://digylog.ma",
    isFree: true,
  },
  {
    slug: "coliix",
    nameAr: "Coliix",
    nameEn: "Coliix",
    descriptionAr: "شائعة في السوق المغربي",
    logo: "/shipping/coliix.png",
    website: "https://coliix.com",
    isFree: true,
  },
  {
    slug: "tawssil",
    nameAr: "Tawssil",
    nameEn: "Tawssil",
    descriptionAr: "شبكة توصيل متنامية",
    logo: "/shipping/tawssil.svg",
    website: "https://tawssil.ma",
    isFree: true,
  },
  {
    slug: "ozonexpress",
    nameAr: "Ozonexpress",
    nameEn: "Ozonexpress",
    descriptionAr: "توصيل سريع وموثوق",
    logo: "/shipping/ozonexpress.png",
    website: "https://ozonexpress.ma",
    isFree: true,
  },
  {
    slug: "forcelog",
    nameAr: "Forcelog",
    nameEn: "Forcelog",
    descriptionAr: "شحن وطني مع API متكامل",
    logo: "/shipping/forcelog.png",
    website: "https://forcelog.ma",
    isFree: true,
  },
  {
    slug: "colis-swift",
    nameAr: "Colis Swift",
    nameEn: "Colis Swift",
    descriptionAr: "شحن سريع للتجارة الإلكترونية",
    logo: "/shipping/colis-swift.svg",
    website: "https://colisswift.ma",
    isFree: true,
  },
];

export function getShippingProvider(slug: string): ShippingProvider | undefined {
  return SHIPPING_PROVIDERS.find((provider) => provider.slug === slug);
}
