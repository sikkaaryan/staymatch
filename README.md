# StayMatch — free-first Airbnb discovery scaffold

StayMatch is a strict-filter stay finder prototype. This version adds an automated *candidate discovery* adapter using a configured web-search API. It does **not** scrape or crawl Airbnb, and it does not claim that search snippets prove listing details.

## What is included

- Search query builder using location, dates, guest count, budget, and mandatory requirements.
- Brave Search API adapter (optional; no paid requests are required while usage remains inside the monthly free credit).
- Airbnb listing URL allowlist and deduplication.
- Every discovered candidate is created with unknown availability and unknown requirement evidence.
- Tests for URL validation, query construction, deduplication, and the no-false-verification rule.
- The original strict verifier and ranking modules remain in place.

## Important free-plan caveat

Brave currently advertises $5 of monthly Search API credit, equivalent to around 1,000 Search requests at its listed rate. Signup requires an API key and may require a payment card for identity verification; set usage limits and disable auto-reload if you choose to use it. If you do not want to provide a card or create another account, this adapter cannot run until a different permitted free search source is configured.

The adapter only searches the web index. It does **not** fetch Airbnb listing pages, bypass access controls, or use undocumented Airbnb endpoints. Airbnb's terms prohibit bots, crawlers, scrapers, and other automated means of accessing or collecting data from its platform. Search results may be incomplete and may be stale.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm test
```

To run discovery, set a Brave Search API key and optional search parameters:

```bash
export BRAVE_SEARCH_API_KEY="your-key"
export STAYMATCH_LOCATION="Gurugram, Delhi NCR"
export STAYMATCH_CHECKIN="2026-10-27"
export STAYMATCH_CHECKOUT="2026-10-28"
export STAYMATCH_GUESTS="2"
export STAYMATCH_MAX_TOTAL="5000"
npm run build
npm start
```

The example dates are illustrative defaults; change them for your intended stay.

## Verification status

This build intentionally does not mark anything as a confirmed match. A search result can identify a candidate URL, but it cannot verify private-jacuzzi status, console availability, exact total price, or live availability for dates. A later verification integration must use an authorized source and record source-backed evidence for every mandatory requirement. Until then, candidates remain unconfirmed and should not be presented as matches.

## Next milestone

Choose an authorized source that can verify listing details and booking availability without prohibited crawling. If no such source is available for free, StayMatch must keep the strict unknown/reject behavior rather than inventing certainty.
