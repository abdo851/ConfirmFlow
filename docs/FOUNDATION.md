# Onafirm foundation

This document describes the type layer in `lib/foundation/types.ts`. That file is types only. It does not confirm orders, call Meta, write to the database, or replace the confirmation pipeline that already exists. It is the vocabulary later adapters will share.

Onafirm stays a confirmation product. A merchant still confirms a cash-on-delivery order, and that confirmation can still notify advertising channels. The foundation changes the shape of the next integrations, not the current confirm path.

## 1. Why Onafirm is an event orchestration platform

A "COD Network integration" would mean one partner, one set of endpoints, and business rules written in the shape of that partner. The next request would then be a special case inside the same functions. TikTok, Google, and a second fulfillment service would each add another branch.

Onafirm is the place where order facts are recorded and then handed to whoever should hear them. The fact is the event. The partner is only one way an event can arrive, or one place an event can be sent.

That split matters for three reasons.

- The confirmation state machine stays the authority for a merchant's own orders. Pending can become confirmed, rejected, or archived. It does not move backwards. The foundation does not redefine that machine.
- A later service can report the same kind of fact without becoming a second confirmation engine. It emits an event. It does not open a private door into ad delivery.
- Advertising destinations are listeners. They do not decide that an order is confirmed. They receive a fact that confirmation already produced.

Calling the product an orchestration platform does not mean a new runtime, a queue, or a hosted bus. It means the contract between parts is an event with a type, a source, an owner, and an order. Providers plug into that contract. They do not each invent a private one.

```ts
type EventType = "ORDER_CONFIRMED" | "ORDER_DELIVERED" | "ORDER_CANCELLED";
```

Those three names are the whole public vocabulary of order facts. A new partner does not get a fourth name because its API uses a different word. The adapter translates the partner's word into one of these three.

What this layer is not:

- It is not a second database schema. Tables, row-level security, and migrations stay where they are until a later task asks for them.
- It is not a queue worker. Nothing in the type file starts, retries, or schedules work.
- It is not permission to skip signature checks, owner checks, or the confirm route.

The practical test is small. Given a new partner, a contributor should be able to name its kind, its capabilities, and the event type it emits, without editing the confirmation state machine. If they cannot, the partner is still being treated as a special case.

A useful picture is a switchboard. Stores and service providers call in with a fact. The router looks up the merchant's rules. Advertising adapters are the lines that ring. Unplugging one line does not silence the others, and the person who placed the call does not get to rewire the board.

That picture also limits this document. The switchboard is not installed yet. Today's confirm route still performs the advertising hand-off it already owns. The types name the jacks and the calls so the next task can add an adapter without inventing a private vocabulary. They do not move the current wires.

If a future task needs a fourth event type, that is a change to the union, asked for in writing. It is not something an adapter may invent locally and hope the router understands. Closed unions are the point. An open string would let every partner spell "confirmed" differently and push the translation problem into every reader.

A partner-shaped design also leaks into the screen. Buttons, empty states, and error text start saying the partner's name in places that should say what happened to the order. The event vocabulary keeps the screen talking about confirmed, delivered, and cancelled, and leaves the partner name on the connection that reported the fact.

## 2. The three integration kinds

Every provider is one of three kinds. The kind says which side of the platform the provider sits on. It does not say which company it is.

**Store.** A store is where the order is born. WooCommerce, YouCan, and Shopify are stores. A store connection can create or read orders. It is not an advertising destination and it is not a call-center service.

**Service provider.** A service provider acts on an order after it exists. COD Network, in both of its roles, is a service provider. A future call desk or delivery network would be the same kind. Service providers may receive status webhooks or lead updates. They still do not own the merchant's account.

**Advertising.** An advertising integration sends a conversion after a fact is already true. Meta is the active destination. TikTok and Google are reserved. Reserved means the name exists in the type system so a later adapter can register it. It does not mean those sends are implemented by this document.

A provider record carries four fields: an id, a kind, a display name, and a status of active, reserved, or coming soon. Status is a label for the product surface. It is not a permission check. Code that sends an event still has to look at a routing rule and a real connection.

Capabilities are separate from kind. Kind answers "what sort of integration is this?" Capability answers "what may this connection do?" The allowed capabilities are:

- `create_order` and `read_order` for pulling or accepting orders.
- `receive_status_webhook` for a signed callback that updates delivery or cancellation.
- `send_conversion_event` for an advertising destination.
- `receive_lead_status` for a service that reports lead or confirmation progress.
- `product_mapping_required` when the provider cannot be used safely until products are linked.

A connection belongs to one owner, points at one provider, and lists only the capabilities that owner has turned on. Disconnected and pending connections are data. They are not a reason for business logic to special-case the provider name.

