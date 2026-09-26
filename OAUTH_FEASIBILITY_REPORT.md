# OAuth feasibility

**Status:** analysis only — nothing changed

## 1. Store platforms

| Platform | OAuth without a public-app review? | Notes |
|---|---|---|
| YouCan | **Yes.** Already implemented in Confirma. | Merchant approves the app. Needs YouCan client id and secret. No Shopify-style App Store review. |
| PrestaShop | **No standard OAuth.** | The usual path is a webservice key the merchant creates in the back office. Do not build an OAuth screen unless a specific PrestaShop version’s API is confirmed. |
| OpenCart | **No.** | The merchant creates an API user in the admin. Confirma would store that key. |
| Magento (Adobe Commerce / Open Source) | **Yes, for a private integration.** | The merchant creates an Integration in the admin and approves OAuth 1.0a. Marketplace listing is a separate, optional step. |
| Storeino | **Uncertain.** | No public OAuth document was verified in this pass. Do not assume a connect button until their API is confirmed. |
| Zid | **Uncertain for a private app.** | Zid has a partner app platform. A public app is expected to go through their review. A one-store private install was not confirmed here. |
| Salla | **Yes for a custom app on the merchant’s own store. Review for a public app.** | Salla’s developer docs describe custom mode versus a published app. Confirm the current partner portal before building. |

## 2. Ads platforms

| Platform | Can OAuth replace the manual id and token? | Review? | Effort |
|---|---|---|---|
| Meta CAPI | Partly. Facebook Login can create a token, but the Pixel / Dataset ID is still chosen by the merchant. | **Yes** before other businesses can use the app in Live mode. Development mode works only for people on the app. | High. App, permissions, and a business-selection screen. |
| TikTok Events | Partly. Marketing API OAuth exists. The pixel code is still selected in Events Manager. | **Yes** for a production app used by other advertisers. | High. |
| Google GA4 | **No.** OAuth can read a GA4 property. The Measurement Protocol still needs a Measurement ID and an API secret created in GA4. OAuth does not issue that secret. | A private Google OAuth client does not need a public app review for Analytics read access. The secret step remains. | Medium, and it does not remove the secret field. |

## 3. Recommendation

| Platform | Use |
|---|---|
| YouCan | Keep OAuth. |
| PrestaShop, OpenCart | Manual key. |
| Magento | OAuth 1.0a integration created by the merchant. |
| Storeino, Zid | Manual credentials until their current docs confirm a private install. |
| Salla | Custom-app OAuth for one store. Review only if it is published. |
| Meta, TikTok | Keep manual Pixel / token until an app review is accepted. |
| GA4 | Keep Measurement ID + API secret. |
