# Custom distribution check — app `428474957825`

**App home:** `https://dev.shopify.com/dashboard/177828797/apps/428474957825`  
**Version:** `confirma-1` (Active)  
**Checked:** 26 September 2026  
**Status:** read-only exploration — nothing changed

This pass did not open the Dev Dashboard. The UI finding is what you reported: no Distribution tab and no Custom distribution control on this app.

## 1. Is Custom distribution still available?

**Yes, as a Shopify option. No, as a tab on this app.**

Current docs still describe Custom distribution: one store, or stores in one Plus organization, no App Review. Shopify staff repeated that on 3 February 2026 and 25 February 2026. It was not removed.

What those same staff replies say is that the control is **hidden** when the app was created in the Dev Dashboard as a merchant app. That app is already limited to stores in its organization. There is nothing to choose.

## 2. Where it is, when it appears

It is not a sidebar tab.

Official path, on the app **Home**:

1. Open `https://dev.shopify.com/dashboard/177828797/apps/428474957825`
2. Find the **Distribution** card (not a tab).
3. Click **Select distribution method**.
4. Choose **Custom distribution** and confirm. That choice is permanent.
5. The same card then says **Manage custom install link**. Enter `yhken8-ej.myshopify.com`, generate the link, and send it to the store owner.

There is no documented URL like `/distribution` for this screen. If the card is not on Home, this app does not have that step.

Shopify staff: the card appears for apps created from a **Partner** account. It does not appear for apps created from a merchant’s Dev Dashboard.

## 3. If the card is missing

It was not removed in a dated shutdown. Staff explained the missing section on 3 February 2026: merchant-created Dev Dashboard apps skip it.

For this app the install path staff describe is:

1. Home → **Installs** card → **Install app** (also in the ⋯ menu on the Apps list).
2. Pick a store that belongs to organization `177828797`.
3. Settings → copy Client ID and Client secret.
4. Exchange them with `grant_type=client_credentials`. The token expires in 24 hours.

If `yhken8-ej` is not in that install list, this app cannot be pointed at it. Custom distribution for a store outside the org is a Partner-created app, not a hidden toggle on this one.

## 4. Can you mark this app Custom another way?

| Method | Can it set Custom? |
|---|---|
| Dev Dashboard UI | Only the Home **Distribution** card, and only when Shopify shows it. No other tab. |
| `shopify.app.toml` | **No.** The published app-configuration reference has no `distribution` field. `shopify app deploy` releases URLs, scopes, and webhooks. It does not choose Public vs Custom. |
| App library `AppDistribution.SingleMerchant` | **No.** That is a runtime setting inside Shopify’s React Router app package. It does not change the app’s distribution record. |
| Shopify CLI | **No documented command** that sets distribution. `shopify app config link` and `shopify app dev` link and install for development. They do not add the missing card. |
| Admin API | **No documented call.** Uncertain whether an internal API exists. Nothing public to call. |

## 5. If you still cannot see the card

Do not start App Review for this one store.

1. On this app’s Home, use **Install app**. If `yhken8-ej` is listed, install it and use client credentials. No review.
2. If it is not listed, create the app from the Partner account that is allowed to choose distribution, then use **Select distribution method → Custom**. Do not flip this app to Public to “unlock” a menu. Public requires review and cannot be undone.
3. Public or unlisted review is the path for many unrelated stores. Shopify does not publish a review duration. A few days is a planning guess, not a promise. It is not required to install on one store in your own organization.

## Recommended action

On `https://dev.shopify.com/dashboard/177828797/apps/428474957825`, look on **Home** for a Distribution card; if it is absent, install from the **Installs** card onto a store in this organization instead of submitting the app for review.