Kind and capability together prevent a common mix-up. A store that can receive a webhook is still a store. The webhook capability does not turn it into an advertising channel. An advertising name that is only reserved does not gain permission to send because it appears in the destination union.

Connection status is deliberately small: connected, disconnected, or pending. There is no status that means "send ads even though the rule is off." Pending means setup is unfinished. Disconnected means the merchant turned the link off. Both mean "do not act," and neither one requires the company name in the check.

Display name is for people. Provider id is for code and for mappings. The display name can change when product copy changes. The id stays stable so stored connections and mappings do not break.

## 3. The event is the central unit

An order event is one immutable statement: this owner, this order, this type, this source, at this time, with a payload. The payload is an open record because partners disagree on extra fields. The type and the source are not open. They are closed unions.

Manual confirmation and a COD Network confirmation are different sources. They are the same event type when they mean the same fact.

- A merchant pressing confirm in Onafirm produces `ORDER_CONFIRMED` with source `manual`.
- A COD Network seller callback that means the buyer confirmed produces `ORDER_CONFIRMED` with source `cod_network_seller`.
- An affiliate callback with the same meaning produces `ORDER_CONFIRMED` with source `cod_network_affiliate`.

The router, the log, and any later destination read `type`. They do not read `source` to decide whether the fact is real. Source is audit. It answers who said it. It does not answer whether advertising is allowed to run.

`ORDER_DELIVERED` and `ORDER_CANCELLED` follow the same rule. A carrier, a service provider, or a future service may be the source. The type stays one of the three names above. Nothing in this layer sends an advertising event for a pending or rejected order, because those states are not event types here.

```ts
source: "manual" | "cod_network_seller" | "cod_network_affiliate";
type: "ORDER_CONFIRMED";
```

Two events can share `type` and differ only in `source`. Downstream code that branches on the source to pick a destination has left the foundation.

The existing confirm route remains the only entry point for a merchant confirmation, and ad delivery remains something that route orchestrates for the channels it already knows. This document does not move that code. When a router exists later, manual confirmation and an automated confirmation must both enter it. They must not grow two senders.

Owner id on the event comes from a trusted row: the session, a verified webhook, or the store that owns the order. It is never copied from a request body, a query string, or a URL.

The payload may hold a partner reference or a status word the adapter already verified. It must not hold a decrypted secret. Readers tolerate missing keys. They do not require a key that only one partner sends and then fail every other event for lacking it.

The event id is not the order id. One order can collect several events: confirmed, then delivered, or confirmed, then cancelled. Those are separate facts. A later event does not erase the source of the earlier one.

`service_b` and `service_c` are reserved source names. They exist so a future service can be named without pretending it is COD Network. They are not a junk drawer. A real partner gets its own source member when the owner asks for that union to grow.

## 4. The event router

The router is a decision, not a provider. Its input is an event type and the merchant's routing rules. Its output is a list of advertising destinations that should hear that type.

A routing rule belongs to one owner, names one event type, lists zero or more destinations, and can be disabled. Destinations today are `meta`, `tiktok`, and `google`. A disabled rule sends nowhere. An enabled rule sends only to the destinations written on that rule.

The source of the event is not an input to that decision. A manual `ORDER_CONFIRMED` and a COD Network `ORDER_CONFIRMED` consult the same rule for that owner and that type. If the merchant enabled Meta for `ORDER_CONFIRMED`, both sources can reach Meta. If the merchant did not, neither source invents a send.

```ts
eventType: "ORDER_CONFIRMED";
destinations: ["meta"];
enabled: true;
```

The router does not know how Meta, TikTok, or Google accept HTTP. Each destination adapter knows its own client, its own secret, and its own URL. The router only names the destination. The adapter performs the send, inside its own try/catch, so one failure does not cancel the others.

Sends are logged. A log row records the payload, the status, and the HTTP status. The foundation type does not define that table. The rule for future work is the same rule the product already uses: nothing is sent for an order that is still pending or rejected, and nothing is retried by a hidden loop. The merchant retries.

Hardcoding "always Meta" inside the router would freeze the product to one channel. Hardcoding "if this came from COD Network, also call TikTok" would smuggle a provider into the decision. Both are out of bounds. A new channel is a new destination value, a new adapter, and a rule the merchant can enable.

A merchant may enable Meta for `ORDER_CONFIRMED` and enable nothing for `ORDER_DELIVERED`. That choice lives on the rule. An empty destination list is valid. The fact is recorded, and no ad channel is called.

Destination order is not priority and not a transaction. If Meta fails and TikTok is also listed, TikTok still gets its own attempt. A successful send is not rolled back because a later one failed. Each attempt is logged on its own.

The router does not read a destination out of the payload. A partner who includes a preferred channel in the body does not override the merchant's rule. Payload is context for the adapter that already accepted the event. Destinations come from the rule.

