# 🗄️ Database Migration Guide

## Overview
This guide provides detailed SQL scripts and procedures for migrating your digital subscription management system to the new platform-based model.

## Migration Scripts

### 1. Create Platforms Table
```sql
-- 001_create_platforms_table.sql
CREATE TABLE platforms (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(255),
  credit_balance DECIMAL(10,2) DEFAULT 0 CHECK (credit_balance >= 0),
  low_balance_threshold DECIMAL(10,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_platforms_name ON platforms(name);
CREATE INDEX idx_platforms_active ON platforms(is_active);
CREATE INDEX idx_platforms_credit_balance ON platforms(credit_balance);

-- Insert default platform for existing data
INSERT INTO platforms (id, name, description, credit_balance, created_at, updated_at)
VALUES ('default-platform', 'Default Platform', 'Default platform for migrated products', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

### 2. Create Platform Credit Movements Table
```sql
-- 002_create_credit_movements_table.sql
CREATE TABLE platform_credit_movements (
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

-- Create indexes
CREATE INDEX idx_credit_movements_platform ON platform_credit_movements(platform_id);
CREATE INDEX idx_credit_movements_type ON platform_credit_movements(type);
CREATE INDEX idx_credit_movements_date ON platform_credit_movements(created_at);
CREATE INDEX idx_credit_movements_reference ON platform_credit_movements(reference);
```

### 3. Modify Digital Products Table
```sql
-- 003_modify_products_table.sql
-- Add platform association to products
ALTER TABLE digital_products 
ADD COLUMN platform_id VARCHAR(255) REFERENCES platforms(id) ON DELETE SET NULL,
ADD COLUMN platform_buying_price DECIMAL(10,2) DEFAULT 0 CHECK (platform_buying_price >= 0);

-- Update existing products to use default platform
UPDATE digital_products 
SET platform_id = 'default-platform', 
    platform_buying_price = COALESCE(average_purchase_price, 0),
    updated_at = CURRENT_TIMESTAMP
WHERE platform_id IS NULL;

-- Create index for platform association
CREATE INDEX idx_products_platform ON digital_products(platform_id);
```

### 4. Modify Stock Sales Table
```sql
-- 004_modify_sales_table.sql
-- Add platform and subscription fields to sales
ALTER TABLE stock_sales 
ADD COLUMN platform_id VARCHAR(255) REFERENCES platforms(id) ON DELETE SET NULL,
ADD COLUMN platform_buying_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN payment_type VARCHAR(50) DEFAULT 'one-time' CHECK (payment_type IN ('one-time', 'recurring')),
ADD COLUMN subscription_duration INTEGER CHECK (subscription_duration > 0),
ADD COLUMN subscription_start_date TIMESTAMP,
ADD COLUMN subscription_end_date TIMESTAMP;

-- Update existing sales with platform information
UPDATE stock_sales 
SET platform_id = (
  SELECT platform_id 
  FROM digital_products 
  WHERE digital_products.id = stock_sales.product_id
),
platform_buying_price = (
  SELECT platform_buying_price 
  FROM digital_products 
  WHERE digital_products.id = stock_sales.product_id
),
payment_type = 'one-time'
WHERE platform_id IS NULL;

-- Recalculate profit based on new buying prices
UPDATE stock_sales 
SET profit = total_price - (platform_buying_price * quantity)
WHERE platform_buying_price > 0;

-- Create indexes
CREATE INDEX idx_sales_platform ON stock_sales(platform_id);
CREATE INDEX idx_sales_payment_type ON stock_sales(payment_type);
CREATE INDEX idx_sales_subscription_dates ON stock_sales(subscription_start_date, subscription_end_date);
```

### 5. Data Migration and Validation
```sql
-- 005_migrate_existing_data.sql
-- Validate data integrity after migration
DO $$
DECLARE
  product_count INTEGER;
  sales_count INTEGER;
  orphaned_products INTEGER;
  orphaned_sales INTEGER;
BEGIN
  -- Count products and sales
  SELECT COUNT(*) INTO product_count FROM digital_products;
  SELECT COUNT(*) INTO sales_count FROM stock_sales;
  
  -- Check for orphaned records
  SELECT COUNT(*) INTO orphaned_products 
  FROM digital_products 
  WHERE platform_id IS NULL;
  
  SELECT COUNT(*) INTO orphaned_sales 
  FROM stock_sales 
  WHERE platform_id IS NULL;
  
  -- Log migration results
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE 'Products migrated: %', product_count;
  RAISE NOTICE 'Sales migrated: %', sales_count;
  RAISE NOTICE 'Orphaned products: %', orphaned_products;
  RAISE NOTICE 'Orphaned sales: %', orphaned_sales;
  
  -- Fail if there are orphaned records
  IF orphaned_products > 0 OR orphaned_sales > 0 THEN
    RAISE EXCEPTION 'Migration failed: Found orphaned records';
  END IF;
END $$;
```

### 6. Remove Purchase-Related Data
```sql
-- 006_cleanup_purchase_data.sql
-- Remove stock movements related to purchases
DELETE FROM stock_movements WHERE type = 'purchase';

-- Drop stock purchases table
DROP TABLE IF EXISTS stock_purchases CASCADE;

-- Remove purchase-related columns if they exist
-- (Check if these columns exist before dropping)
DO $$
BEGIN
  -- Remove average_purchase_price if no longer needed
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'digital_products' 
             AND column_name = 'average_purchase_price') THEN
    ALTER TABLE digital_products DROP COLUMN average_purchase_price;
  END IF;
