/**
 * Financial Reporting Service
 * 
 * Comprehensive service for generating financial reports related to platform profitability,
 * credit utilization, sales analysis, and business intelligence for the digital subscription system.
 */

const { Pool } = require('pg');

class FinancialReportingService {
  constructor(pool) {
    this.pool = pool;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Generate cache key for reports
   */
  generateCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
  }

  /**
   * Get cached result or execute query
   */
  async getCachedResult(cacheKey, queryFunction) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const result = await queryFunction();
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Clear cache for specific pattern or all cache
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get platform profitability report
   * @param {string} platformId - Platform ID (optional, if not provided returns all platforms)
   * @param {Object} dateRange - Date range filter
   * @param {string} dateRange.startDate - Start date (ISO string)
   * @param {string} dateRange.endDate - End date (ISO string)
   * @returns {Promise<Object>} Platform profitability report
   */
  async getPlatformProfitability(platformId = null, dateRange = null) {
    const cacheKey = this.generateCacheKey('platformProfitability', { platformId, dateRange });
    
    return this.getCachedResult(cacheKey, async () => {
      const client = await this.pool.connect();
      try {
        let whereClause = 'WHERE s.platform_id IS NOT NULL';
        const params = [];
        let paramIndex = 1;

        // Add platform filter
        if (platformId) {
          whereClause += ` AND s.platform_id = $${paramIndex}`;
          params.push(platformId);
          paramIndex++;
        }

        // Add date range filter
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          whereClause += ` AND s.sale_date >= $${paramIndex} AND s.sale_date <= $${paramIndex + 1}`;
          params.push(dateRange.startDate, dateRange.endDate);
          paramIndex += 2;
        }

        const query = `
          SELECT 
            p.id as platform_id,
            p.name as platform_name,
            p.credit_balance as current_balance,
            COUNT(s.id) as total_sales,
            SUM(s.quantity) as total_quantity_sold,
            SUM(s.total_price) as total_revenue,
            SUM(s.platform_buying_price * s.quantity) as total_platform_cost,
            SUM(s.profit) as total_profit,
            AVG(s.profit) as average_profit_per_sale,
            AVG(s.platform_buying_price) as average_buying_price,
            AVG(s.unit_price) as average_selling_price,
            CASE 
              WHEN SUM(s.total_price) > 0 
              THEN (SUM(s.profit) / SUM(s.total_price)) * 100 
              ELSE 0 
            END as profit_margin_percentage,
            COUNT(CASE WHEN s.payment_type = 'recurring' THEN 1 END) as recurring_sales,
            COUNT(CASE WHEN s.payment_type = 'one-time' THEN 1 END) as one_time_sales,
            MIN(s.sale_date) as first_sale_date,
            MAX(s.sale_date) as last_sale_date
          FROM platforms p
          LEFT JOIN stock_sales s ON p.id = s.platform_id
          ${whereClause}
          GROUP BY p.id, p.name, p.credit_balance
          ORDER BY total_revenue DESC NULLS LAST
        `;

        const result = await client.query(query, params);
        
        const platforms = result.rows.map(row => ({
          platformId: row.platform_id,
          platformName: row.platform_name,
          currentBalance: parseFloat(row.current_balance || 0),
          totalSales: parseInt(row.total_sales || 0),
          totalQuantitySold: parseInt(row.total_quantity_sold || 0),
          totalRevenue: parseFloat(row.total_revenue || 0),
          totalPlatformCost: parseFloat(row.total_platform_cost || 0),
          totalProfit: parseFloat(row.total_profit || 0),
          averageProfitPerSale: parseFloat(row.average_profit_per_sale || 0),
          averageBuyingPrice: parseFloat(row.average_buying_price || 0),
          averageSellingPrice: parseFloat(row.average_selling_price || 0),
          profitMarginPercentage: parseFloat(row.profit_margin_percentage || 0),
          recurringSales: parseInt(row.recurring_sales || 0),
          oneTimeSales: parseInt(row.one_time_sales || 0),
          firstSaleDate: row.first_sale_date,
          lastSaleDate: row.last_sale_date,
          roi: row.total_platform_cost > 0 ? 
            ((parseFloat(row.total_profit || 0) / parseFloat(row.total_platform_cost || 0)) * 100) : 0
        }));

        // Calculate summary statistics
        const summary = {
          totalPlatforms: platforms.length,
          totalRevenue: platforms.reduce((sum, p) => sum + p.totalRevenue, 0),
          totalProfit: platforms.reduce((sum, p) => sum + p.totalProfit, 0),
          totalPlatformCost: platforms.reduce((sum, p) => sum + p.totalPlatformCost, 0),
          averageProfitMargin: platforms.length > 0 ? 
            platforms.reduce((sum, p) => sum + p.profitMarginPercentage, 0) / platforms.length : 0,
          totalCurrentBalance: platforms.reduce((sum, p) => sum + p.currentBalance, 0),
          mostProfitablePlatform: platforms.length > 0 ? platforms[0] : null,
          leastProfitablePlatform: platforms.length > 0 ? platforms[platforms.length - 1] : null
        };

        return {
          summary,
          platforms,
          dateRange,
          generatedAt: new Date().toISOString()
        };

      } finally {
        client.release();
      }
    });
  }

  /**
   * Get credit utilization report
   * @param {string} platformId - Platform ID (optional)
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Object>} Credit utilization report
   */
  async getCreditUtilization(platformId = null, dateRange = null) {
    const cacheKey = this.generateCacheKey('creditUtilization', { platformId, dateRange });
    
    return this.getCachedResult(cacheKey, async () => {
      const client = await this.pool.connect();
      try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Add platform filter
        if (platformId) {
          whereClause += ` AND pcm.platform_id = $${paramIndex}`;
          params.push(platformId);
          paramIndex++;
        }

        // Add date range filter
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          whereClause += ` AND pcm.created_at >= $${paramIndex} AND pcm.created_at <= $${paramIndex + 1}`;
          params.push(dateRange.startDate, dateRange.endDate);
          paramIndex += 2;
        }

        const query = `
          SELECT 
            p.id as platform_id,
            p.name as platform_name,
            p.credit_balance as current_balance,
            SUM(CASE WHEN pcm.type = 'credit_added' THEN pcm.amount ELSE 0 END) as total_credits_added,
            SUM(CASE WHEN pcm.type IN ('credit_deducted', 'sale_deduction') THEN pcm.amount ELSE 0 END) as total_credits_used,
            COUNT(CASE WHEN pcm.type = 'credit_added' THEN 1 END) as credit_add_transactions,
            COUNT(CASE WHEN pcm.type IN ('credit_deducted', 'sale_deduction') THEN 1 END) as credit_use_transactions,
            COUNT(CASE WHEN pcm.type = 'sale_deduction' THEN 1 END) as sales_transactions,
            AVG(CASE WHEN pcm.type = 'credit_added' THEN pcm.amount END) as average_credit_addition,
            AVG(CASE WHEN pcm.type IN ('credit_deducted', 'sale_deduction') THEN pcm.amount END) as average_credit_usage,
            MIN(pcm.created_at) as first_transaction_date,
            MAX(pcm.created_at) as last_transaction_date
          FROM platforms p
          LEFT JOIN platform_credit_movements pcm ON p.id = pcm.platform_id
          ${whereClause}
          GROUP BY p.id, p.name, p.credit_balance
          ORDER BY total_credits_used DESC NULLS LAST
        `;

        const result = await client.query(query, params);
        
        const platforms = result.rows.map(row => {
          const totalAdded = parseFloat(row.total_credits_added || 0);
          const totalUsed = parseFloat(row.total_credits_used || 0);
          const currentBalance = parseFloat(row.current_balance || 0);
          
          return {
            platformId: row.platform_id,
            platformName: row.platform_name,
            currentBalance,
            totalCreditsAdded: totalAdded,
            totalCreditsUsed: totalUsed,
            netCreditFlow: totalAdded - totalUsed,
            creditAddTransactions: parseInt(row.credit_add_transactions || 0),
            creditUseTransactions: parseInt(row.credit_use_transactions || 0),
            salesTransactions: parseInt(row.sales_transactions || 0),
            averageCreditAddition: parseFloat(row.average_credit_addition || 0),
            averageCreditUsage: parseFloat(row.average_credit_usage || 0),
            utilizationRate: totalAdded > 0 ? (totalUsed / totalAdded) * 100 : 0,
            firstTransactionDate: row.first_transaction_date,
            lastTransactionDate: row.last_transaction_date,
            balanceToUsageRatio: totalUsed > 0 ? currentBalance / totalUsed : 0
          };
        });

        // Calculate summary statistics
        const summary = {
          totalPlatforms: platforms.length,
          totalCreditsAdded: platforms.reduce((sum, p) => sum + p.totalCreditsAdded, 0),
          totalCreditsUsed: platforms.reduce((sum, p) => sum + p.totalCreditsUsed, 0),
          totalCurrentBalance: platforms.reduce((sum, p) => sum + p.currentBalance, 0),
          averageUtilizationRate: platforms.length > 0 ? 
            platforms.reduce((sum, p) => sum + p.utilizationRate, 0) / platforms.length : 0,
          totalTransactions: platforms.reduce((sum, p) => sum + p.creditAddTransactions + p.creditUseTransactions, 0),
          highestUtilizationPlatform: platforms.reduce((max, p) => 
            p.utilizationRate > (max?.utilizationRate || 0) ? p : max, null),
          lowestUtilizationPlatform: platforms.reduce((min, p) => 
            p.utilizationRate < (min?.utilizationRate || Infinity) ? p : min, null)
        };

        return {
          summary,
          platforms,
          dateRange,
          generatedAt: new Date().toISOString()
        };

      } finally {
        client.release();
      }
    });
  }

  /**
   * Get comprehensive sales profit report
   * @param {Object} filters - Report filters
   * @param {string} filters.platformId - Platform ID filter
   * @param {string} filters.productId - Product ID filter
   * @param {string} filters.category - Product category filter
   * @param {string} filters.paymentType - Payment type filter
   * @param {Object} filters.dateRange - Date range filter
   * @param {string} filters.groupBy - Group results by (platform, product, category, month)
   * @returns {Promise<Object>} Sales profit report
   */
  async getSalesProfitReport(filters = {}) {
    const cacheKey = this.generateCacheKey('salesProfitReport', filters);

    return this.getCachedResult(cacheKey, async () => {
      const client = await this.pool.connect();
      try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Build dynamic WHERE clause based on filters
        if (filters.platformId) {
          whereClause += ` AND s.platform_id = $${paramIndex}`;
          params.push(filters.platformId);
          paramIndex++;
        }

        if (filters.productId) {
          whereClause += ` AND s.product_id = $${paramIndex}`;
          params.push(filters.productId);
          paramIndex++;
        }

        if (filters.category) {
          whereClause += ` AND dp.category = $${paramIndex}`;
          params.push(filters.category);
          paramIndex++;
        }

        if (filters.paymentType) {
          whereClause += ` AND s.payment_type = $${paramIndex}`;
          params.push(filters.paymentType);
          paramIndex++;
        }

        if (filters.dateRange && filters.dateRange.startDate && filters.dateRange.endDate) {
          whereClause += ` AND s.sale_date >= $${paramIndex} AND s.sale_date <= $${paramIndex + 1}`;
          params.push(filters.dateRange.startDate, filters.dateRange.endDate);
          paramIndex += 2;
        }

        // Build GROUP BY clause based on groupBy filter
        let groupByClause = '';
        let selectClause = '';

        switch (filters.groupBy) {
          case 'platform':
            selectClause = `
              s.platform_id as group_id,
              p.name as group_name,
              'platform' as group_type,
            `;
            groupByClause = 'GROUP BY s.platform_id, p.name';
            break;
          case 'product':
            selectClause = `
              s.product_id as group_id,
              s.product_name as group_name,
              'product' as group_type,
            `;
            groupByClause = 'GROUP BY s.product_id, s.product_name';
            break;
          case 'category':
            selectClause = `
              dp.category as group_id,
              dp.category as group_name,
              'category' as group_type,
            `;
            groupByClause = 'GROUP BY dp.category';
            break;
          case 'month':
            selectClause = `
              DATE_TRUNC('month', s.sale_date) as group_id,
              TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM') as group_name,
              'month' as group_type,
            `;
            groupByClause = 'GROUP BY DATE_TRUNC(\'month\', s.sale_date)';
            break;
          default:
            selectClause = `
              'all' as group_id,
              'All Sales' as group_name,
              'total' as group_type,
            `;
            groupByClause = '';
        }

        const query = `
          SELECT
            ${selectClause}
            COUNT(s.id) as total_sales,
            SUM(s.quantity) as total_quantity,
            SUM(s.total_price) as total_revenue,
            SUM(s.platform_buying_price * s.quantity) as total_cost,
            SUM(s.profit) as total_profit,
            AVG(s.profit) as average_profit_per_sale,
            AVG(s.unit_price) as average_selling_price,
            AVG(s.platform_buying_price) as average_buying_price,
            CASE
              WHEN SUM(s.total_price) > 0
              THEN (SUM(s.profit) / SUM(s.total_price)) * 100
              ELSE 0
            END as profit_margin_percentage,
            COUNT(CASE WHEN s.payment_type = 'recurring' THEN 1 END) as recurring_sales,
            COUNT(CASE WHEN s.payment_type = 'one-time' THEN 1 END) as one_time_sales,
            COUNT(CASE WHEN s.payment_status = 'paid' THEN 1 END) as paid_sales,
            COUNT(CASE WHEN s.payment_status = 'pending' THEN 1 END) as pending_sales,
            MIN(s.sale_date) as first_sale_date,
            MAX(s.sale_date) as last_sale_date
          FROM stock_sales s
          LEFT JOIN platforms p ON s.platform_id = p.id
          LEFT JOIN digital_products dp ON s.product_id = dp.id
          ${whereClause}
          ${groupByClause}
          ORDER BY total_revenue DESC
        `;

        const result = await client.query(query, params);

        const groups = result.rows.map(row => ({
          groupId: row.group_id,
          groupName: row.group_name,
          groupType: row.group_type,
          totalSales: parseInt(row.total_sales || 0),
          totalQuantity: parseInt(row.total_quantity || 0),
          totalRevenue: parseFloat(row.total_revenue || 0),
          totalCost: parseFloat(row.total_cost || 0),
          totalProfit: parseFloat(row.total_profit || 0),
          averageProfitPerSale: parseFloat(row.average_profit_per_sale || 0),
          averageSellingPrice: parseFloat(row.average_selling_price || 0),
          averageBuyingPrice: parseFloat(row.average_buying_price || 0),
          profitMarginPercentage: parseFloat(row.profit_margin_percentage || 0),
          recurringSales: parseInt(row.recurring_sales || 0),
          oneTimeSales: parseInt(row.one_time_sales || 0),
          paidSales: parseInt(row.paid_sales || 0),
          pendingSales: parseInt(row.pending_sales || 0),
          firstSaleDate: row.first_sale_date,
          lastSaleDate: row.last_sale_date,
          roi: row.total_cost > 0 ? ((parseFloat(row.total_profit || 0) / parseFloat(row.total_cost || 0)) * 100) : 0
        }));

        // Calculate summary statistics
        const summary = {
          totalGroups: groups.length,
          totalRevenue: groups.reduce((sum, g) => sum + g.totalRevenue, 0),
          totalProfit: groups.reduce((sum, g) => sum + g.totalProfit, 0),
          totalCost: groups.reduce((sum, g) => sum + g.totalCost, 0),
          totalSales: groups.reduce((sum, g) => sum + g.totalSales, 0),
          averageProfitMargin: groups.length > 0 ?
            groups.reduce((sum, g) => sum + g.profitMarginPercentage, 0) / groups.length : 0,
          bestPerformingGroup: groups.length > 0 ? groups[0] : null,
          worstPerformingGroup: groups.length > 0 ? groups[groups.length - 1] : null
        };

        return {
          summary,
          groups,
          filters,
          generatedAt: new Date().toISOString()
        };

      } finally {
        client.release();
      }
    });
  }

  /**
   * Get platforms with low credit balance
   * @param {number} threshold - Credit balance threshold (default: 100)
   * @returns {Promise<Object>} Low credit platforms report
   */
  async getLowCreditPlatforms(threshold = 100) {
    const cacheKey = this.generateCacheKey('lowCreditPlatforms', { threshold });

    return this.getCachedResult(cacheKey, async () => {
      const client = await this.pool.connect();
      try {
        const query = `
          SELECT
            p.id as platform_id,
            p.name as platform_name,
            p.credit_balance,
            p.is_active,
            p.created_at,
            p.updated_at,
            COUNT(s.id) as recent_sales_count,
            SUM(s.platform_buying_price * s.quantity) as recent_credit_usage,
            AVG(s.platform_buying_price * s.quantity) as average_sale_cost,
            MAX(s.sale_date) as last_sale_date,
            COUNT(dp.id) as associated_products_count,
            SUM(dp.current_stock) as total_product_stock
          FROM platforms p
          LEFT JOIN stock_sales s ON p.id = s.platform_id
            AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
          LEFT JOIN digital_products dp ON p.id = dp.platform_id AND dp.is_active = true
          WHERE p.credit_balance <= $1 AND p.is_active = true
          GROUP BY p.id, p.name, p.credit_balance, p.is_active, p.created_at, p.updated_at
          ORDER BY p.credit_balance ASC, recent_credit_usage DESC
        `;

        const result = await client.query(query, [threshold]);

        const platforms = result.rows.map(row => {
          const creditBalance = parseFloat(row.credit_balance || 0);
          const recentUsage = parseFloat(row.recent_credit_usage || 0);
          const averageSaleCost = parseFloat(row.average_sale_cost || 0);

          // Estimate days until depletion based on recent usage
          let estimatedDaysUntilDepletion = null;
          if (recentUsage > 0) {
            const dailyUsage = recentUsage / 30; // 30 days of data
            estimatedDaysUntilDepletion = Math.floor(creditBalance / dailyUsage);
          }

          return {
            platformId: row.platform_id,
            platformName: row.platform_name,
            creditBalance,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            recentSalesCount: parseInt(row.recent_sales_count || 0),
            recentCreditUsage: recentUsage,
            averageSaleCost,
            lastSaleDate: row.last_sale_date,
            associatedProductsCount: parseInt(row.associated_products_count || 0),
            totalProductStock: parseInt(row.total_product_stock || 0),
            estimatedDaysUntilDepletion,
            urgencyLevel: creditBalance <= threshold * 0.2 ? 'critical' :
                         creditBalance <= threshold * 0.5 ? 'high' : 'medium',
            recommendedTopUp: Math.max(threshold * 2 - creditBalance, 0)
          };
        });

        // Calculate summary statistics
        const summary = {
          totalLowCreditPlatforms: platforms.length,
          criticalPlatforms: platforms.filter(p => p.urgencyLevel === 'critical').length,
          highUrgencyPlatforms: platforms.filter(p => p.urgencyLevel === 'high').length,
          mediumUrgencyPlatforms: platforms.filter(p => p.urgencyLevel === 'medium').length,
          totalCreditDeficit: platforms.reduce((sum, p) => sum + p.recommendedTopUp, 0),
          averageBalance: platforms.length > 0 ?
            platforms.reduce((sum, p) => sum + p.creditBalance, 0) / platforms.length : 0,
          platformsWithRecentActivity: platforms.filter(p => p.recentSalesCount > 0).length,
          threshold
        };

        return {
          summary,
          platforms,
          threshold,
          generatedAt: new Date().toISOString()
        };

      } finally {
        client.release();
      }
    });
  }

  /**
   * Get comprehensive financial dashboard data
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Object>} Financial dashboard data
   */
  async getFinancialDashboard(dateRange = null) {
    const cacheKey = this.generateCacheKey('financialDashboard', { dateRange });

    return this.getCachedResult(cacheKey, async () => {
      // Get all reports in parallel for dashboard
      const [
        platformProfitability,
        creditUtilization,
        salesProfitReport,
        lowCreditPlatforms
      ] = await Promise.all([
        this.getPlatformProfitability(null, dateRange),
        this.getCreditUtilization(null, dateRange),
        this.getSalesProfitReport({ dateRange, groupBy: 'month' }),
        this.getLowCreditPlatforms(100)
      ]);

      return {
        platformProfitability,
        creditUtilization,
        salesProfitReport,
        lowCreditPlatforms,
        dateRange,
        generatedAt: new Date().toISOString()
      };
    });
  }
}

module.exports = FinancialReportingService;
