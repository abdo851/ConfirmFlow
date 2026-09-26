# Final diagnosis — `/app/grant` on `yhken8-ej`

**Date:** 26 September 2026  
**Apps:** `425297805313` and `428474957825` (org `177828797`)  
**Status:** read-only exploration — nothing changed

## 1. Executive summary

1. `/app/grant` is Shopify’s own install-approval page. Confirma does not serve it, so a correct `application_url` and redirect URL cannot prevent this 404.
2. The French sentence means Shopify rejected the install link: it expired, or the app is not allowed on that store.
3. A brand-new app failing immediately makes expiry unlikely. “Not available for this store” fits better.
4. The store can still appear in “Choose a store” because that list is stores the user can open, not stores the app is allowed to install on.
5. Paying $1 to reactivate a development store turns it into a live store. That is the strongest explanation for why every Dev Dashboard install dies on the grant page. Whether `yhken8-ej` is still inside org `177828797` is **uncertain** until the Stores list is checked.

## 2. Why `/app/grant` fails

Dev Dashboard **Installer l'appli** does not start Confirma’s OAuth. Shopify creates an access-change and sends the browser to:

`https://admin.shopify.com/store/yhken8-ej/app/grant?access_change_uuid=…&client_id=…`

On a successful install the merchant would see the permission screen. A 404 means Shopify refused to render that screen. `use_legacy_install_flow` never runs, which is why both `true` and `false` fail the same way.

The French text is:

> Ce lien d'installation ne peut pas être utilisé. Il a peut-être expiré, ou l'appli n'est peut-être pas disponible pour cette boutique.

That is Shopify’s invalid-install-link message. Help Center states the two checks in that sentence:

- Custom install links expire after **7 days**.
- A custom app link works only for the store it was generated for. Another store, or a store the app is not allowed to use, is rejected.

Other checks that produce the same message, from Shopify staff and Help Center, not from Confirma:

- The installer is not the store owner.
- The app is custom-bound to a different shop.
- The store is transferable, and custom-app install is blocked on that state.
- The access-change has no valid source, so the grant page cannot load. This was a Shopify platform bug around unified-admin redirects. **Uncertain** whether it is still the cause in September 2026.

`/admin/oauth/authorize` is the later step, used only after Shopify has accepted an install for a standalone app. The Dev Dashboard button never gets that far.

## 3. Is the Dev Dashboard the right place?

**Yes for a store in the same organization. No for this failure.**

Dev Dashboard can install on a development store that belongs to the app’s organization. It is not unable to install on development stores in general. This store is selected, then rejected. Correct URLs and an Active version do not override that availability check.

## 4. Is a Partner account the answer?

**Partly. Uncertain that this email can open it.**

`partners.shopify.com` is still active. On 30 March 2026 Shopify moved app building and stores to the Dev Dashboard, and left **payouts, app distribution, themes, and referrals** in the Partner Dashboard.

The screen “Il n'y a actuellement aucune invitation pour abderrahimallali92@gmail.com” means that email has **no Partner invite**. It is not a button to create an organization. The March 2026 migration also cancelled pending invites. They are re-sent from Organization Settings → Users, not from that empty page.

## 5. Exact steps

### A. See why this store is rejected

1. Open `https://dev.shopify.com/dashboard/177828797`.
2. Open **Stores**.
3. If `yhken8-ej` is not listed as a dev store of this organization, the grant error is expected. The admin URL still opens because the same person can log into the store.

### B. Install today without review, on a store Shopify will accept

1. In that same Dev Dashboard, create a **new development store**.
2. Open `https://dev.shopify.com/dashboard/177828797/apps/428474957825`.
3. **Installer l'appli** → choose the **new** store, not `yhken8-ej`.
4. The grant page should show permissions instead of the French error.
5. After approval, copy Client ID and Client secret from the app’s Settings.
6. The token is **not** on the grant page. Request it with `POST https://{new-store}.myshopify.com/admin/oauth/access_token` and `grant_type=client_credentials`. It expires in 24 hours.

This does **not** install Confirma on `yhken8-ej`.

### C. Install on `yhken8-ej` without review

1. Do not use the empty invitation page.
2. Open `https://partners.shopify.com` as the **owner of organization 177828797**. If `abderrahimallali92@gmail.com` only sees “no invitations,” that is the wrong login.
3. If nobody can log in, create the Partner account at `https://www.shopify.com/partners`. Do not invent an org from the invitation screen.
4. In the Partner Dashboard, open **App distribution** for app `428474957825`.
5. Choose **Custom**. That choice is permanent. Enter `yhken8-ej.myshopify.com`. Generate a new link. It expires in 7 days.
6. Open that link in a private window while logged into `yhken8-ej` as the **store owner**.
7. Approve the grant screen. Then use client credentials if the store is in the app’s organization, or Confirma’s authorization-code callback if the install redirects to the app URL.

If App distribution is missing for this login, the app was created as a merchant Dev Dashboard app and cannot be switched to Custom from `shopify.app.toml` or the CLI.

## 6. Is review the only way?

**No, not for a store inside the app’s organization.**

**Yes for `yhken8-ej` if both of these are true:** it is no longer in org `177828797`, and the Partner Dashboard will not generate a Custom link for it. Public or unlisted distribution then requires App Review. Shopify does not publish a duration.

## 7. What to do today

Open `https://dev.shopify.com/dashboard/177828797` → **Stores**. If `yhken8-ej` is absent, stop retrying **Installer l'appli** on it. Create a new development store in that org and install app `428474957825` there. Use `https://partners.shopify.com` only with the organization owner, for a Custom link aimed at `yhken8-ej`.
