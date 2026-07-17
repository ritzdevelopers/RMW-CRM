# RMW Real Estate CRM

A production-grade Real Estate CRM built for **MPF (My Property Fact)**. Enterprise experience comparable to Zoho CRM / HubSpot / Salesforce, optimized for real-estate lead-to-closing workflows.

> Current priority: **MPF**. Core modules delivered: **Leads** and **Builders**, with authentication, RBAC, dashboard, notifications, and global search. The architecture is modular and extensible for future modules (Properties, Deals, Site Visits, Lead-source integrations, Mobile).

## Tech Stack

**Frontend**
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- TanStack Query (server state) + Zustand (client state)
- React Hook Form + Zod
- Axios, Recharts, Lucide Icons, Sonner (toasts)

**Backend**
- Node.js + Express + TypeScript
- MySQL (mysql2)
- JWT (access) + Refresh Tokens (httpOnly cookie), BCrypt
- Zod validation, Helmet, CORS, rate-limiting, audit logs
- Swagger (OpenAPI) docs

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → MySQL (PlanetScale / Railway / RDS / managed MySQL)

## Monorepo Layout

```
RMW-CRM/
├── backend/         # Express + TS + MySQL API
├── frontend/        # Next.js 15 app
├── docs/            # Architecture, ER diagram, API & deployment guides
└── README.md
```

## Quick Start

Prerequisites: Node.js >= 20, MySQL >= 8.

```bash
# 1. Database
mysql -u root -p < backend/src/db/schema.sql

# 2. Backend
cd backend
cp .env.example .env       # fill in DB + JWT secrets
npm install
npm run db:seed            # creates roles, permissions & a super-admin
npm run dev                # http://localhost:5000  (Swagger at /api/docs)

# 3. Frontend
cd ../frontend
cp .env.example .env.local # point NEXT_PUBLIC_API_URL at the backend
npm install
npm run dev                # http://localhost:3000
```

Default seeded super admin (change immediately):
- Email: `admin@mypropertyfact.com`
- Password: `Admin@12345`

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system & backend architecture
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema + ER diagram
- [`docs/API.md`](docs/API.md) — REST API reference (also live at `/api/docs`)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel + Render + MySQL deploy guide

## License

Proprietary — © My Property Fact.
