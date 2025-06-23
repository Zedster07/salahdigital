-- Migration: 006_cleanup_purchase_data.sql
-- Description: Remove purchase-related data and tables from the old inventory model
-- Date: 2025-06-19
-- Author: Digital Subscription Management System Refactoring
-- Dependencies: 005_migrate_existing_data.sql

-- Cleanup Script for Purchase-Related Data
-- This script removes all elements related to the deprecated 'Achats' (Purchases) feature

DO $$
DECLARE
  purchase_count INTEGER;
  purchase_movement_count INTEGER;
  cleanup_start_time TIMESTAMP;
  cleanup_end_time TIMESTAMP;
BEGIN
  cleanup_start_time := CURRENT_TIMESTAMP;
  RAISE NOTICE '🧹 Starting cleanup of purchase-related data...';
  RAISE NOTICE 'Cleanup started at: %', cleanup_start_time;
  
  -- Step 1: Count existing purchase data before cleanup
  SELECT COUNT(*) INTO purchase_count FROM stock_purchases WHERE 1=1;
  
  SELECT COUNT(*) INTO purchase_movement_count 
  FROM stock_movements 
  WHERE type = 'purchase';
  
  RAISE NOTICE '📊 Pre-cleanup data counts:';
  RAISE NOTICE '  - Stock Purchases: %', purchase_count;
  RAISE NOTICE '  - Purchase Movements: %', purchase_movement_count;
  
  -- Step 2: Create backup tables (optional - for safety)
  RAISE NOTICE '💾 Creating backup tables for safety...';
  
  -- Backup stock_purchases table
  CREATE TABLE IF NOT EXISTS stock_purchases_backup AS 
  SELECT *, CURRENT_TIMESTAMP as backup_created_at 
  FROM stock_purchases;
  
  -- Backup purchase-related stock movements
  CREATE TABLE IF NOT EXISTS stock_movements_purchases_backup AS 
  SELECT *, CURRENT_TIMESTAMP as backup_created_at 
  FROM stock_movements 
  WHERE type = 'purchase';
  
  RAISE NOTICE '✅ Backup tables created';
  
  -- Step 3: Remove purchase-related stock movements
  RAISE NOTICE '🗑️  Removing purchase-related stock movements...';
  
  DELETE FROM stock_movements WHERE type = 'purchase';
  GET DIAGNOSTICS purchase_movement_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Removed % purchase-related stock movements', purchase_movement_count;
  
  -- Step 4: Remove foreign key constraints that reference stock_purchases
  RAISE NOTICE '🔗 Removing foreign key constraints...';
  
  -- Check if there are any foreign keys referencing stock_purchases
  DO $inner$
  DECLARE
    constraint_record RECORD;
  BEGIN
    FOR constraint_record IN 
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'stock_purchases'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
                     constraint_record.table_name, 
                     constraint_record.constraint_name);
      RAISE NOTICE '  - Dropped constraint % from table %', 
                   constraint_record.constraint_name, 
                   constraint_record.table_name;
    END LOOP;
  END $inner$;
  
  -- Step 5: Drop stock_purchases table
  RAISE NOTICE '🗑️  Dropping stock_purchases table...';
  
  DROP TABLE IF EXISTS stock_purchases CASCADE;
  
  RAISE NOTICE '✅ Stock purchases table dropped';
  
  -- Step 6: Remove purchase-related columns from other tables (if any)
  RAISE NOTICE '🔧 Checking for purchase-related columns in other tables...';
  
  -- Check if digital_products has average_purchase_price column that's no longer needed
  DO $inner$
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'digital_products' 
               AND column_name = 'average_purchase_price') THEN
      
      -- First, ensure platform_buying_price is populated from average_purchase_price
      UPDATE digital_products 
      SET platform_buying_price = COALESCE(average_purchase_price, 0)
      WHERE platform_buying_price = 0 AND average_purchase_price > 0;
      
      -- Then drop the old column
      ALTER TABLE digital_products DROP COLUMN average_purchase_price;
      RAISE NOTICE '  - Removed average_purchase_price column from digital_products';
    END IF;
  END $inner$;
  
  -- Step 7: Remove purchase-related indexes (if any exist)
  RAISE NOTICE '🔧 Removing purchase-related indexes...';
  
  DROP INDEX IF EXISTS idx_stock_purchases_date;
  DROP INDEX IF EXISTS idx_stock_purchases_product;
  DROP INDEX IF EXISTS idx_stock_purchases_supplier;
  DROP INDEX IF EXISTS idx_stock_movements_purchase;
  
  RAISE NOTICE '✅ Purchase-related indexes removed';
  
  -- Step 8: Clean up any purchase-related sequences
  RAISE NOTICE '🔧 Cleaning up purchase-related sequences...';
  
  DROP SEQUENCE IF EXISTS stock_purchases_id_seq CASCADE;
  
  -- Step 9: Verify cleanup completion
  RAISE NOTICE '🔍 Verifying cleanup completion...';
  
  -- Check if stock_purchases table still exists
  DECLARE
    table_exists INTEGER;
    remaining_purchase_movements INTEGER;
  BEGIN
    SELECT COUNT(*) INTO table_exists
    FROM information_schema.tables 
    WHERE table_name = 'stock_purchases' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO remaining_purchase_movements
    FROM stock_movements 
    WHERE type = 'purchase';
    
    IF table_exists > 0 THEN
      RAISE WARNING 'stock_purchases table still exists after cleanup';
    END IF;
    
    IF remaining_purchase_movements > 0 THEN
      RAISE WARNING '% purchase-related movements still exist', remaining_purchase_movements;
    END IF;
    
    RAISE NOTICE '  - Stock purchases table exists: %', CASE WHEN table_exists > 0 THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE '  - Remaining purchase movements: %', remaining_purchase_movements;
  END;
  
  -- Step 10: Update application settings to reflect the change
  RAISE NOTICE '⚙️  Updating application settings...';
  
  -- Update app settings to indicate purchase feature is disabled
  INSERT INTO app_settings (id, settings, updated_at)
  VALUES ('main', jsonb_build_object(
    'features', jsonb_build_object(
      'purchases_enabled', false,
      'platform_management_enabled', true,
      'credit_management_enabled', true
    ),
    'migration', jsonb_build_object(
      'purchase_cleanup_completed', true,
      'purchase_cleanup_date', CURRENT_TIMESTAMP,
      'platform_migration_completed', true
    )
  ), CURRENT_TIMESTAMP)
  ON CONFLICT (id) 
  DO UPDATE SET 
    settings = app_settings.settings || EXCLUDED.settings,
    updated_at = CURRENT_TIMESTAMP;
  
  cleanup_end_time := CURRENT_TIMESTAMP;
  
  -- Step 11: Final cleanup summary
  RAISE NOTICE '🎉 Purchase data cleanup completed successfully!';
  RAISE NOTICE 'Cleanup ended at: %', cleanup_end_time;
  RAISE NOTICE 'Total cleanup time: %', cleanup_end_time - cleanup_start_time;
  RAISE NOTICE '📊 Cleanup Summary:';
  RAISE NOTICE '  - Removed % stock purchases', purchase_count;
  RAISE NOTICE '  - Removed % purchase movements', purchase_movement_count;
  RAISE NOTICE '  - Dropped stock_purchases table';
  RAISE NOTICE '  - Removed purchase-related indexes and constraints';
  RAISE NOTICE '  - Updated application settings';
  RAISE NOTICE '  - Backup tables created for safety';
  RAISE NOTICE '🔄 System successfully transitioned to platform-based model';
  
  -- Step 12: Provide rollback information
  RAISE NOTICE '💡 Rollback Information:';
  RAISE NOTICE '  - Backup tables: stock_purchases_backup, stock_movements_purchases_backup';
  RAISE NOTICE '  - To rollback: Restore from backup tables and recreate constraints';
  RAISE NOTICE '  - Backup retention: Consider removing backup tables after 30 days';
  
END $$;
