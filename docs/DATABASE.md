# MPF CRM — Database Schema & ER Diagram

MySQL 8, InnoDB, `utf8mb4`. Full DDL: [`backend/src/db/schema.sql`](../backend/src/db/schema.sql).

## ER Diagram

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    ROLES ||--o{ ROLE_PERMISSIONS : has
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : in
    USERS ||--o{ OAUTH_ACCOUNTS : links
    USERS ||--o{ REFRESH_TOKENS : owns
    USERS ||--o{ AUTH_TOKENS : owns
    USERS ||--o{ PUSH_SUBSCRIPTIONS : owns
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ LEADS : "assigned / owns"
    USERS ||--o{ BUILDERS : "created by"
    USERS ||--o{ LEAD_ACTIVITIES : logs
    USERS ||--o{ AUDIT_LOGS : performs
    BUILDERS ||--o{ LEADS : "interested in"
    LEADS ||--o{ LEAD_ACTIVITIES : has

    ROLES {
        int id PK
        varchar name UK
        varchar display_name
        tinyint is_system
    }
    PERMISSIONS {
        int id PK
        varchar name UK
        varchar module
    }
    ROLE_PERMISSIONS {
        int role_id PK,FK
        int permission_id PK,FK
    }
    USERS {
        bigint id PK
        varchar name
        varchar email UK
        varchar password_hash
        int role_id FK
        enum status
        timestamp email_verified_at
    }
    REFRESH_TOKENS {
        bigint id PK
        bigint user_id FK
        char token_hash UK
        timestamp expires_at
        timestamp revoked_at
    }
    AUTH_TOKENS {
        bigint id PK
        bigint user_id FK
        enum type
        char token_hash UK
        timestamp expires_at
        timestamp used_at
    }
    BUILDERS {
        bigint id PK
        varchar name
        varchar rera_number
        enum status
        enum tier
        int projects_count
        bigint created_by FK
    }
    LEADS {
        bigint id PK
        varchar name
        varchar phone
        varchar email
        enum source
        enum status
        tinyint score
        enum priority
        decimal expected_value
        bigint builder_id FK
        bigint assigned_to FK
        bigint owner_id FK
        timestamp next_follow_up_at
    }
    LEAD_ACTIVITIES {
        bigint id PK
        bigint lead_id FK
        bigint user_id FK
        enum type
        json meta_json
    }
    NOTIFICATIONS {
        bigint id PK
        bigint user_id FK
        varchar type
        enum priority
        timestamp read_at
    }
    AUDIT_LOGS {
        bigint id PK
        bigint actor_id FK
        varchar action
        varchar entity_type
    }
```

## Tables

| Table                | Purpose                                                        |
|----------------------|---------------------------------------------------------------|
| `roles`              | RBAC roles (super_admin … customer_support)                   |
| `permissions`        | Granular permissions (`leads.create`, `builders.read`, …)     |
| `role_permissions`   | Many-to-many role ↔ permission (configurable at runtime)      |
| `users`              | Team members, linked to a role                                |
| `oauth_accounts`     | Linked Google/Facebook/Microsoft identities (future)         |
| `refresh_tokens`     | Hashed, rotating refresh tokens for sessions                  |
| `auth_tokens`        | Single-use email-verify & password-reset tokens              |
| `builders`           | Developer/promoter partners, with tier + RERA + projects      |
| `leads`              | Core lead records with pipeline status, score, assignment     |
| `lead_activities`    | Per-lead timeline (notes, calls, status changes, assignments) |
| `notifications`      | In-app notification center items                              |
| `push_subscriptions` | FCM web-push tokens (future)                                  |
| `audit_logs`         | Immutable audit trail of key actions                          |

## Key indexes
- `leads`: `status`, `source`, `assigned_to`, `next_follow_up_at`, `phone`, plus a FULLTEXT index on `(name,email,phone,location_pref,city)`.
- `builders`: `status`, `city`, FULLTEXT on `(name,legal_name,city,contact_person)`.
- `notifications`: `(user_id, read_at, created_at)` for fast unread queries.

## Lead pipeline stages
`new → contacted → qualified → site_visit → negotiation → booked` (with `lost` as a terminal branch), matching the SRS.

## Setup
```bash
mysql -u root -p < backend/src/db/schema.sql   # or: npm run db:migrate
npm run db:seed                                 # roles, permissions, admin, demo data
```
