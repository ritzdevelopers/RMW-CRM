# MPF CRM — Architecture

## Overview

MPF CRM is a two-tier application:

```
┌──────────────────────────┐         HTTPS / JSON          ┌──────────────────────────┐
│   Next.js 15 Frontend    │  ───────────────────────────▶ │   Express + TS Backend   │
│  (Vercel)                │  ◀─────────────────────────── │   (Render)               │
│  App Router, TanStack    │      Bearer access token       │   REST /api/v1           │
│  Query, Zustand, shadcn  │      httpOnly refresh cookie   │                          │
└──────────────────────────┘                                └────────────┬─────────────┘
                                                                          │ mysql2 pool
                                                                          ▼
                                                                 ┌──────────────────┐
                                                                 │   MySQL 8        │
                                                                 └──────────────────┘
```

## Backend architecture

Modular, feature-based structure following SOLID principles:

```
backend/src/
├── server.ts              # bootstrap + graceful shutdown
├── app.ts                 # express app: security, docs, routes, error handling
├── config/env.ts          # typed, validated environment config
├── db/
│   ├── pool.ts            # mysql2 pool + query/transaction helpers
│   ├── schema.sql         # full DDL
│   ├── migrate.ts         # runs schema.sql
│   └── seed.ts            # roles, permissions, super admin, demo data
├── middleware/
│   ├── auth.ts            # JWT authentication (loads role + permissions)
│   ├── rbac.ts            # requirePermission / requireRole
│   ├── validate.ts        # Zod request validation
│   ├── error.ts           # centralized error handler + 404
│   └── rateLimit.ts       # global + auth limiters
├── modules/               # one folder per domain
│   ├── auth/              # register, login, refresh, verify, reset, change
│   ├── users/             # user management + profile
│   ├── roles/             # roles & configurable permissions
│   ├── leads/             # leads CRUD, status, assign, activities, bulk
│   ├── builders/          # builders CRUD
│   ├── dashboard/         # aggregated metrics
│   ├── notifications/     # in-app notifications
│   └── search/            # global search (Ctrl+K)
├── routes/index.ts        # mounts all module routers under /api/v1
├── docs/openapi.ts        # OpenAPI spec (served at /api/docs)
└── utils/                 # ApiError, jwt, password, tokens, mailer, pagination, audit
```

### Layering per module
`routes → controller → service → db`. Controllers stay thin (HTTP concerns); services hold business logic; the DB layer is accessed via typed helpers.

## Authentication & authorization

- **Access token**: short-lived JWT (15m) sent as `Authorization: Bearer`.
- **Refresh token**: opaque random string, SHA-256 hashed at rest, stored in `refresh_tokens`, delivered as an `httpOnly` cookie scoped to `/api/v1/auth`. Rotated on every refresh (old token revoked).
- **Passwords**: hashed with bcrypt (cost 12).
- **Email verification & password reset**: single-use, hashed, expiring tokens in `auth_tokens`.
- **RBAC**: role → permissions mapping (`role_permissions`). `super_admin` bypasses checks. Permissions are configurable at runtime via the Roles UI.
- **Data scoping**: sales executives / telecallers only see leads they own or are assigned.

## Frontend architecture

```
frontend/src/
├── app/
│   ├── (auth)/            # split-screen auth pages
│   └── (dashboard)/       # protected app shell (sidebar, topbar, command palette)
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── layout/            # sidebar, topbar, command palette, bell, user menu
│   ├── leads/ builders/   # feature components
│   └── shared/            # PageHeader, EmptyState, StatCard, PaginationBar
├── hooks/                 # TanStack Query hooks per domain
├── lib/                   # api client, auth store (zustand), constants, utils
└── types/                 # shared TypeScript types
```

- **Server state**: TanStack Query (caching, pagination via `keepPreviousData`, invalidation).
- **Client/UI state**: Zustand (auth session + UI toggles).
- **Auth flow**: `AuthBootstrap` silently refreshes on load; Axios interceptor performs single-flight refresh on 401 and redirects to `/login` on failure.
- **Design system**: Tailwind CSS variables for light/dark themes, shadcn/ui "new-york" components, Framer Motion for micro-interactions, Recharts for analytics.

## Cross-cutting concerns

| Concern            | Implementation                                             |
|--------------------|-----------------------------------------------------------|
| Validation         | Zod on the backend (and mirrored on forms)                |
| Errors             | `ApiError` + central handler → consistent JSON shape      |
| Security headers   | Helmet                                                     |
| CORS               | Allowlist via `CORS_ORIGINS`, credentials enabled         |
| Rate limiting      | `express-rate-limit` (strict on auth)                     |
| Audit logging      | `audit_logs` table, fire-and-forget writes                |
| API docs           | Swagger UI at `/api/docs`                                  |
| Performance        | Code splitting, query caching, debounced search, indexes  |

## Extensibility (future phases)
The schema and structure already accommodate: OAuth (`oauth_accounts`), Web Push/FCM (`push_subscriptions`), and additional modules (Properties, Deals, Site Visits, lead-source integrations) by adding new `modules/*` folders without touching existing ones.
