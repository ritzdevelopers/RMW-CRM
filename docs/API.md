# MPF CRM — REST API Reference

Base URL: `{{BACKEND_URL}}/api/v1`
Interactive docs (Swagger UI): `{{BACKEND_URL}}/api/docs`

## Conventions

- **Auth**: send the access token as `Authorization: Bearer <token>`.
- **Refresh**: the refresh token is an `httpOnly` cookie; call `POST /auth/refresh` (with credentials) to rotate it.
- **Success shape**: `{ "success": true, "data": ... }`
- **Error shape**: `{ "success": false, "error": { "code", "message", "details?" } }`
- **Pagination**: list endpoints accept `page`, `pageSize` and return `{ data, pagination: { page, pageSize, total, totalPages } }`.

## Auth

| Method | Endpoint                    | Auth | Description                                  |
|--------|-----------------------------|------|----------------------------------------------|
| POST   | `/auth/register`            | –    | Create account (default role sales_executive)|
| POST   | `/auth/login`               | –    | Email + password → access token + cookie     |
| POST   | `/auth/refresh`             | cookie | Rotate refresh token → new access token    |
| POST   | `/auth/logout`              | cookie | Revoke refresh token                       |
| POST   | `/auth/verify-email`        | –    | Verify email with token                      |
| POST   | `/auth/forgot-password`     | –    | Request reset email                          |
| POST   | `/auth/reset-password`      | –    | Reset password with token                    |
| GET    | `/auth/me`                  | ✔    | Current user + permissions                   |
| POST   | `/auth/resend-verification` | ✔    | Resend verification email                    |
| POST   | `/auth/change-password`     | ✔    | Change password                              |
| GET    | `/auth/sessions`            | ✔    | List active sessions                         |

**Login example**
```bash
curl -X POST {{BACKEND_URL}}/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"email":"admin@mypropertyfact.com","password":"Admin@12345","rememberMe":true}'
```

## Leads

| Method | Endpoint                    | Permission     | Description                          |
|--------|-----------------------------|----------------|--------------------------------------|
| GET    | `/leads`                    | `leads.read`   | List (filters, sort, paginate)       |
| POST   | `/leads`                    | `leads.create` | Create lead                          |
| GET    | `/leads/:id`                | `leads.read`   | Lead + activity timeline             |
| PATCH  | `/leads/:id`                | `leads.update` | Update lead                          |
| DELETE | `/leads/:id`                | `leads.delete` | Delete lead                          |
| PATCH  | `/leads/:id/status`         | `leads.update` | Change status (records activity)     |
| PATCH  | `/leads/:id/assign`         | `leads.assign` | Assign to a user (notifies them)     |
| POST   | `/leads/:id/activities`     | `leads.update` | Log note/call/meeting/site_visit     |
| POST   | `/leads/bulk`               | `leads.update` | Bulk assign / status / delete        |

**List query params**: `page, pageSize, search, status, source, priority, assignedTo, builderId, sortBy, order`.

## Builders

| Method | Endpoint            | Permission        | Description              |
|--------|---------------------|-------------------|--------------------------|
| GET    | `/builders`         | `builders.read`   | List builders            |
| GET    | `/builders/options` | `builders.read`   | Lightweight dropdown list|
| POST   | `/builders`         | `builders.create` | Create builder           |
| GET    | `/builders/:id`     | `builders.read`   | Get builder + lead count |
| PATCH  | `/builders/:id`     | `builders.update` | Update builder           |
| DELETE | `/builders/:id`     | `builders.delete` | Delete builder           |

## Users & Roles

| Method | Endpoint                     | Permission     | Description                       |
|--------|------------------------------|----------------|-----------------------------------|
| GET    | `/users`                     | `users.read`   | List users                        |
| POST   | `/users`                     | `users.create` | Create user                       |
| PATCH  | `/users/:id`                 | `users.update` | Update user (role/status)         |
| DELETE | `/users/:id`                 | `users.delete` | Delete user                       |
| GET    | `/users/assignable`          | ✔              | Assignable sales users            |
| PATCH  | `/users/me/profile`          | ✔              | Update own profile                |
| GET    | `/roles`                     | `roles.read`   | Roles with counts                 |
| GET    | `/roles/options`             | ✔              | Roles for dropdowns               |
| GET    | `/roles/permissions`         | `roles.read`   | All permissions                   |
| GET    | `/roles/:id/permissions`     | `roles.read`   | A role's permissions              |
| PUT    | `/roles/:id/permissions`     | `roles.update` | Replace a role's permission set   |

## Dashboard / Notifications / Search

| Method | Endpoint                        | Description                              |
|--------|---------------------------------|------------------------------------------|
| GET    | `/dashboard/overview`           | Stats, funnel, sources, trend            |
| GET    | `/dashboard/team`               | Team performance leaderboard             |
| GET    | `/dashboard/tasks`              | Today's follow-ups                       |
| GET    | `/dashboard/activities`         | Recent activity feed                     |
| GET    | `/notifications`                | List (`?unread=true` filter)             |
| GET    | `/notifications/unread-count`   | Unread badge count                       |
| PATCH  | `/notifications/:id/read`       | Mark one read                            |
| PATCH  | `/notifications/read-all`       | Mark all read                            |
| GET    | `/search?q=`                    | Global search (leads, builders, users)   |

## Health
`GET /health` → `{ status, db, ts }` (used by Render health checks).
