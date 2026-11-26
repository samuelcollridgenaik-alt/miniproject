# Production readiness

Do not expose the current demonstration backend as a multi-user application.
It trusts client-provided user IDs, has demo authentication and stores data in
local files (on Vercel these are ephemeral). These must be replaced with verified
sessions, authorization on every data route and durable isolated storage before
enabling real accounts or an administrator dashboard.

Remote generation currently has a 24,000-character prompt guard and a maximum
of 2,048 output tokens per request. These are per-request limits, not a daily
token or spending cap. They do not cover embeddings, failed requests, provider
thinking tokens, or concurrency; they cannot reserve a shared token balance.
Enforce the actual budget with an atomic durable ledger and provider-side spend
limits. Do not treat in-memory execution logs as an authoritative usage ledger.

Production social login also requires OAuth provider configuration, callback
URLs and secrets; the administrator must be identified by a verified account.
Never store provider credentials in the repository or expose them to clients.
