# 🔄 Database Migrations

This directory contains database migration scripts for the Digital Subscription Management System platform refactoring.

## Overview

The migration system transforms the application from a traditional inventory model to a platform-based credit management system.

## Migration Files

### 001_create_platforms_table.sql
- **Purpose**: Creates the main platforms table for supplier management
- **Dependencies**: None
- **Features**:
  - Platform identification and contact information
  - Credit balance tracking with constraints
  - Low balance threshold for alerts
  - JSONB metadata field for extensibility
  - Automatic timestamps
  - Creates default platform for data migration

### 002_create_credit_movements_table.sql
- **Purpose**: Creates audit trail table for all credit movements
- **Dependencies**: 001_create_platforms_table.sql
- **Features**:
  - Complete audit trail for credit operations
  - Foreign key relationship to platforms
  - Movement type validation
  - Balance tracking (before/after)
  - Reference linking to sales or operations
  - User attribution for accountability

### 003_modify_digital_products_table.sql
- **Purpose**: Add platform association and platform-specific pricing to digital products
- **Dependencies**: 001_create_platforms_table.sql
- **Features**:
  - Platform association via foreign key
  - Platform-specific buying prices
  - Profit margin tracking
  - Automatic association with default platform
  - Performance indexes

### 004_update_sales_table.sql
- **Purpose**: Add platform integration and subscription features to stock_sales table
- **Dependencies**: 001_create_platforms_table.sql, 003_modify_digital_products_table.sql
- **Features**:
  - Platform association for sales
  - Subscription support (payment_type, duration, dates)
  - Platform buying price tracking at sale time
  - Constraint validation for subscription consistency
  - Performance indexes

### 005_migrate_existing_data.sql
- **Purpose**: Comprehensive data migration and validation for platform-based model
- **Dependencies**: All previous migrations
- **Features**:
  - Migrates existing products to default platform
  - Associates historical sales with platforms
  - Recalculates profit based on platform prices
  - Comprehensive data validation
  - Integrity checks and error reporting

### 006_cleanup_purchase_data.sql
- **Purpose**: Remove purchase-related data and tables from the old inventory model
- **Dependencies**: 005_migrate_existing_data.sql
- **Features**:
  - Creates backup tables for safety
  - Removes stock_purchases table and related data
  - Cleans up purchase-related indexes and constraints
  - Updates application settings
  - Provides rollback information

## Migration Tools

### run-migrations.cjs
- **Purpose**: Automatic migration runner that executes all pending migrations
- **Usage**: `node netlify/functions/migrations/run-migrations.cjs`
- **Features**:
  - Tracks executed migrations
  - Executes migrations in correct order
  - Transaction safety
  - Detailed logging

### validate-migration.cjs
- **Purpose**: Comprehensive validation of migration results
- **Usage**: `node netlify/functions/migrations/validate-migration.cjs`
- **Features**:
  - Platform structure validation
  - Product migration verification
  - Sales migration verification
  - Data integrity checks
  - Business logic validation
  - Detailed reporting

### rollback-migration.sql
- **Purpose**: Emergency rollback script to revert all platform changes
- **Usage**: Execute via rollback-runner.cjs or manually in emergency
- **Features**:
  - Complete platform migration reversal
  - Backup table restoration
  - Original structure restoration
  - Safety checks and validation

### rollback-runner.cjs
- **Purpose**: Interactive rollback execution with safety confirmations
- **Usage**: `node netlify/functions/migrations/rollback-runner.cjs`
- **Features**:
  - Interactive confirmation prompts
  - Prerequisites checking
  - Rollback validation
  - Detailed reporting

## Running Migrations

### Automatic Migration Runner

Use the migration runner script to execute all pending migrations:

```bash
node netlify/functions/migrations/run-migrations.cjs
```

### Validation After Migration

Validate the migration results:

```bash
node netlify/functions/migrations/validate-migration.cjs
```

### Manual Execution

Execute individual migration files in order:

