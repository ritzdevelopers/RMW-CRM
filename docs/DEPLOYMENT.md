# MPF CRM — Deployment Guide

Targets: **Frontend → Vercel**, **Backend → Render**, **Database → managed MySQL**.

---

## 1. Database (MySQL)

Use any managed MySQL 8 provider (Railway, PlanetScale, AWS RDS, Aiven, etc.).

1. Create a database named `mpf_crm`.
2. Load the schema:
   ```bash
   mysql -h <host> -u <user> -p mpf_crm < backend/src/db/schema.sql
   ```
3. Note the connection details for the backend env vars.

> PlanetScale note: it doesn't support foreign keys the same way; prefer Railway/RDS/Aiven for the FK-based schema, or enable FK emulation.

---

## 2. Backend (Render)

1. Push the repo to GitHub.
2. In Render: **New → Web Service**, connect the repo.
3. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `NPM_CONFIG_PRODUCTION=false npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Environment variables (from `backend/.env.example`):
   ```
   NODE_ENV=production
   PORT=10000                     # Render sets PORT automatically; app reads it
   API_PREFIX=/api/v1
   CORS_ORIGINS=https://your-frontend.vercel.app
   DB_HOST=... DB_PORT=3306 DB_USER=... DB_PASSWORD=... DB_NAME=mpf_crm
   JWT_ACCESS_SECRET=<64+ random chars>
   JWT_REFRESH_SECRET=<64+ random chars>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   COOKIE_DOMAIN=
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=lax
   APP_URL=https://your-frontend.vercel.app
   ```
5. After first deploy, seed roles/permissions/admin via Render Shell:
   ```bash
   npm run db:seed
   ```

> **Cross-site cookies**: since the frontend (Vercel) and backend (Render) are on different domains, the refresh cookie is set with `SameSite=None; Secure` in production (handled automatically when `NODE_ENV=production`). Ensure `COOKIE_SECURE=true`.

---

## 3. Frontend (Vercel)

1. In Vercel: **Add New → Project**, import the repo.
2. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
3. Environment variable:
   ```
   NEXT_PUBLIC_API_URL=/api/v1
   API_PROXY_TARGET=https://your-backend.onrender.com
   ```
   Using `/api/v1` proxies auth through Vercel so refresh cookies are first-party (required for login to persist).
4. Deploy. Update the backend `CORS_ORIGINS` and `APP_URL` to the final Vercel URL, then redeploy the backend.

---

## 4. Post-deploy checklist

- [ ] `GET https://<backend>/health` returns `{ status: "ok", db: true }`
- [ ] Swagger loads at `https://<backend>/api/docs`
- [ ] Login works and the session persists across refresh (cookie set)
- [ ] Change the seeded super-admin password immediately
- [ ] Rotate `JWT_*` secrets to strong random values
- [ ] Configure SMTP env vars for real verification/reset emails

---

## 5. Local development

```bash
# DB
mysql -u root -p < backend/src/db/schema.sql

# Backend
cd backend && cp .env.example .env && npm install && npm run db:seed && npm run dev

# Frontend
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

Frontend: http://localhost:3000 · Backend: http://localhost:5000/api/v1 · Docs: http://localhost:5000/api/docs
