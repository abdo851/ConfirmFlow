# Shopify install options — September 2026

**Store:** `yhken8-ej.myshopify.com`  
**Status:** read-only exploration — nothing changed

Sources checked on 26 September 2026: [About app distribution](https://shopify.dev/docs/apps/launch/distribution), [Select a distribution method](https://shopify.dev/docs/apps/launch/distribution/select-distribution-method), [Protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data), [Client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant), [Admin-created custom apps](https://shopify.dev/docs/apps/build/authentication-authorization/legacy/admin-custom-apps), and Shopify staff replies on the developer community (April 2026 and later).

---

## 1. Executive summary

1. App Review is **not** required to install one app on one store. Shopify’s current distribution table still lists **Custom distribution** with approval **No**.
2. App Review **is** required for a public or unlisted app, which is the only supported way to install the **same** app on many unrelated stores.
3. Creating a custom app inside the store admin is gone for new apps (cutoff called out as 1 January 2026). Old ones still work. Private apps were already removed in 2022.
4. The French error and the `/app/grant` 404 mean Shopify rejected that install attempt. Turning `use_legacy_install_flow` on or off does not replace a valid custom install link.
5. The path that can finish today is Custom distribution for `yhken8-ej` only, or client credentials if that store is in the same Dev Dashboard organization as the app.

---

## 2. Part A — ways to install without App Review

| Option | Exists in 2026? | App Review? | How it is set up | Limits |
|---|---|---|---|---|
| Custom app created in the store admin | **No** for new apps. Existing apps created before 1 Jan 2026 still run. | No | Was: Shopify admin → Develop apps → install → copy the Admin API token once. The admin now sends people to the Dev Dashboard. | Cannot be created again. Deleting one is permanent. Token is shown once. No App Bridge, no extensions, no Billing API. |
| Custom distribution | **Yes.** Official docs and a Shopify staff reply on 28 April 2026 still describe it. | **No** | Dev Dashboard → app Home → Distribution → Select distribution method (this opens the distribution screen) → Custom → enter `yhken8-ej.myshopify.com` → Generate link → store owner opens that exact link. | One store, or several stores only if they share one Plus organization. Choice is permanent. Cannot bill through Shopify. Cloning the same app per merchant to dodge review violates the Partner Program Agreement. |
| Dev Dashboard “Install app” on a store in the **same organization** | **Yes**, for stores that appear in that org’s install list. | No | Release a version with scopes. Install from the Dev Dashboard onto a store in that org. Then use client credentials, or token exchange / the code grant depending on embedded vs standalone. | Does **not** list a client store in another organization. A collaborator “Develop apps” permission does not put the client store in your org. |
| Client credentials grant | **Yes** | No | `POST https://{shop}.myshopify.com/admin/oauth/access_token` with `grant_type=client_credentials`, client id, and client secret. Token lasts 24 hours (`expires_in` 86399). Request it again to refresh. | Only if the app and the store are in the **same** organization. Not for a client’s store. |
| Shopify CLI `shopify app dev` | **Yes** | No, for the linked development store | CLI scaffolds or links the app and installs it on a development store in the session. | A development-store install. It does not bypass distribution rules for an unrelated paid store. |
| Authorization code grant with `use_legacy_install_flow = true` | **Yes.** This is still the documented grant for a **standalone** app. | No for custom distribution. Yes if the app is public. | Scopes can be requested on the authorize URL. Redirect URI must match. For a custom app, the **first** open must be the generated install link, not a hand-built `/admin/oauth/authorize` URL. | `false` means Shopify managed install: Shopify grants scopes from the released config and does not call your OAuth callback. A standalone app that then sends the browser to `/app/grant` itself can 404. |
| Unlisted app | **Yes**, but it is a **public** app with the listing hidden from search. | **Yes.** Review first, then set visibility to unlisted. | Same submission as a public app. Merchants install from the listing URL you send them. | Not a private bypass. |
| Public App Store | **Yes** | **Yes** | Listing, privacy policy, test credentials, protected-customer-data request, submit. | Required for many unrelated merchants. |
| Hand-built `/admin/oauth/authorize` as the first install | The URL still exists. | n/a | Confirma already builds this URL. | For a custom app that is not installed yet, Shopify answers with “this installation link cannot be used.” That matches the French error. |

### A2. Is Custom distribution still in the Dev Dashboard?

**Yes.** It was not removed. The Dev Dashboard distribution card links to the screen where you choose Public or Custom. After Custom is selected, you enter the store domain and generate a link. Shopify staff restated those steps on 28 April 2026 for a partner who could not see a client store in the install picker.

There is no removal date, because the current docs still publish it. What **was** removed is creating that app from inside the store admin.

### A3. Fastest way onto `yhken8-ej` within 24 hours

1. Open the app in the Dev Dashboard and read the Distribution card.
   - If it still says “Select distribution method,” choose **Custom**, enter `yhken8-ej.myshopify.com`, generate the link, and open it as the **store owner**.
   - If it already says **Public**, that choice cannot be undone. Create a **new** app, choose Custom on that one, and point Confirma at the new client id. Do not clone this pattern later for every merchant.
   - If `yhken8-ej` appears in the same organization’s install list, skip the link and use **client credentials**. That is the shortest path. Whether this store is still in that org after the $1 reactivation is **uncertain**.
2. Release a version whose scopes include `read_orders` and `read_products` before testing the grant page.
3. For Confirma’s current standalone callback, set `embedded = false` and `use_legacy_install_flow = true`, then release that version. Managed install (`false`) will not call `/api/integrations/shopify/callback`.
4. Do not open `/admin/oauth/authorize` or `/app/grant` by hand. Do not use the Dev Dashboard button if it still loads `shopify.dev/apps/default-app-home`.

The `/app/grant` 404 with both legacy settings is consistent with an invalid or unfinished install (no released scopes, install link not for this store, embedded app whose App URL is not a real embedded UI, or the ngrok warning page inside the admin). It is **not** evidence that review is required for this one store.

---

## 3. Part B — without a normal app install

### B1. No install at all

| Approach | Works for Confirma’s order webhook? |
|---|---|
| Storefront API | **No.** It is a buyer-facing catalog/cart API. It does not replace Admin `orders/create` webhooks. |
| Pre-generated Admin API token | **Only** for an admin-created custom app that already exists on that store. New ones cannot be created. |
| Client credentials | **Yes**, with no merchant grant screen, **if** the store and the app share one organization. The token expires in 24 hours. |
| Merchant pastes a token | **No** for a new store. There is no “private app” screen left to copy a permanent token from. |

### B2. OAuth without the App Store

**Yes**, for Custom distribution and for a store in your own organization.

- Standalone (Confirma today): authorization code grant. `GET https://{shop}/admin/oauth/authorize` then `POST https://{shop}/admin/oauth/access_token`. For a custom app, Shopify only starts that grant after the generated install link is accepted.
- Embedded: token exchange after a managed install. Confirma does not implement this.
- Same organization, server only: client credentials. No redirect.

There is no OAuth that installs one non-public app on unlimited unrelated stores.

### B3. Merchant-made Admin API token

**Not for a new app.** Shopify’s own page says new custom apps are created in the Dev Dashboard or with the CLI, and the old admin flow cannot be used to replace a deleted app. A token that was generated before 1 January 2026 can still be re-issued by uninstalling and reinstalling **that** legacy app. If `yhken8-ej` never had one, this path does not exist.

---

## 4. Part C — how other products install

| Product | How merchants install | Review? |
|---|---|---|
| ClearProfit (COD Optimizer) | Shopify App Store listing `apps.shopify.com/clearprofit`. Launched 20 January 2026. | **Yes.** It is a public app. |
| Analyzify | Shopify App Store listing `apps.shopify.com/analyzify`. | **Yes.** |
| Zopi | Shopify App Store (`Zopi: AI AliExpress Dropship` and related listings). | **Yes.** |
| Importify | Shopify App Store `apps.shopify.com/importify`. Their own guide says Shopify users add it from the App Marketplace. | **Yes.** |
| TrackBee | **Uncertain.** This pass did not return an `apps.shopify.com` page named TrackBee. No evidence of a private-install method. | **Uncertain.** |

No current product in this set installs on arbitrary Shopify stores without either the App Store or a one-store custom relationship. Agencies still use Custom distribution for a single client. That does not scale, and Shopify staff say duplicating one custom app across merchants is not allowed.

Platforms that “connect Shopify” without an App Store listing are doing one of these: a custom app for one store, client credentials inside their own org, or a legacy admin token. They are not using a hidden public install.

---

## 5. Part D — recommendation

| Rank | Approach | Time to first install | Review | Confirma work | Lasts |
|---|---|---|---|---|---|
| 1 | Client credentials, only if `yhken8-ej` is in the app’s organization | Hours | No | New token request every 24 hours. Current code expects a one-time OAuth code. Scopes must be on the released version. | Only stores in that org. |
| 2 | Custom distribution + generated link + existing code grant | Same day, if distribution is still unset or already Custom | No | Add an install-entry route for Shopify’s App URL redirect (`shop`, `hmac`, `timestamp`), then keep the current authorize URL as step two. New client id in env if a new app is required. Dashboard: `embedded = false`, `use_legacy_install_flow = true`, exact redirect URI. | One store (or one Plus org). Wrong model for every future merchant. |
| 3 | Public or unlisted App Store | Not within 24 hours. Shopify will not quote a review time. A few days is a reasonable planning guess, not a guarantee. | **Yes** | Listing, privacy policy, test store credentials, protected customer data (orders include name, phone, and address: level 2 for a public app). Install URL becomes the App Store link, not a custom link. Expiring offline tokens are required for non-custom apps by 1 January 2027. | The right long-term model. |
| 4 | Legacy admin token | Impossible unless one already exists on this store | No | Paste token, skip OAuth. | Dead end for new stores. |
| 5 | Storefront API or a hand-built authorize URL | Will not install | n/a | None that fixes the grant page. | n/a |

### D2. Exact path for Confirma

Use **Custom distribution for `yhken8-ej.myshopify.com`** so this store can connect without review. Use a **new** Dev Dashboard app if the current app is already Public. Keep the authorization code grant. Start the merchant on the **generated** install link, not on `/admin/oauth/authorize`. Plan a **public app submission** before any second unrelated store.

### D3. Code per approach

| Approach | Code |
|---|---|
| Client credentials | New server call to the token endpoint. Store the token with an expiry and refresh before 24 hours. Webhook registration can stay. The connect button would not send the browser to Shopify. |
| Custom + current OAuth | One new route that verifies the install redirect HMAC and then redirects to the existing `buildShopifyAuthorizeUrl`. No change to token exchange for the first test. Confirm later whether the token includes `expires_in`. |
| Public app | Same OAuth can remain for a standalone app. Add the data-protection and listing work outside the repo. Before 1 January 2027, store `refresh_token` and send `expiring=1` on the token POST. Request protected customer data in the Partner Dashboard. |

### D4. Time

| Approach | Estimate |
|---|---|
| Client credentials, same org | A few hours of code, then an immediate token. |
| Custom link + current callback | Dashboard steps today. Code for the install-entry route is a small follow-up. The grant page can be retested the same day. |
| Public review | Submission prep is days of listing and policy work. Review itself is **uncertain** and is not a 24-hour path. |

### D5. If review is chosen anyway

1. Distribution must be **Public**. This cannot be switched later.
2. Complete the App Store listing: icon, description, screenshots or screencast, privacy policy URL, support contact, and test credentials.
3. Request protected customer data. `read_orders` is protected. Name, address, phone, and email are level 2 and need a reason plus data-protection details.
4. Release the app version Shopify will review (`embedded` and install-flow flags included).
5. Submit. States run Draft → Submitted → Reviewed → Published.
6. After publish, set the listing to unlisted if you do not want it in search. Merchants then install from the listing URL. Unlisted does **not** skip review.

---

## 6. Recommended action

Generate a Custom-distribution install link for `yhken8-ej.myshopify.com` (on a new app if the current one is already Public), open it as the store owner, and only then let Confirma run its existing authorization-code grant.

## 7. Is App Review required?

**Depends.** No for this one store via Custom distribution or same-org client credentials. Yes before the same app is installed on other unrelated stores, including an unlisted listing.

## 8. Estimated time for the recommended path

Same day for the Dashboard link and a retest. A small Confirma install-entry route is still needed so Shopify’s post-install redirect reaches the existing callback. That route was not written in this pass.

## 9. Status

read-only exploration — nothing changed
