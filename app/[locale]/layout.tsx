import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getLocaleDirection, isAppLocale } from "@/lib/i18n/locales";
import { ThemeWatcher } from "@/components/theme/theme-watcher";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Confirma",
  description: "Order confirmation and conversion tracking platform",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={getLocaleDirection(locale)}
      className={`${inter.variable} ${cairo.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var k='confirma-theme';var s=localStorage.getItem(k)||'system';var d=s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=s;}catch(e){}",
          }}
        />
      </head>
      <body
        className={`${locale === "ar" ? cairo.className : inter.className} bg-background text-foreground antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeWatcher />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
