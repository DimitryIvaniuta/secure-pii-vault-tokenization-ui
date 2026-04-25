# secure-pii-vault-tokenization-ui

Production-grade standalone React 19.2 + TypeScript banking-style control console for the Secure PII Vault backend.

## Repository suggestion

- **Repository name:** `secure-pii-vault-tokenization-ui`
- **Description:** `React 19.2 banking-style control console for the Secure PII Vault backend with role-aware navigation, session hardening, secure in-memory credentials, audited flows, and Playwright e2e coverage.`

## What is included

- professional banking-style layout with **header, sidebar, footer, and central workspace**
- role-aware navigation for:
  - vault create / resolve / GDPR delete
  - downstream customer token-only flows
  - audit events and audit verification
  - crypto operations and token re-wrap
- same-origin API model with **Vite dev proxy** to avoid browser CORS issues during local development
- stronger frontend hardening:
  - credentials stored **in memory only**
  - idle-session timeout with visible countdown and automatic logout
  - masked PII by default with **automatic remasking** after the reveal window
  - break-glass justification enforced in the UI before emergency resolve requests are sent
  - request timeout + correlation header per request
  - no raw HTML injection
  - validated environment configuration at startup
- hardened static delivery:
  - strict **CSP** and defensive browser headers in nginx
  - `Cache-Control: no-store` for SPA entry responses
  - immutable caching for hashed asset bundles
- essential **Playwright e2e tests** with network mocking for stable UI verification

## Stack

- React 19.2
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form + Zod
- Playwright

## Run locally

```bash
npm ci
npm run dev
```

By default, local browser calls use relative `/api` and `/actuator` paths.
Vite proxies them to `http://127.0.0.1:8080` during development.

## Environment

```bash
VITE_API_BASE_URL=
VITE_REQUEST_TIMEOUT_MS=15000
VITE_SESSION_IDLE_TIMEOUT_MS=900000
VITE_SESSION_WARNING_MS=60000
VITE_PII_REVEAL_WINDOW_MS=30000
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8080
```

## Build

```bash
npm run build
```

## E2E tests

```bash
npm run e2e
```

The included Playwright tests mock backend API responses, so they validate the UI flows without needing the backend to be running. This repository is frontend-only and contains no Java sources.

## Production deployment note

For browser security and simpler operations, deploy the frontend with the backend behind the **same origin** or behind a reverse proxy that serves the SPA and forwards `/api` and `/actuator` to Spring Boot.
