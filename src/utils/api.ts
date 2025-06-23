// API utility functions for database operations
const API_BASE_URL = '/.netlify/functions';

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Get response text first to handle both JSON and HTML responses
      const responseText = await response.text();
      
      if (!response.ok) {
        // Log the actual response for debugging
        console.error(`API request failed for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 500) // First 500 chars for debugging
        });
        
        // Try to parse as JSON for error details
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        } catch (parseError) {
          // If it's not JSON, it's likely an HTML error page
          if (responseText.includes('<!doctype') || responseText.includes('<html')) {
            throw new Error(`Function returned HTML instead of JSON. This usually means the Netlify function failed to deploy or execute properly. Status: ${response.status}`);
          }
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
      }
      
      // Try to parse successful response as JSON
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error(`Failed to parse JSON response from ${endpoint}:`, responseText.substring(0, 500));
        throw new Error(`Invalid JSON response from ${endpoint}. Response was: ${responseText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      // Enhanced error logging
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`Network error for ${endpoint}:`, error);
        throw new Error(`Network error: Unable to connect to ${endpoint}. Make sure the Netlify functions are deployed.`);
      }
      
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Initialize database
  async initializeDatabase() {
    try {
      return await this.request('/db-init');
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Return a fallback response to allow the app to continue with localStorage
      return { success: false, error: error.message };
    }
  }

  // Users
  async getUsers() {
    try {
      return await this.request('/api/users');
    } catch (error) {
      console.warn('Failed to fetch users from database, returning empty array:', error);
      return [];
    }
  }

  async createUser(userData: any) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userData: any) {
    return this.request('/api/user', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string) {
    return this.request('/api/user', {
      method: 'DELETE',
      body: JSON.stringify({ id: userId }),
    });
  }

  // Subscribers
  async getSubscribers() {
    try {
      return await this.request('/api/subscribers');
    } catch (error) {
      console.warn('Failed to fetch subscribers from database, returning empty array:', error);
      return [];
    }
  }

  async createSubscriber(subscriberData: any) {
    return this.request('/api/subscribers', {
      method: 'POST',
      body: JSON.stringify(subscriberData),
    });
  }

  async updateSubscriber(subscriberData: any) {
    return this.request('/api/subscriber', {
      method: 'PUT',
      body: JSON.stringify(subscriberData),
    });
  }

  async deleteSubscriber(subscriberId: string) {
    return this.request('/api/subscriber', {
      method: 'DELETE',
      body: JSON.stringify({ id: subscriberId }),
    });
  }

  // Digital Products
  async getDigitalProducts() {
    try {
      return await this.request('/api/digital-products');
    } catch (error) {
      console.warn('Failed to fetch digital products from database, returning empty array:', error);
      return [];
    }
  }

  async createDigitalProduct(productData: any) {
    return this.request('/api/digital-products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateDigitalProduct(productData: any) {
    return this.request('/api/digital-product', {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteDigitalProduct(productId: string) {
    return this.request('/api/digital-product', {
      method: 'DELETE',
      body: JSON.stringify({ id: productId }),
    });
  }

  // Platform-specific product operations (Task 9)
  async getProductsByPlatform(platformId: string) {
    try {
      return await this.request(`/api/platforms/${platformId}/products`);
    } catch (error) {
      console.warn(`Failed to fetch products for platform ${platformId}:`, error);
      return [];
    }
  }

  async calculateProductPricing(platformBuyingPrice: number, profitMargin: number) {
    try {
      return await this.request('/api/product-pricing-calculate', {
        method: 'POST',
        body: JSON.stringify({
          platformBuyingPrice,
          profitMargin
        }),
      });
    } catch (error) {
      console.warn('Failed to calculate product pricing:', error);
      return {
        buyingPrice: platformBuyingPrice,
        profitMargin: profitMargin,
        sellingPrice: 0,
        profitAmount: 0,
        error: error.message
      };
    }
  }

  async updateProductPlatformAssociation(productId: string, platformId?: string) {
    return this.request('/api/product-platform-association', {
      method: 'PUT',
      body: JSON.stringify({
        productId,
        platformId
      }),
    });
  }

  // Enhanced Sales API operations (Task 12)
  async getSalesAnalytics() {
    try {
      return await this.request('/api/sales-analytics');
    } catch (error) {
      console.warn('Failed to fetch sales analytics:', error);
      return {
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        platformSales: 0,
        traditionalSales: 0,
        recurringSales: 0,
        platformBreakdown: {},
        paymentMethodBreakdown: {},
        profitMargins: { average: 0, platform: 0, traditional: 0 }
      };
    }
  }

  async getSalesPlatformSummary(platformId: string) {
    try {
      return await this.request(`/api/sales-platform-summary?platformId=${platformId}`);
    } catch (error) {
      console.warn(`Failed to fetch platform sales summary for ${platformId}:`, error);
      return {
        platformId,
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        totalCreditsUsed: 0,
        recurringSales: 0,
        averageOrderValue: 0,
        profitMargin: 0,
        recentSales: []
      };
    }
  }

  async getSaleDetails(saleId: string) {
    try {
      return await this.request(`/api/stock-sale/${saleId}`);
    } catch (error) {
      console.warn(`Failed to fetch sale details for ${saleId}:`, error);
      throw error;
    }
  }

  // Enhanced Product API operations (Task 10)
  async getProductDetails(productId: string) {
    try {
      return await this.request(`/api/digital-product/${productId}`);
    } catch (error) {
      console.warn(`Failed to fetch product details for ${productId}:`, error);
      throw error;
    }
  }

  async getProductAnalytics() {
    try {
      return await this.request('/api/product-analytics');
    } catch (error) {
      console.warn('Failed to fetch product analytics:', error);
      return {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        platformProducts: 0,
        traditionalProducts: 0,
        lowStockProducts: 0,
        categoryBreakdown: {},
        platformBreakdown: {},
        stockAnalysis: {
          totalStock: 0,
          averageStock: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        },
        pricingAnalysis: {
          averageSellPrice: 0,
          averagePlatformPrice: 0,
          averageMargin: 0
        }
      };
    }
  }

  async getProductPlatformSummary(platformId: string) {
    try {
      return await this.request(`/api/product-platform-summary?platformId=${platformId}`);
    } catch (error) {
      console.warn(`Failed to fetch product platform summary for ${platformId}:`, error);
      return {
        platformId,
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        totalStock: 0,
        lowStockProducts: 0,
        averageBuyingPrice: 0,
        averageMargin: 0,
        averageSellPrice: 0,
        categoryBreakdown: {},
        recentProducts: []
      };
    }
  }

  async getFilteredProducts(filters: {
    platformId?: string;
    category?: string;
    isActive?: boolean;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters.platformId) params.append('platformId', filters.platformId);
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

      const queryString = params.toString();
      const url = queryString ? `/api/digital-products?${queryString}` : '/api/digital-products';

      return await this.request(url);
    } catch (error) {
      console.warn('Failed to fetch filtered products:', error);
      return [];
    }
  }

  // Enhanced Financial Reporting API operations (Task 14)
  async getFinancialReport(type: string, options: {
    platformId?: string;
    productId?: string;
    category?: string;
    paymentType?: string;
    groupBy?: string;
    threshold?: number;
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'csv';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    noCache?: boolean;
  } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('type', type);

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.request(`/api/financial-reports?${params.toString()}`);

      // Handle CSV format response
      if (options.format === 'csv') {
        return response; // CSV data as string
      }

      return response;
    } catch (error) {
      console.warn(`Failed to fetch financial report ${type}:`, error);
      return this.getEmptyFinancialReport(type);
    }
  }

  async getEnhancedFinancialReport(reportType: string, options: {
    platformId?: string;
    productId?: string;
    category?: string;
    paymentType?: string;
    groupBy?: string;
    threshold?: number;
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'csv';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    noCache?: boolean;
  } = {}) {
    try {
      const params = new URLSearchParams();

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/api/reports/${reportType}?${queryString}` : `/api/reports/${reportType}`;

      const response = await this.request(url);

      // Handle CSV format response
      if (options.format === 'csv') {
        return response; // CSV data as string
      }

      return response;
    } catch (error) {
      console.warn(`Failed to fetch enhanced financial report ${reportType}:`, error);
      return this.getEmptyFinancialReport(reportType);
    }
  }

  async getPlatformProfitabilityReport(
    platformId?: string,
    dateRange?: { startDate: string; endDate: string },
    options: {
      format?: 'json' | 'csv';
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      noCache?: boolean;
    } = {}
  ) {
    try {
      const params = new URLSearchParams();
      if (platformId) params.append('platformId', platformId);
      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      // Add enhanced options
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/api/financial-platform-profitability?${queryString}` : '/api/financial-platform-profitability';

      const response = await this.request(url);

      // Handle CSV format response
      if (options.format === 'csv') {
        return response; // CSV data as string
      }

      return response;
    } catch (error) {
      console.warn('Failed to fetch platform profitability report:', error);
      return {
        summary: {
          totalPlatforms: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalPlatformCost: 0,
          averageProfitMargin: 0,
          totalCurrentBalance: 0,
          mostProfitablePlatform: null,
          leastProfitablePlatform: null
        },
        platforms: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: options.limit || 50,
          hasNextPage: false,
          hasPreviousPage: false,
          startIndex: 1,
          endIndex: 0
        },
        dateRange: dateRange || null,
        generatedAt: new Date().toISOString()
      };
    }
  }

  async getCreditUtilizationReport(platformId?: string, dateRange?: { startDate: string; endDate: string }) {
    try {
      const params = new URLSearchParams();
      if (platformId) params.append('platformId', platformId);
      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      const queryString = params.toString();
      const url = queryString ? `/api/financial-credit-utilization?${queryString}` : '/api/financial-credit-utilization';

      return await this.request(url);
    } catch (error) {
      console.warn('Failed to fetch credit utilization report:', error);
      return {
        summary: {
          totalPlatforms: 0,
          totalCreditsAdded: 0,
          totalCreditsUsed: 0,
          totalCurrentBalance: 0,
          averageUtilizationRate: 0,
          totalTransactions: 0,
          highestUtilizationPlatform: null,
          lowestUtilizationPlatform: null
        },
        platforms: [],
        dateRange: dateRange || null,
        generatedAt: new Date().toISOString()
      };
    }
  }

  async getSalesProfitReport(filters: {
    platformId?: string;
    productId?: string;
    category?: string;
    paymentType?: string;
    groupBy?: string;
    dateRange?: { startDate: string; endDate: string };
  } = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'dateRange' && value) {
          params.append('startDate', value.startDate);
          params.append('endDate', value.endDate);
        } else if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/api/financial-sales-profit?${queryString}` : '/api/financial-sales-profit';

      return await this.request(url);
    } catch (error) {
      console.warn('Failed to fetch sales profit report:', error);
      return {
        summary: {
          totalGroups: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalCost: 0,
          totalSales: 0,
          averageProfitMargin: 0,
          bestPerformingGroup: null,
          worstPerformingGroup: null
        },
        groups: [],
        filters,
        generatedAt: new Date().toISOString()
      };
    }
  }

  async getLowCreditPlatformsReport(threshold: number = 100) {
    try {
      return await this.request(`/api/financial-low-credit-platforms?threshold=${threshold}`);
    } catch (error) {
      console.warn('Failed to fetch low credit platforms report:', error);
      return {
        summary: {
          totalLowCreditPlatforms: 0,
          criticalPlatforms: 0,
          highUrgencyPlatforms: 0,
          mediumUrgencyPlatforms: 0,
          totalCreditDeficit: 0,
          averageBalance: 0,
          platformsWithRecentActivity: 0,
          threshold
        },
        platforms: [],
        threshold,
        generatedAt: new Date().toISOString()
      };
    }
  }

  async getFinancialDashboard(dateRange?: { startDate: string; endDate: string }) {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      const queryString = params.toString();
      const url = queryString ? `/api/financial-dashboard?${queryString}` : '/api/financial-dashboard';

      return await this.request(url);
    } catch (error) {
      console.warn('Failed to fetch financial dashboard:', error);
      return {
        platformProfitability: await this.getPlatformProfitabilityReport(undefined, dateRange),
        creditUtilization: await this.getCreditUtilizationReport(undefined, dateRange),
        salesProfitReport: await this.getSalesProfitReport({ dateRange, groupBy: 'month' }),
        lowCreditPlatforms: await this.getLowCreditPlatformsReport(100),
        dateRange: dateRange || null,
        generatedAt: new Date().toISOString()
      };
    }
  }

  private getEmptyFinancialReport(type: string) {
    const baseReport = {
      generatedAt: new Date().toISOString()
    };

    switch (type) {
      case 'platform-profitability':
        return {
          ...baseReport,
          summary: { totalPlatforms: 0, totalRevenue: 0, totalProfit: 0 },
          platforms: []
        };
      case 'credit-utilization':
        return {
          ...baseReport,
          summary: { totalPlatforms: 0, totalCreditsAdded: 0, totalCreditsUsed: 0 },
          platforms: []
        };
      case 'sales-profit':
        return {
          ...baseReport,
          summary: { totalGroups: 0, totalRevenue: 0, totalProfit: 0 },
          groups: []
        };
      case 'low-credit-platforms':
        return {
          ...baseReport,
          summary: { totalLowCreditPlatforms: 0, criticalPlatforms: 0 },
          platforms: []
        };
      default:
        return baseReport;
    }
  }

  // Note: Stock Purchases methods removed as part of platform migration
  // The system now uses platform-based credit management instead

  // Platform CRUD Operations
  async getPlatforms() {
    return this.request('/api/platforms');
  }

  async getPlatform(platformId: string) {
    return this.request(`/api/platforms/${platformId}/platform`);
  }

  async createPlatform(platformData: any) {
    return this.request('/api/platforms', {
      method: 'POST',
      body: JSON.stringify(platformData),
    });
  }

  async updatePlatform(platformId: string, platformData: any) {
    return this.request(`/api/platforms/${platformId}/platform`, {
      method: 'PUT',
      body: JSON.stringify(platformData),
    });
  }

  async deletePlatform(platformId: string) {
    return this.request(`/api/platforms/${platformId}/platform`, {
      method: 'DELETE',
    });
  }

  // Platform Credit Management (RESTful API - Task 8)
  async addPlatformCredits(platformId: string, amount: number, description: string, createdBy?: string) {
    return this.request(`/api/platforms/${platformId}/credits`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        description,
        createdBy
      }),
    });
  }

  async deductPlatformCredits(platformId: string, amount: number, description: string, createdBy?: string, reference?: string) {
    return this.request(`/api/platforms/${platformId}/credits/deduct`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        description,
        createdBy,
        reference
      }),
    });
  }

  async getPlatformBalance(platformId: string) {
    try {
      return await this.request(`/api/platforms/${platformId}/credits/balance`);
    } catch (error) {
      console.warn(`Failed to fetch platform balance for ${platformId}:`, error);
      return { balance: 0, platformId, error: error.message };
    }
  }

  async getPlatformCreditMovements(platformId: string, filters?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.type) queryParams.append('type', filters.type);

      const url = `/api/platforms/${platformId}/credits/movements${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return await this.request(url);
    } catch (error) {
      console.warn(`Failed to fetch credit movements for platform ${platformId}:`, error);
      return { movements: [], pagination: null, error: error.message };
    }
  }

  // Stock Sales
  async getStockSales() {
    try {
      return await this.request('/api/stock-sales');
    } catch (error) {
      console.warn('Failed to fetch stock sales from database, returning empty array:', error);
      return [];
    }
  }

  async createStockSale(saleData: any) {
    return this.request('/api/stock-sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async updateStockSale(saleData: any) {
    return this.request('/api/stock-sale', {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  async deleteStockSale(saleId: string) {
    return this.request('/api/stock-sale', {
      method: 'DELETE',
      body: JSON.stringify({ id: saleId }),
    });
  }

  // Stock Movements
  async getStockMovements() {
    try {
      return await this.request('/api/stock-movements');
    } catch (error) {
      console.warn('Failed to fetch stock movements from database, returning empty array:', error);
      return [];
    }
  }

  async createStockMovement(movementData: any) {
    return this.request('/api/stock-movements', {
      method: 'POST',
      body: JSON.stringify(movementData),
    });
  }

  // Settings
  async getSettings() {
    try {
      return await this.request('/api/settings');
    } catch (error) {
      console.warn('Failed to fetch settings from database, returning empty object:', error);
      return {};
    }
  }

  async updateSettings(settings: any) {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const apiClient = new ApiClient();