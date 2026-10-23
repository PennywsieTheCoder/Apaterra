# Production monitoring

Apa Terra uses Sentry for application errors and a small Supabase table for privacy-safe storefront events. Neither integration records customer names, email addresses, phone numbers, delivery addresses, passwords, order notes, form values, or session replays.

## 1. Error reporting

**Roadmap status: deferred for a future release.** The integration is already in place but remains completely inactive until a Sentry DSN is configured. Skipping it does not affect the storefront, checkout, admin tools, or Supabase analytics.

Create a Sentry React project, then add this GitHub Actions repository secret:

- `VITE_SENTRY_DSN`: the project DSN supplied by Sentry.

Error reporting only runs in production builds when this value exists.

## 2. Storefront analytics

Run [`supabase/analytics_events.sql`](supabase/analytics_events.sql) in the Supabase SQL Editor. Then add this GitHub Actions repository variable:

- `VITE_ENABLE_ANALYTICS`: `true`

Events are disabled during local development. The database permits inserts but only administrators can read the collected events.

Tracked events are product views, add-to-cart actions, Favorites changes, checkout starts, failed checkouts, and completed orders.
