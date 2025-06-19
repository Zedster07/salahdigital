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

  // Stock Purchases
  async getStockPurchases() {
    try {
      return await this.request('/api/stock-purchases');
    } catch (error) {
      console.warn('Failed to fetch stock purchases from database, returning empty array:', error);
      return [];
    }
  }

  async createStockPurchase(purchaseData: any) {
    return this.request('/api/stock-purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  }

  async updateStockPurchase(purchaseData: any) {
    return this.request('/api/stock-purchase', {
      method: 'PUT',
      body: JSON.stringify(purchaseData),
    });
  }

  async deleteStockPurchase(purchaseId: string) {
    return this.request('/api/stock-purchase', {
      method: 'DELETE',
      body: JSON.stringify({ id: purchaseId }),
    });
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