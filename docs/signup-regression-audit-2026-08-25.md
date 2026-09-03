# Loveli Luxury Signup Regression Audit

**Audit date:** 25 August 2026

## Executive finding

The persistent “Database error saving new user” was caused by two separate regressions introduced during the recent authentication hardening work. First, the new identity preflight route used `NextResponse` without importing it. That made the newly added preflight endpoint fail at runtime and could prevent a normal signup from reaching Supabase Auth. Second, production contains an `identity_reservations` table and reservation functions that were not present in the repository migrations. Failed or abandoned signup attempts left rows with `user_id = NULL`; subsequent attempts using the same email, username, or phone were rejected as already in use.

The browser, cache, and referral cookie were not the root cause. The production evidence showed orphan reservations for `superking`, `+254759328220`, and `ashirumaabala@gmail.com`, each with `user_id = NULL` and no matching Auth user or profile. Those claims were removed individually after verification.

## Regression timeline

| Change | Finding | Impact |
|---|---|---|
| `064_auth_profile_trigger_repair_20260824.sql` | Replaced the Auth profile trigger and required a valid phone during profile creation. | Correctly addressed missing/strict legacy trigger behavior, but increased the number of database conditions that can abort Auth signup. |
| `065_remove_legacy_auth_profile_trigger_20260824.sql` | Removed several legacy trigger names and kept one canonical trigger. | Necessary trigger cleanup; live verification confirmed the canonical trigger remained. |
| `066_auth_profile_required_defaults_20260825.sql` | Added defaults for required profile columns such as `referral_number`, country, language, and currency. | Corrected a real production schema mismatch. |
| `067_fix_phone_e164_signup_constraint_20260825.sql` | Corrected the malformed phone regex. | Corrected a real production constraint bug. |
| Commit `1791f57` | Added `/api/auth/check-identity` and updated signup preflight. | The route referenced `NextResponse` without an import, creating a new client-visible signup failure path. |
| Production-only reservation logic | Reserved email, username, and phone identities. | Orphan `NULL`-owned reservations permanently blocked later signup attempts. |

## Applied fixes in the checkout

`src/app/api/auth/check-identity/route.ts` now imports `NextResponse`, and the production build completes successfully. A new migration, `068_harden_identity_reservation_cleanup_20260825.sql`, updates `reserve_profile_identity()` to delete only matching `NULL`-owned stale reservations before claiming the identity. Reservations belonging to another user remain protected.

## Verification results

The TypeScript check passed. The production Next.js build passed and generated the signup and identity-preflight routes successfully. The Vitest suite executed 293 passing tests and 8 skipped tests; two test files reported infrastructure failures because required public environment variables were absent and worker processes ran out of memory. Those failures are separate from the signup code path and should be rerun in CI or with the test environment loaded.

## Required production actions

1. Apply migration 068 to production after confirming the currently deleted orphan rows are no longer present.
2. Deploy the repaired preflight route.
3. Test a regular buyer signup with a new email, username, and E.164 phone.
4. Confirm the resulting Auth user has a profile and exactly the default customer role.
5. Test `/partners/signup` without a referral cookie and with a valid explicit upline link. The first must be blocked; the second must proceed to the KES 900 onboarding flow.
6. Run a separate payment and commission regression pass. M-Pesa remains deferred/inactive unless explicitly re-enabled.

## Priority for the next phase

Client onboarding should be completed before SEO/GEO work. Payment-provider reconciliation and commission distribution should be audited against production data and the approved compensation plan only after the signup path is stable. No broad working-tree deployment should be made because the checkout contains unrelated uncommitted visual, payment, and administrative changes.