Rules are per owner. One merchant's Meta setting does not apply to another merchant who connected the same provider. The lookup key is the owner on the event plus the event type. Both must already be trusted before the lookup runs. A missing rule is the same as a disabled rule: record the fact, send nothing, and do not guess a default channel.

## 5. Product mapping

Onafirm's own product is small: an id, an owner, a name, an optional sku, and an optional variant. That record is the internal product. It does not store a YouCan id, a COD Network id, or a Meta content id on the same object.

External ids live on a product mapping. One mapping joins one internal product to one external product id at one provider. The same internal product can have several mappings, one per provider, without those providers knowing about each other.

Mapping status is `auto`, `manual`, or `required`.

- `auto` means the adapter matched on sku, name, or another declared key and stored the link without asking.
- `manual` means a person confirmed or edited the link.
- `required` means the adapter cannot proceed and the merchant has not chosen a link yet.

Auto-map runs first. The product asks the merchant only when automatic matching fails or is ambiguous. Onboarding does not collect a mapping spreadsheet. A mapping screen appears only after an integration reports the `product_mapping_required` capability and actually has rows in `required`.

```ts
status: "auto" | "manual" | "required";
externalProviderId: "cod_network_seller";
```

Advertising content ids are mappings like any other external id. Meta's content id is not a column on the internal product that TikTok then has to share. Each destination adapter reads the mapping for its own provider id.

Matching order is fixed. The adapter tries sku when both sides have one. If sku is missing or hits more than one internal product, it may try a normalized name. If that is also ambiguous, it stops and marks the mapping required. It does not pick the first row to be helpful.

A required mapping blocks only the provider that asked for it. Store orders that do not need a mapping continue. An advertising send that needs a content id waits for that destination's mapping. It does not wait for an unrelated provider to finish a spreadsheet.

Manual mapping edits the link. It does not create a second internal product to force a match. A duplicate product would split history across two ids. The merchant corrects the mapping row instead.

## 6. Adding a new integration

A new integration is an adapter plus a registry entry. It is not a branch inside confirmation, orders, or the router.

The adapter satisfies `AdapterInterface`. It names its provider id, its kind, and its capabilities. `isConfigured` answers whether the merchant has supplied enough config for that adapter to run. The config type belongs to the adapter. The foundation does not know the field names.

The work to add one is:

- Add a new file for that adapter. Keep its client, secrets, and base URL inside that integration.
- Register the provider with a kind and a status.
- Declare capabilities. Do not grant `send_conversion_event` to a store, and do not grant `create_order` to an advertising channel, unless that provider truly does both and the capability list says so on purpose.
- Translate that provider's payloads into `OrderEvent` or into a destination send. Do not translate other providers' payloads there.
- Leave `lib/confirmation`, the confirm route, and existing store normalizers alone unless the owner asks for a change in those files.

Zero changes to business logic means the state machine, the owner check, and the router decision do not gain a new condition. If a change seems to require `if (provider === "some_new_name")` outside the adapter, the design is wrong. The adapter should have expressed that difference as a capability or as a translated event.

```ts
kind: "service_provider";
capabilities: ["receive_status_webhook", "receive_lead_status"];
```

Secrets stay encrypted with the secret that integration already uses, such as the shipping or YouCan session secret where those already exist. Decrypted values are never logged. A new integration does not read another integration's secret module.

Cross-imports are forbidden. A COD Network file does not import the YouCan client. A TikTok file does not import the Meta client. Shared ideas live in the foundation types, which import nothing.

The registry is a list, not a switch. It can answer which adapters exist and which of them declare a capability. It does not answer what confirmation should do next. Confirmation already has one entry point. The registry is how the platform discovers adapters. It is not how an order changes state.

`isConfigured` is a predicate on config the adapter understands. Null config means not configured. A half-filled config also returns false. Callers do not inspect the secret fields themselves, because those fields are not part of the foundation.

Coming soon is a status on the provider record. An adapter may be registered and still refuse to run while that status is coming soon or reserved. The screen may show the label. The router still must not call a destination the merchant did not enable.

## 7. COD Network seller and COD Network affiliate

COD Network is not one adapter. It is two service providers that happen to share a brand.

The seller adapter speaks for the merchant's own COD Network seller account. Its event source is `cod_network_seller`. It may receive lead or status updates about orders that belong to that merchant. It may require product mapping when COD Network's product ids do not match Onafirm's sku.

The affiliate adapter speaks for the affiliate role. Its event source is `cod_network_affiliate`. An affiliate confirmation is still `ORDER_CONFIRMED` when the fact is a confirmation. The source name records which role reported it. The router does not contain a seller path and an affiliate path.

Reasons to keep them apart:

