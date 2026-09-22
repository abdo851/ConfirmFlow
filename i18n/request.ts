import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import enAuth from "../messages/en/auth.json";
import enCommon from "../messages/en/common.json";
import enConnections from "../messages/en/connections.json";
import enDashboard from "../messages/en/dashboard.json";
import enErrors from "../messages/en/errors.json";
import enLanding from "../messages/en/landing.json";
import enNavigation from "../messages/en/navigation.json";
import enOnboarding from "../messages/en/onboarding.json";
import enOrders from "../messages/en/orders.json";
import enAdmin from "../messages/en/admin.json";
import enPolicies from "../messages/en/policies.json";
import arAuth from "../messages/ar/auth.json";
import arCommon from "../messages/ar/common.json";
import arConnections from "../messages/ar/connections.json";
import arDashboard from "../messages/ar/dashboard.json";
import arErrors from "../messages/ar/errors.json";
import arLanding from "../messages/ar/landing.json";
import arNavigation from "../messages/ar/navigation.json";
import arOnboarding from "../messages/ar/onboarding.json";
import arOrders from "../messages/ar/orders.json";
import arAdmin from "../messages/ar/admin.json";
import arPolicies from "../messages/ar/policies.json";

const messageCatalogs = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    landing: enLanding,
    dashboard: enDashboard,
    onboarding: enOnboarding,
    connections: enConnections,
    errors: enErrors,
    orders: enOrders,
    admin: enAdmin,
    policies: enPolicies,
  },
  ar: {
    common: arCommon,
    navigation: arNavigation,
    auth: arAuth,
    landing: arLanding,
    dashboard: arDashboard,
    onboarding: arOnboarding,
    connections: arConnections,
    errors: arErrors,
    orders: arOrders,
    admin: arAdmin,
    policies: arPolicies,
  },
} as const;

type AppLocale = keyof typeof messageCatalogs;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as AppLocale)) {
    locale = routing.defaultLocale;
  }

  const resolvedLocale = locale as AppLocale;

  return {
    locale: resolvedLocale,
    messages: messageCatalogs[resolvedLocale],
  };
});
