-- Rollback Script for Platform Migration
-- WARNING: This script will revert all platform-related changes
-- USE WITH EXTREME CAUTION - ONLY IN EMERGENCY SITUATIONS
-- 
-- This script will:
-- 1. Restore purchase-related tables from backups (if available)
-- 2. Remove platform-related columns from existing tables
-- 3. Drop platform-related tables
-- 4. Restore original database structure
--
-- Prerequisites:
-- - Full database backup taken before migration
-- - Backup tables created during cleanup (stock_purchases_backup, etc.)

DO $$
DECLARE
  rollback_start_time TIMESTAMP;
  rollback_end_time TIMESTAMP;
  backup_tables_exist BOOLEAN := false;
BEGIN
  rollback_start_time := CURRENT_TIMESTAMP;
  RAISE NOTICE '⚠️  STARTING EMERGENCY ROLLBACK PROCEDURE';
  RAISE NOTICE '🕐 Rollback started at: %', rollback_start_time;
  RAISE NOTICE '⚠️  WARNING: This will revert all platform-related changes!';
  
  -- Step 1: Check if backup tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'stock_purchases_backup'
  ) INTO backup_tables_exist;
  
  IF backup_tables_exist THEN
    RAISE NOTICE '✅ Backup tables found - proceeding with restoration';
  ELSE
    RAISE NOTICE '⚠️  No backup tables found - will only remove new structures';
  END IF;
  
  -- Step 2: Begin transaction for safety
  BEGIN
    -- Step 3: Remove platform-related foreign key constraints
    RAISE NOTICE '🔗 Removing platform-related foreign key constraints...';
    
    -- Remove platform_id constraints from digital_products
    ALTER TABLE digital_products DROP CONSTRAINT IF EXISTS digital_products_platform_id_fkey;
    
    -- Remove platform_id constraints from stock_sales
    ALTER TABLE stock_sales DROP CONSTRAINT IF EXISTS stock_sales_platform_id_fkey;
    
    -- Remove platform_credit_movements constraints
    ALTER TABLE platform_credit_movements DROP CONSTRAINT IF EXISTS platform_credit_movements_platform_id_fkey;
    
    RAISE NOTICE '✅ Foreign key constraints removed';
    
    -- Step 4: Remove platform-related columns from digital_products
    RAISE NOTICE '🗑️  Removing platform columns from digital_products...';
    
    ALTER TABLE digital_products DROP COLUMN IF EXISTS platform_id;
    ALTER TABLE digital_products DROP COLUMN IF EXISTS platform_buying_price;
    ALTER TABLE digital_products DROP COLUMN IF EXISTS profit_margin;
    
    -- Restore average_purchase_price column if it was removed
    ALTER TABLE digital_products ADD COLUMN IF NOT EXISTS average_purchase_price DECIMAL(10,2) DEFAULT 0;
    
    RAISE NOTICE '✅ Platform columns removed from digital_products';
    
    -- Step 5: Remove platform-related columns from stock_sales
    RAISE NOTICE '🗑️  Removing platform columns from stock_sales...';
    
    ALTER TABLE stock_sales DROP COLUMN IF EXISTS platform_id;
    ALTER TABLE stock_sales DROP COLUMN IF EXISTS platform_buying_price;
    ALTER TABLE stock_sales DROP COLUMN IF EXISTS payment_type;
    ALTER TABLE stock_sales DROP COLUMN IF EXISTS subscription_duration;
    ALTER TABLE stock_sales DROP COLUMN IF EXISTS subscription_start_date;
    ALTER TABLE stock_sales DROP COLUMN IF EXISTS subscription_end_date;
    
    -- Remove subscription-related constraints
    ALTER TABLE stock_sales DROP CONSTRAINT IF EXISTS check_recurring_subscription;
    
    RAISE NOTICE '✅ Platform columns removed from stock_sales';
    
    -- Step 6: Drop platform-related tables
    RAISE NOTICE '🗑️  Dropping platform-related tables...';
    
    DROP TABLE IF EXISTS platform_credit_movements CASCADE;
    DROP TABLE IF EXISTS platforms CASCADE;
    
    RAISE NOTICE '✅ Platform tables dropped';
    
    -- Step 7: Restore stock_purchases table if backup exists
    IF backup_tables_exist THEN
      RAISE NOTICE '📦 Restoring stock_purchases table from backup...';
      
      -- Recreate stock_purchases table from backup
      CREATE TABLE stock_purchases AS 
      SELECT * FROM stock_purchases_backup;
      
      -- Remove backup timestamp column
      ALTER TABLE stock_purchases DROP COLUMN IF EXISTS backup_created_at;
      
      -- Recreate primary key and constraints
      ALTER TABLE stock_purchases ADD PRIMARY KEY (id);
      
      -- Recreate foreign key to digital_products
      ALTER TABLE stock_purchases 
      ADD CONSTRAINT stock_purchases_product_id_fkey 
      FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE CASCADE;
      
      RAISE NOTICE '✅ Stock purchases table restored';
      
      -- Restore purchase-related stock movements
      RAISE NOTICE '📦 Restoring purchase-related stock movements...';
      
      INSERT INTO stock_movements 
      SELECT * FROM stock_movements_purchases_backup;
      
      RAISE NOTICE '✅ Purchase movements restored';
      
    ELSE
      RAISE NOTICE '⚠️  No backup found - creating empty stock_purchases table';
      
      -- Create empty stock_purchases table with original structure
      CREATE TABLE stock_purchases (
        id VARCHAR(255) PRIMARY KEY,
        product_id VARCHAR(255) REFERENCES digital_products(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        supplier_name VARCHAR(255),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        purchase_date TIMESTAMP NOT NULL,
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    END IF;
    
    -- Step 8: Recreate original indexes
    RAISE NOTICE '🔧 Recreating original indexes...';
    
    -- Digital products indexes (remove platform-related ones)
    DROP INDEX IF EXISTS idx_products_platform;
    DROP INDEX IF EXISTS idx_products_platform_active;
    
    -- Stock sales indexes (remove platform-related ones)
    DROP INDEX IF EXISTS idx_sales_platform;
    DROP INDEX IF EXISTS idx_sales_payment_type;
    DROP INDEX IF EXISTS idx_sales_subscription_dates;
    DROP INDEX IF EXISTS idx_sales_platform_date;
    
    -- Recreate stock_purchases indexes
    CREATE INDEX IF NOT EXISTS idx_stock_purchases_date ON stock_purchases(purchase_date);
    CREATE INDEX IF NOT EXISTS idx_stock_purchases_product ON stock_purchases(product_id);
    
    RAISE NOTICE '✅ Indexes recreated';
    
    -- Step 9: Update application settings
    RAISE NOTICE '⚙️  Updating application settings...';
    
    UPDATE app_settings 
    SET settings = jsonb_build_object(
      'features', jsonb_build_object(
        'purchases_enabled', true,
        'platform_management_enabled', false,
        'credit_management_enabled', false
      ),
      'rollback', jsonb_build_object(
        'rollback_completed', true,
        'rollback_date', CURRENT_TIMESTAMP,
        'rollback_reason', 'Emergency rollback procedure'
      )
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = 'main';
    
    RAISE NOTICE '✅ Application settings updated';
    
    -- Step 10: Clean up migration tracking
    RAISE NOTICE '🧹 Cleaning up migration tracking...';
    
    DELETE FROM schema_migrations 
    WHERE version IN (
      '001_create_platforms_table',
      '002_create_credit_movements_table', 
      '003_modify_digital_products_table',
      '004_update_sales_table',
      '005_migrate_existing_data',
      '006_cleanup_purchase_data'
    );
    
    RAISE NOTICE '✅ Migration tracking cleaned up';
    
    rollback_end_time := CURRENT_TIMESTAMP;
    
    -- Step 11: Final rollback summary
    RAISE NOTICE '🎯 ROLLBACK COMPLETED SUCCESSFULLY';
    RAISE NOTICE '🕐 Rollback ended at: %', rollback_end_time;
    RAISE NOTICE '⏱️  Total rollback time: %', rollback_end_time - rollback_start_time;
    RAISE NOTICE '📊 Rollback Summary:';
    RAISE NOTICE '  ✅ Platform tables removed';
    RAISE NOTICE '  ✅ Platform columns removed from existing tables';
    RAISE NOTICE '  ✅ Original table structure restored';
    RAISE NOTICE '  ✅ Purchase functionality restored';
    RAISE NOTICE '  ✅ Application settings reverted';
    RAISE NOTICE '  ✅ Migration tracking cleaned up';
    
    IF backup_tables_exist THEN
      RAISE NOTICE '  ✅ Data restored from backup tables';
    ELSE
      RAISE NOTICE '  ⚠️  No backup data available - empty tables created';
    END IF;
    
    RAISE NOTICE '🔄 System successfully reverted to pre-migration state';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Rollback failed: %', SQLERRM;
  END;
  
  -- Step 12: Cleanup recommendations
  RAISE NOTICE '💡 Post-Rollback Recommendations:';
  RAISE NOTICE '  1. Verify application functionality';
  RAISE NOTICE '  2. Check data integrity';
  RAISE NOTICE '  3. Update application code to use original schema';
  RAISE NOTICE '  4. Consider keeping backup tables for additional safety';
  RAISE NOTICE '  5. Review rollback logs for any issues';
  
END $$;
