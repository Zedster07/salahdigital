// Migration Runner for Digital Subscription Management System
// This script runs database migrations in order

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL || 'postgresql://neondb_owner:npg_2kYdLiNtQE7P@ep-nameless-feather-a54wld9p-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Create migrations tracking table
async function createMigrationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations tracking table ready');
  } finally {
    client.release();
  }
}

// Get executed migrations
async function getExecutedMigrations() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT version FROM schema_migrations ORDER BY version');
    return result.rows.map(row => row.version);
  } finally {
    client.release();
  }
}

// Execute a migration file
async function executeMigration(filename) {
  const client = await pool.connect();
  try {
    const migrationPath = path.join(__dirname, filename);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`🔄 Executing migration: ${filename}`);
    
    // Execute the migration in a transaction
    await client.query('BEGIN');
    await client.query(sql);
    
    // Record the migration as executed
    const version = filename.replace('.sql', '');
    await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    
    await client.query('COMMIT');
    console.log(`✅ Migration completed: ${filename}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed: ${filename}`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Main migration runner
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Create migrations tracking table
    await createMigrationsTable();
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Get already executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Execute pending migrations
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');
      if (!executedMigrations.includes(version)) {
        await executeMigration(file);
      } else {
        console.log(`⏭️  Skipping already executed migration: ${file}`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations, executeMigration, getExecutedMigrations };
