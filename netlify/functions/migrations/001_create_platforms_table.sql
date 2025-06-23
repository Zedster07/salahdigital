-- Migration: 001_create_platforms_table.sql
-- Description: Create platforms table for supplier platform management
-- Date: 2025-06-19
-- Author: Digital Subscription Management System Refactoring

-- Create platforms table
CREATE TABLE IF NOT EXISTS platforms (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(255),
  credit_balance DECIMAL(10,2) DEFAULT 0 CHECK (credit_balance >= 0),
  low_balance_threshold DECIMAL(10,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platforms_name ON platforms(name);
CREATE INDEX IF NOT EXISTS idx_platforms_active ON platforms(is_active);
CREATE INDEX IF NOT EXISTS idx_platforms_credit_balance ON platforms(credit_balance);

-- Insert default platform for existing data migration
INSERT INTO platforms (id, name, description, credit_balance, low_balance_threshold, is_active, created_at, updated_at)
VALUES ('default-platform', 'Default Platform', 'Default platform for migrated products and existing data', 0, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_create_platforms_table.sql completed successfully';
END $$;
