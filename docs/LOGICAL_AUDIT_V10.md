# EliteCRM V10 Logical Audit

## Fixed

- Empty pages caused by user-scoped reads or missing optional columns.
- Customer lists now use separate routes and fixed list criteria.
- Invalid customer and call statuses are rejected instead of becoming `interested` silently.
- Sales cannot open or update customers outside their ownership scope.
- Calls, distribution, requests, reports, dashboard statistics, registrations, data quality, and commissions use effective scope and selected year where implemented.
- Selected-user preview is blocked for call and distribution mutations.
- Duplicate open call-follow-up tasks are consolidated.
- Request status transitions and sender/receiver responsibilities are validated.
- Registration totals, payments, duplicate active registrations, and lead synchronization are protected by database triggers.
- Imports preserve operational ownership, status, payments, and follow-up fields.
- Hard deletion of operational records is blocked for non-developers.
- Direct database writes are restricted by role-based RLS policies.
- Commission calculation schema, RPC, and invoice synchronization were added.
- The developer role is protected from application-level promotion, demotion, deactivation, and deletion.

## Remaining engineering cleanup

1. The dashboard client still initializes its visible period from the current calendar year. When an older year is selected, the server data is correct but the default client date range can initially show zero values.
2. The calendar has a year-aware server loader, but the route still needs to be switched to that loader.
3. Some read-only roles can still see edit buttons in the UI. Database policies reject the write, but the controls should be hidden to avoid confusing errors.
4. Permission definitions are duplicated across navigation and two authorization modules. They should be consolidated into one source of truth.
5. Several older modules still perform browser-side Supabase mutations. Long term, these should move to validated server routes.
6. The migrations in `database/V10_RUN_ORDER.md` must be applied manually in Supabase; a Vercel deployment does not run database migrations.

## Current priority

Apply the database migrations first, then complete UI permission cleanup and the dashboard/calendar selected-year fixes.
