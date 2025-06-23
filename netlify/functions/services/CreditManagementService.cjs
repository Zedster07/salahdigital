/**
 * Credit Management Service
 * 
 * Handles all platform credit operations with proper transaction handling,
 * audit trail, and error management for the digital subscription system.
 */

const { Pool } = require('pg');

class CreditManagementService {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Generate a unique ID for movements
   */
  generateId() {
    return 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Add credits to a platform
   * @param {string} platformId - Platform ID
   * @param {number} amount - Amount to add (must be positive)
   * @param {string} description - Description of the operation
   * @param {string} referenceType - Type of reference (manual, deposit, refund, etc.)
   * @param {string} referenceId - Reference ID (transaction ID, user ID, etc.)
   * @param {string} createdBy - User who performed the operation
   * @returns {Promise<Object>} Operation result with balance information
   */
  async addCredits(platformId, amount, description, referenceType = 'manual', referenceId = null, createdBy = 'system') {
    if (!platformId) {
      throw new Error('Platform ID is required');
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current platform with row-level locking to prevent race conditions
      const platformResult = await client.query(
        'SELECT id, name, credit_balance, is_active FROM platforms WHERE id = $1 FOR UPDATE',
        [platformId]
      );
      
      if (platformResult.rows.length === 0) {
        throw new Error(`Platform not found: ${platformId}`);
      }
      
      const platform = platformResult.rows[0];
      
      if (!platform.is_active) {
        throw new Error(`Platform is not active: ${platform.name}`);
      }
      
      const previousBalance = parseFloat(platform.credit_balance || 0);
      const newBalance = previousBalance + amount;
      
      // Update platform balance
      await client.query(
        'UPDATE platforms SET credit_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newBalance, platformId]
      );
      
      // Record credit movement
      const movementId = this.generateId();
      await client.query(`
        INSERT INTO platform_credit_movements (
          id, platform_id, type, amount, previous_balance, new_balance, 
          reference, description, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `, [
        movementId, 
        platformId, 
        'credit_added', 
        amount, 
        previousBalance, 
        newBalance, 
        referenceId, 
        `${referenceType}: ${description}`, 
        createdBy
      ]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        platformId,
        platformName: platform.name,
        movementId,
        previousBalance,
        newBalance,
        amountAdded: amount,
        referenceType,
        referenceId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deduct credits from a platform
   * @param {string} platformId - Platform ID
   * @param {number} amount - Amount to deduct (must be positive)
   * @param {string} description - Description of the operation
   * @param {string} referenceType - Type of reference (sale, manual, adjustment, etc.)
   * @param {string} referenceId - Reference ID (sale ID, user ID, etc.)
   * @param {string} createdBy - User who performed the operation
   * @param {boolean} allowNegative - Whether to allow negative balance (default: false)
   * @returns {Promise<Object>} Operation result with balance information
   */
  async deductCredits(platformId, amount, description, referenceType = 'manual', referenceId = null, createdBy = 'system', allowNegative = false) {
    if (!platformId) {
      throw new Error('Platform ID is required');
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current platform with row-level locking
      const platformResult = await client.query(
        'SELECT id, name, credit_balance, is_active FROM platforms WHERE id = $1 FOR UPDATE',
        [platformId]
      );
      
      if (platformResult.rows.length === 0) {
        throw new Error(`Platform not found: ${platformId}`);
      }
      
      const platform = platformResult.rows[0];
      
      if (!platform.is_active) {
        throw new Error(`Platform is not active: ${platform.name}`);
      }
      
      const previousBalance = parseFloat(platform.credit_balance || 0);
      const newBalance = previousBalance - amount;
      
      // Check for insufficient funds
      if (!allowNegative && newBalance < 0) {
        throw new Error(`Insufficient credit balance. Available: $${previousBalance.toFixed(2)}, Required: $${amount.toFixed(2)}`);
      }
      
      // Update platform balance
      await client.query(
        'UPDATE platforms SET credit_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newBalance, platformId]
      );
      
      // Determine movement type based on reference
      const movementType = referenceType === 'sale' ? 'sale_deduction' : 'credit_deducted';
      
      // Record credit movement
      const movementId = this.generateId();
      await client.query(`
        INSERT INTO platform_credit_movements (
          id, platform_id, type, amount, previous_balance, new_balance, 
          reference, description, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `, [
        movementId, 
        platformId, 
        movementType, 
        amount, 
        previousBalance, 
        newBalance, 
        referenceId, 
        `${referenceType}: ${description}`, 
        createdBy
      ]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        platformId,
        platformName: platform.name,
        movementId,
        previousBalance,
        newBalance,
        amountDeducted: amount,
        referenceType,
        referenceId,
        isLowBalance: await this.checkLowBalanceStatus(platformId),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get current balance for a platform
   * @param {string} platformId - Platform ID
   * @returns {Promise<Object>} Platform balance information
   */
  async getBalance(platformId) {
    if (!platformId) {
      throw new Error('Platform ID is required');
    }

    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT id, name, credit_balance, low_balance_threshold, is_active FROM platforms WHERE id = $1',
        [platformId]
      );
      
      if (result.rows.length === 0) {
        throw new Error(`Platform not found: ${platformId}`);
      }
      
      const platform = result.rows[0];
      const balance = parseFloat(platform.credit_balance || 0);
      const threshold = parseFloat(platform.low_balance_threshold || 0);
      
      return {
        platformId: platform.id,
        platformName: platform.name,
        currentBalance: balance,
        lowBalanceThreshold: threshold,
        isLowBalance: balance <= threshold,
        isActive: platform.is_active,
        balanceStatus: balance <= 0 ? 'empty' : balance <= threshold ? 'low' : 'normal'
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Get credit movements for a platform with optional filtering
   * @param {string} platformId - Platform ID
   * @param {Object} filters - Optional filters
   * @param {string} filters.type - Movement type filter
   * @param {string} filters.referenceId - Reference ID filter
   * @param {Date} filters.startDate - Start date filter
   * @param {Date} filters.endDate - End date filter
   * @param {number} filters.limit - Limit number of results (default: 100)
   * @param {number} filters.offset - Offset for pagination (default: 0)
   * @returns {Promise<Array>} Array of credit movements
   */
  async getCreditMovements(platformId, filters = {}) {
    if (!platformId) {
      throw new Error('Platform ID is required');
    }

    const client = await this.pool.connect();
    
    try {
      let query = 'SELECT * FROM platform_credit_movements WHERE platform_id = $1';
      const params = [platformId];
      let paramIndex = 2;
      
      // Apply filters
      if (filters.type) {
        query += ` AND type = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
      }
      
      if (filters.referenceId) {
        query += ` AND reference = $${paramIndex}`;
        params.push(filters.referenceId);
        paramIndex++;
      }
      
      if (filters.startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters.endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }
      
      query += ' ORDER BY created_at DESC';
      
      // Apply pagination
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        platformId: row.platform_id,
        type: row.type,
        amount: parseFloat(row.amount),
        previousBalance: parseFloat(row.previous_balance),
        newBalance: parseFloat(row.new_balance),
        reference: row.reference,
        description: row.description,
        createdBy: row.created_by,
        createdAt: row.created_at
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Check if a platform has low balance
   * @param {string} platformId - Platform ID
   * @returns {Promise<boolean>} True if balance is low
   */
  async checkLowBalanceStatus(platformId) {
    const balanceInfo = await this.getBalance(platformId);
    return balanceInfo.isLowBalance;
  }

  /**
   * Get all platforms with low balance
   * @returns {Promise<Array>} Array of platforms with low balance
   */
  async getPlatformsWithLowBalance() {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT id, name, credit_balance, low_balance_threshold, contact_email
        FROM platforms 
        WHERE is_active = true AND credit_balance <= low_balance_threshold 
        ORDER BY credit_balance ASC
      `);
      
      return result.rows.map(row => ({
        platformId: row.id,
        platformName: row.name,
        currentBalance: parseFloat(row.credit_balance || 0),
        lowBalanceThreshold: parseFloat(row.low_balance_threshold || 0),
        contactEmail: row.contact_email,
        deficit: parseFloat(row.low_balance_threshold || 0) - parseFloat(row.credit_balance || 0)
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * Perform a balance adjustment (can be positive or negative)
   * @param {string} platformId - Platform ID
   * @param {number} adjustmentAmount - Amount to adjust (positive or negative)
   * @param {string} reason - Reason for adjustment
   * @param {string} createdBy - User performing adjustment
   * @returns {Promise<Object>} Operation result
   */
  async adjustBalance(platformId, adjustmentAmount, reason, createdBy = 'system') {
    if (adjustmentAmount === 0) {
      throw new Error('Adjustment amount cannot be zero');
    }
    
    if (adjustmentAmount > 0) {
      return await this.addCredits(platformId, adjustmentAmount, reason, 'adjustment', null, createdBy);
    } else {
      return await this.deductCredits(platformId, Math.abs(adjustmentAmount), reason, 'adjustment', null, createdBy, true);
    }
  }
}

module.exports = CreditManagementService;
