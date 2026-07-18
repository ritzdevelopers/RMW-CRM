-- Patch: My Property Fact enquiry integration
USE `RMW-CRM`;

ALTER TABLE leads
  MODIFY COLUMN source ENUM(
    'website','meta','google','referral','walk_in','manual','import','other','my_property_fact'
  ) NOT NULL DEFAULT 'manual';

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS external_source VARCHAR(32) NULL AFTER source,
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(64) NULL AFTER external_source;

-- MySQL 8.0.12+ supports IF NOT EXISTS on ADD COLUMN; fallback for older versions:
-- Run manually if the above fails: check columns first.

CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_external ON leads (external_source, external_id);
