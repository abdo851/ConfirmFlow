# API settings section

**Page:** `/dashboard/settings/api`  
**Status:** analysis only — nothing changed

## 1. What it is

A settings card titled from the `api` navigation label. It shows a masked placeholder `•••• •••• ••••` and the text that a live key is not issued from this screen (`dashboard.pages.apiVisual`).

## 2. Why it exists

It is a visual placeholder for a future merchant API key. The page copy says API access is visual for now.

## 3. What it is used for

Nothing operational. It does not create, store, or validate a key. No request is sent.

## 4. Is it used by Confirma’s architecture?

**No.** Orders, webhooks, and Meta / TikTok / Google / store connections do not read this screen. Those credentials live in their own connection records.

## 5. Keep, hide, or repurpose?

**Hide it** until a real key exists. Keeping the card implies a key the product does not issue. Repurpose it only when there is a defined public API. This pass did not hide it, because the task was explanation only.