```bash
# Connect to your PostgreSQL database
psql -d your_database_name

# Run migrations in order
\i netlify/functions/migrations/001_create_platforms_table.sql
\i netlify/functions/migrations/002_create_credit_movements_table.sql
\i netlify/functions/migrations/003_modify_digital_products_table.sql
\i netlify/functions/migrations/004_update_sales_table.sql
\i netlify/functions/migrations/005_migrate_existing_data.sql
\i netlify/functions/migrations/006_cleanup_purchase_data.sql
```

## Migration Tracking

The system automatically tracks executed migrations in the `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Rollback Strategy

### Emergency Rollback (Interactive)

**⚠️ WARNING: Use only in emergency situations!**

```bash
# Interactive rollback with safety confirmations
node netlify/functions/migrations/rollback-runner.cjs
```

This will:
1. Prompt for confirmation (requires typing "ROLLBACK")
2. Check prerequisites and backup availability
3. Execute complete rollback procedure
4. Validate rollback completion
5. Generate detailed report

### Manual Emergency Rollback

**⚠️ EXTREME CAUTION: Only if interactive rollback fails!**

```bash
# Connect to database
psql -d your_database_name

# Execute rollback script
\i netlify/functions/migrations/rollback-migration.sql
```

### Rollback Features

- **Backup Restoration**: Automatically restores from backup tables if available
- **Structure Reversion**: Removes all platform-related columns and tables
- **Data Safety**: Creates backups before making changes
- **Validation**: Verifies rollback completion
- **Reporting**: Provides detailed rollback report

### Rollback Prerequisites

Before executing rollback:
1. **Full database backup** should exist
2. **Application in maintenance mode**
3. **All users logged out**
4. **Backup tables available** (created during cleanup migration)

### Post-Rollback Steps

After successful rollback:
1. Update application code to use original schema
2. Restart application services
3. Verify all functionality works correctly
4. Remove maintenance mode
5. Notify users that system is restored

## Validation

After running migrations, verify the schema:

```sql
-- Check platforms table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'platforms' 
ORDER BY ordinal_position;

-- Check credit movements table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'platform_credit_movements' 
ORDER BY ordinal_position;

-- Verify default platform exists
SELECT * FROM platforms WHERE id = 'default-platform';

-- Test JSON functionality
SELECT metadata FROM platforms WHERE metadata IS NOT NULL;
```

## Environment Setup

### Database Connection

The migration runner uses the following connection priority:

1. `NETLIFY_DATABASE_URL` environment variable
2. Hardcoded connection string (for development)

### Required Permissions

The database user needs the following permissions:

- `CREATE TABLE`
- `CREATE INDEX`
- `INSERT`, `UPDATE`, `DELETE`
- `SELECT` on information_schema

## Best Practices

### Before Running Migrations

1. **Backup your database**
2. **Test on a copy of production data**
3. **Verify connection string**
4. **Check available disk space**
5. **Plan maintenance window**

### After Running Migrations

1. **Verify table structure**
2. **Test basic operations**
3. **Check application connectivity**
4. **Monitor performance**
5. **Update application configuration**

## Troubleshooting

### Common Issues

#### Connection Errors
```
Error: Connection failed
```
- Verify database connection string
- Check network connectivity
- Ensure database is running

#### Permission Errors
```
Error: permission denied for table
```
- Verify user has required permissions
- Check database user configuration

#### Constraint Violations
```
Error: duplicate key value violates unique constraint
```
- Check for existing data conflicts
- Verify migration order

### Recovery Steps

1. **Check migration status**:
   ```sql
   SELECT * FROM schema_migrations ORDER BY executed_at;
   ```

2. **Verify table existence**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('platforms', 'platform_credit_movements');
   ```

3. **Check for partial migrations**:
   ```sql
   SELECT COUNT(*) FROM platforms;
   SELECT COUNT(*) FROM platform_credit_movements;
   ```

## Future Migrations

When adding new migrations:

1. **Use sequential numbering**: `003_`, `004_`, etc.
2. **Include rollback instructions** in comments
3. **Test thoroughly** before production
4. **Document dependencies** and changes
5. **Update this README** with new migration info

## Support

For migration issues:

1. Check the logs for detailed error messages
2. Verify database connectivity and permissions
3. Ensure all dependencies are met
4. Contact the development team if issues persist

---

**⚠️ Important**: Always backup your database before running migrations in production!
