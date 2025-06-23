-- Migration: 002_create_credit_movements_table.sql
-- Description: Create platform credit movements table for audit trail
-- Date: 2025-06-19
-- Author: Digital Subscription Management System Refactoring
-- Dependencies: 001_create_platforms_table.sql

-- Create platform credit movements table for audit trail
CREATE TABLE IF NOT EXISTS platform_credit_movements (
  id VARCHAR(255) PRIMARY KEY,
  platform_id VARCHAR(255) NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('credit_added', 'credit_deducted', 'sale_deduction', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  previous_balance DECIMAL(10,2) NOT NULL,
  new_balance DECIMAL(10,2) NOT NULL,
  reference VARCHAR(255), -- Reference to sale ID or manual operation
  description TEXT,
  created_by VARCHAR(255), -- User who performed the operation
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_movements_platform ON platform_credit_movements(platform_id);
CREATE INDEX IF NOT EXISTS idx_credit_movements_type ON platform_credit_movements(type);
CREATE INDEX IF NOT EXISTS idx_credit_movements_date ON platform_credit_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_movements_reference ON platform_credit_movements(reference);

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 002_create_credit_movements_table.sql completed successfully';
END $$;
