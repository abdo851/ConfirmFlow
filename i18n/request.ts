import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

async function loadMessages(locale: string) {
  const [
    common,
    navigation,
    auth,
    landing,
    dashboard,
    onboarding,
    connections,
    errors,
  ] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/navigation.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/landing.json`),
    import(`../messages/${locale}/dashboard.json`),
    import(`../messages/${locale}/onboarding.json`),
    import(`../messages/${locale}/connections.json`),
    import(`../messages/${locale}/errors.json`),
  ]);

  return {
    common: common.default,
    navigation: navigation.default,
    auth: auth.default,
    landing: landing.default,
    dashboard: dashboard.default,
    onboarding: onboarding.default,
    connections: connections.default,
    errors: errors.default,
  };
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "ar")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
