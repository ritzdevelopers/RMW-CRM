-- ============================================================
--  MPF CRM — MySQL Schema
--  Engine: InnoDB, Charset: utf8mb4
-- ============================================================
CREATE DATABASE IF NOT EXISTS `RMW-CRM`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `RMW-CRM`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
--  Roles & Permissions (RBAC)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(50)  NOT NULL UNIQUE,          -- machine key e.g. super_admin
  display_name  VARCHAR(100) NOT NULL,
  description   VARCHAR(255) NULL,
  is_system     TINYINT(1)   NOT NULL DEFAULT 0,       -- system roles cannot be deleted
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,          -- e.g. leads.create
  module        VARCHAR(50)  NOT NULL,                 -- e.g. leads
  description   VARCHAR(255) NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(120) NOT NULL,
  email               VARCHAR(191) NOT NULL UNIQUE,
  phone               VARCHAR(20)  NULL,
  password_hash       VARCHAR(255) NULL,                -- null for pure-OAuth accounts
  avatar_url          VARCHAR(500) NULL,
  role_id             INT UNSIGNED NOT NULL,
  status              ENUM('active','invited','suspended') NOT NULL DEFAULT 'active',
  email_verified_at   TIMESTAMP    NULL,
  last_login_at       TIMESTAMP    NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_users_role (role_id),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- OAuth identities (Google / Facebook / Microsoft)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  provider      ENUM('google','facebook','microsoft') NOT NULL,
  provider_uid  VARCHAR(191) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_uid (provider, provider_uid),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Auth tokens
-- ------------------------------------------------------------
-- Hashed refresh tokens (rotation + revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL,                       -- sha256 hex
  user_agent    VARCHAR(255) NULL,
  ip_address    VARCHAR(45)  NULL,
  expires_at    TIMESTAMP NOT NULL,
  revoked_at    TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_token_hash (token_hash),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_user (user_id)
) ENGINE=InnoDB;

-- Single-use tokens for email verification & password reset
CREATE TABLE IF NOT EXISTS auth_tokens (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  type          ENUM('email_verify','password_reset') NOT NULL,
  token_hash    CHAR(64) NOT NULL,
  expires_at    TIMESTAMP NOT NULL,
  used_at       TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_auth_token_hash (token_hash),
  CONSTRAINT fk_at_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_at_user_type (user_id, type)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Builders (developer / promoter companies)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builders (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(160) NOT NULL,
  legal_name        VARCHAR(200) NULL,
  logo_url          VARCHAR(500) NULL,
  email             VARCHAR(191) NULL,
  phone             VARCHAR(20)  NULL,
  website           VARCHAR(255) NULL,
  rera_number       VARCHAR(80)  NULL,
  city              VARCHAR(80)  NULL,
  state             VARCHAR(80)  NULL,
  address           VARCHAR(400) NULL,
  contact_person    VARCHAR(120) NULL,
  status            ENUM('active','inactive','blacklisted') NOT NULL DEFAULT 'active',
  tier              ENUM('a','b','c') NOT NULL DEFAULT 'b',   -- partnership tier
  projects_count    INT UNSIGNED NOT NULL DEFAULT 0,
  notes             TEXT NULL,
  created_by        BIGINT UNSIGNED NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_builder_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_builder_status (status),
  INDEX idx_builder_city (city),
  FULLTEXT KEY ft_builder (name, legal_name, city, contact_person)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Leads
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(160) NOT NULL,
  email             VARCHAR(191) NULL,
  phone             VARCHAR(20)  NOT NULL,
  alt_phone         VARCHAR(20)  NULL,
  source            ENUM('website','meta','google','referral','walk_in','manual','import','other')
                      NOT NULL DEFAULT 'manual',
  campaign          VARCHAR(160) NULL,
  status            ENUM('new','contacted','qualified','site_visit','negotiation','booked','lost')
                      NOT NULL DEFAULT 'new',
  score             TINYINT UNSIGNED NOT NULL DEFAULT 0,       -- 0-100
  priority          ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  budget_min        DECIMAL(14,2) NULL,
  budget_max        DECIMAL(14,2) NULL,
  property_type     VARCHAR(80)  NULL,                          -- e.g. 2BHK, Plot, Villa
  location_pref     VARCHAR(160) NULL,
  city              VARCHAR(80)  NULL,
  builder_id        BIGINT UNSIGNED NULL,                       -- interested project's builder
  assigned_to       BIGINT UNSIGNED NULL,                       -- sales user
  owner_id          BIGINT UNSIGNED NULL,                       -- who created / owns
  expected_value    DECIMAL(14,2) NULL,
  next_follow_up_at TIMESTAMP NULL,
  last_contacted_at TIMESTAMP NULL,
  lost_reason       VARCHAR(255) NULL,
  notes             TEXT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lead_builder  FOREIGN KEY (builder_id)  REFERENCES builders(id) ON DELETE SET NULL,
  CONSTRAINT fk_lead_assignee FOREIGN KEY (assigned_to) REFERENCES users(id)   ON DELETE SET NULL,
  CONSTRAINT fk_lead_owner    FOREIGN KEY (owner_id)    REFERENCES users(id)   ON DELETE SET NULL,
  INDEX idx_lead_status (status),
  INDEX idx_lead_source (source),
  INDEX idx_lead_assigned (assigned_to),
  INDEX idx_lead_followup (next_follow_up_at),
  INDEX idx_lead_phone (phone),
  FULLTEXT KEY ft_lead (name, email, phone, location_pref, city)
) ENGINE=InnoDB;

-- Activity timeline for leads
CREATE TABLE IF NOT EXISTS lead_activities (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id       BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NULL,
  type          ENUM('note','call','email','sms','whatsapp','meeting','site_visit',
                     'status_change','assignment','created','follow_up') NOT NULL,
  title         VARCHAR(200) NULL,
  body          TEXT NULL,
  meta_json     JSON NULL,                                   -- structured details (from/to status etc.)
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_la_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_la_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_la_lead (lead_id, created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Notifications (in-app)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  type          VARCHAR(60) NOT NULL,                        -- lead_assigned, follow_up, system, etc.
  priority      ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  title         VARCHAR(200) NOT NULL,
  body          VARCHAR(500) NULL,
  link          VARCHAR(300) NULL,                            -- deep link in app
  read_at       TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id, read_at, created_at)
) ENGINE=InnoDB;

-- Web push subscriptions (FCM tokens) — future phase
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  fcm_token     VARCHAR(500) NOT NULL,
  device_info   VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fcm_token (fcm_token),
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Audit logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id      BIGINT UNSIGNED NULL,
  action        VARCHAR(80)  NOT NULL,                        -- e.g. lead.update
  entity_type   VARCHAR(50)  NOT NULL,                        -- e.g. lead
  entity_id     VARCHAR(60)  NULL,
  ip_address    VARCHAR(45)  NULL,
  meta_json     JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_actor (actor_id, created_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