- Credentials differ. A seller token must not unlock affiliate calls, and the reverse is also true.
- Capabilities can differ. One role might receive lead status. The other might only receive a status webhook. The capability list says which.
- Product ids can differ. Each role gets its own mappings under its own provider id.
- Failure is isolated. A bad affiliate payload must not block a seller webhook, and neither of them is allowed to block Meta by living inside Meta's try/catch.

Neither adapter writes `owner_id` from the webhook body. The connection row that matched the verified signature supplies the owner. If the signature cannot be tied to a connection, the event is rejected. It is not stored under a guessed account.

Neither adapter calls the advertising HTTP APIs. They emit an `ORDER_CONFIRMED`, `ORDER_DELIVERED`, or `ORDER_CANCELLED` event. The router, later, selects destinations. Until that router is actually built, these adapters do not exist as code. This section is the contract they will have to meet.

A shared HTTP host, if the partner uses one, is an implementation detail inside each adapter. Sharing a host does not justify a module that both adapters import from each other. If a few lines of parsing are identical, they still should not become a helper that knows which role is calling. Duplicating those lines is cheaper than a cross-import that later grows a role flag.

Seller events and affiliate events can refer to different ids in the partner's system. The adapter resolves that id to an Onafirm order id before the event is accepted. A body that only has a partner order number is not yet an `OrderEvent`. It is a webhook the adapter has not finished translating.

The two adapters can ship at different times. The seller adapter does not require the affiliate adapter to exist. A merchant can connect one role and leave the other disconnected. The type system already has both source names, so the second adapter does not need a new event shape.

A confirmed event from either role is still subject to the same advertising rule as a manual confirmation. Connecting COD Network does not silently turn on Meta, TikTok, or Google. Those channels stay off until a routing rule for that owner and that event type says otherwise.

If the partner later adds a third role, it gets its own adapter, its own provider id, and its own source member. It does not get a boolean on the seller adapter. Folding roles together is how `if (provider === "cod_network")` returns.

## 8. Do not

Future changes should refuse the following, even when a shortcut looks smaller.

- Do not write `if (provider === "cod_network")` in business logic. Provider-specific behavior stays inside that provider's adapter. Seller and affiliate are already different provider ids, not one string with a mode flag.
- Do not hardcode destinations. Meta, TikTok, and Google are chosen by a routing rule. Adding a destination means a new adapter and a registry entry, then a rule the merchant can enable. A destination that skips the router is a second, hidden product.
- Do not take `owner_id` from user input. Session, verified webhook, or an owned store row are the trusted sources. Query params, JSON bodies, and URL segments are not.
- Do not cross-import between integrations. Each integration keeps its own client, its own secrets, and its own base URL. The foundation file stays import-free so it cannot become a back door between them.
- Do not rename `X-Confirma-Signature`. Custom-carrier receivers already depend on that header. Storage keys that start with `confirma-` and salt strings used to encrypt tokens are likewise frozen. Renaming them breaks existing clients or existing ciphertext. User-visible copy may say Onafirm. The header name may not.

Related refusals follow from the same walls.

- Do not add shipping calls to the confirm route, and do not call ad delivery from a webhook that has not gone through confirmation.
- Do not edit an applied migration to make a new column fit. A new fact gets a new migration file, and the database folder stays in step with the supabase folder.
- Do not log decrypted tokens while debugging an adapter. Log the connection id and the event id.
- Do not treat reserved destinations as live. TikTok and Google are names in the union. They are not a promise that a send exists.
- Do not ask the merchant to map products during onboarding. Ask only when a connected integration has reported that it needs a mapping and auto-map did not finish the job.

Names in this document match `lib/foundation/types.ts` and nowhere else. `IntegrationKind`, `Capability`, `OrderEvent`, `RoutingRule`, `ProductMapping`, and `AdapterInterface` are the words to use in later tasks. Adding a synonym in a new file would split the vocabulary the scaffold just gathered.

When a later task builds the router or either COD Network adapter, it should import these types and keep the behavior inside the new file. It should not reopen confirmation, auth, store normalizers, or the confirm route to "make room." Those files already have a job. The scaffold was added so they do not have to grow a branch for every new partner.

Read the types in the order they are declared. Kind and provider come first, then what a connection is allowed to do. Events and routing come next, because they are the contract between a source and a destination. Products and mappings come after that. The adapter interface is last because it is the plug, not the business rule.

If a sentence in a future task cannot be said with those names, stop and ask. Do not invent a parallel set of types beside this file. Two vocabularies would put the project back where a COD Network integration would have left it: one partner, one private language, and a branch in the middle of the product.

Keep the next change as small as the scaffold itself.

- One adapter file for one provider.
- One registry entry.
- One capability list.
- No new branch in the confirm route.
- No new owner check that trusts the client.
- No rename of a frozen header, storage key, or encryption salt.

This file and `lib/foundation/types.ts` are the scaffold. They are not permission to rewrite confirmation, auth, orders, or the current store integrations.
