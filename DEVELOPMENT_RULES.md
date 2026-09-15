# Confirma Development Rules

These rules apply to all contributors and AI agents working on this project.

1. **Never modify production directly.** All changes go through version control, review, and approved deployment processes.

2. **Never delete production data.** No destructive operations against live databases or user data.

3. **Never change the database schema without a migration.** All schema changes must be versioned SQL files in `database/migrations/`.

4. **Never introduce an integration directly into the core.** External platforms must not be imported from feature or page code.

5. **Integrations must use adapters.** Implement `StoreAdapter`, `ConfirmationAdapter`, or `MarketingAdapter` in `integrations/` and register through `lib/integrations/adapters/`.

6. **Never hardcode secrets.** Use environment variables. Reference `.env.example` for required names.

7. **External events must eventually be idempotent.** Webhook and conversion handlers must use idempotency keys before production use.

8. **Do not add features without approval.** Each milestone has an explicit scope; stay within it.

9. **Do not add dependencies without a reason.** Prefer the approved stack; justify new packages.

10. **Do not perform large refactors without approval.** Incremental, reviewable changes only.

11. **Preserve backward compatibility.** Migrations and API changes must not break existing consumers without a plan.

12. **Do not change approved architecture without approval.** Adapter boundaries, folder structure, and stack choices are governed by project specs.

13. **When requirements are ambiguous, stop and ask.** Do not guess product behavior.

14. **Suggestions are allowed only as suggestions.** Report under "Suggestions — NOT IMPLEMENTED"; do not implement unapproved ideas.

15. **Each milestone must be completed and reviewed before the next begins.** Do not skip ahead (e.g., M0 → M2).