END $$;
```

## Migration Execution Plan

### Pre-Migration Checklist
- [ ] Complete database backup
- [ ] Verify backup integrity
- [ ] Test migration scripts on copy of production data
- [ ] Prepare rollback scripts
- [ ] Schedule maintenance window
- [ ] Notify users of planned downtime

### Migration Steps
1. **Enable maintenance mode**
2. **Execute migration scripts in order:**
   ```bash
   psql -d your_database -f 001_create_platforms_table.sql
   psql -d your_database -f 002_create_credit_movements_table.sql
   psql -d your_database -f 003_modify_products_table.sql
   psql -d your_database -f 004_modify_sales_table.sql
   psql -d your_database -f 005_migrate_existing_data.sql
   psql -d your_database -f 006_cleanup_purchase_data.sql
   ```
3. **Validate data integrity**
4. **Update application configuration**
5. **Deploy new application code**
6. **Disable maintenance mode**
7. **Monitor system performance**

### Post-Migration Validation
```sql
-- Validation queries to run after migration
-- 1. Verify all products have platform associations
SELECT COUNT(*) as products_without_platform 
FROM digital_products 
WHERE platform_id IS NULL;

-- 2. Verify all sales have platform associations
SELECT COUNT(*) as sales_without_platform 
FROM stock_sales 
WHERE platform_id IS NULL;

-- 3. Check profit calculations
SELECT id, total_price, platform_buying_price, quantity, profit,
       (total_price - (platform_buying_price * quantity)) as calculated_profit
FROM stock_sales 
WHERE ABS(profit - (total_price - (platform_buying_price * quantity))) > 0.01;

-- 4. Verify platform exists
SELECT COUNT(*) as platform_count FROM platforms;
```

## Rollback Procedures

### Emergency Rollback Script
```sql
-- rollback.sql - Use only in emergency
BEGIN;

-- Restore from backup (this is the safest option)
-- pg_restore -d your_database your_backup_file.dump

-- Alternative: Manual rollback (risky)
-- Remove new columns
ALTER TABLE digital_products DROP COLUMN IF EXISTS platform_id;
ALTER TABLE digital_products DROP COLUMN IF EXISTS platform_buying_price;

ALTER TABLE stock_sales DROP COLUMN IF EXISTS platform_id;
ALTER TABLE stock_sales DROP COLUMN IF EXISTS platform_buying_price;
ALTER TABLE stock_sales DROP COLUMN IF EXISTS payment_type;
ALTER TABLE stock_sales DROP COLUMN IF EXISTS subscription_duration;
ALTER TABLE stock_sales DROP COLUMN IF EXISTS subscription_start_date;
ALTER TABLE stock_sales DROP COLUMN IF EXISTS subscription_end_date;

-- Drop new tables
DROP TABLE IF EXISTS platform_credit_movements;
DROP TABLE IF EXISTS platforms;

COMMIT;
```

## Performance Considerations

### Indexing Strategy
- Platform lookups: `idx_products_platform`, `idx_sales_platform`
- Credit movements: `idx_credit_movements_platform`, `idx_credit_movements_date`
- Subscription tracking: `idx_sales_subscription_dates`

### Query Optimization
- Use prepared statements for frequent operations
- Implement connection pooling
- Monitor query performance with EXPLAIN ANALYZE
- Consider partitioning for large credit movement tables

## Security Considerations

### Data Protection
- Encrypt sensitive platform contact information
- Implement audit logging for credit operations
- Use database roles and permissions
- Regular security updates and patches

### Access Control
- Restrict direct database access
- Use application-level authentication
- Implement role-based permissions
- Log all administrative operations

---

**⚠️ Important:** Always test these scripts on a copy of your production database before applying to production. Ensure you have a complete backup and tested rollback procedure before proceeding.
