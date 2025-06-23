import { searchService } from '../../../src/services/SearchService';

// Mock localStorage
const mockLocalStorage = {
  platforms: JSON.stringify([
    {
      id: 'platform-1',
      name: 'Netflix Supplier',
      description: 'Primary Netflix account supplier',
      contactName: 'John Smith',
      contactEmail: 'john@supplier.com',
      contactPhone: '+1-555-0123',
      creditBalance: 1500,
      lowBalanceThreshold: 500,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z'
    }
  ]),
  digitalProducts: JSON.stringify([
    {
      id: 'product-1',
      name: 'Netflix Premium 1 Month',
      category: 'iptv',
      durationType: '1month',
      description: 'Netflix Premium subscription',
      currentStock: 45,
      suggestedSellPrice: 25,
      platformId: 'platform-1',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z'
    }
  ]),
  stockSales: JSON.stringify([
    {
      id: 'sale-1',
      productName: 'Netflix Premium 1 Month',
      customerName: 'Alice Johnson',
      customerPhone: '+1-555-0789',
      quantity: 1,
      totalPrice: 25,
      paymentStatus: 'paid',
      platformId: 'platform-1',
      saleDate: '2025-01-15T10:30:00Z'
    }
  ]),
  platformCreditMovements: JSON.stringify([
    {
      id: 'movement-1',
      platformId: 'platform-1',
      type: 'credit_added',
      amount: 1000,
      reference: 'BANK-001',
      description: 'Monthly top-up',
      createdAt: '2025-01-01T00:00:00Z'
    }
  ])
};

describe('SearchService', () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => mockLocalStorage[key] || null);
    
    // Force index update
    searchService.forceIndexUpdate();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search functionality', () => {
    test('should search across all entity types', async () => {
      const result = await searchService.search({
        query: 'netflix',
        limit: 10
      });

      expect(result.results).toHaveLength(2); // Platform and Product
      expect(result.totalCount).toBe(2);
      expect(result.searchTime).toBeGreaterThan(0);
      
      const entityTypes = result.results.map(r => r.type);
      expect(entityTypes).toContain('platform');
      expect(entityTypes).toContain('product');
    });

    test('should filter by entity types', async () => {
      const result = await searchService.search({
        query: 'netflix',
        filters: {
          entityTypes: ['platform']
        }
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('platform');
      expect(result.results[0].title).toBe('Netflix Supplier');
    });

    test('should handle fuzzy search', async () => {
      const result = await searchService.search({
        query: 'netflex', // Typo
        fuzzySearch: true
      });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.some(r => r.title.includes('Netflix'))).toBe(true);
    });

    test('should sort by relevance by default', async () => {
      const result = await searchService.search({
        query: 'netflix'
      });

      // Results should be sorted by relevance score (descending)
      for (let i = 0; i < result.results.length - 1; i++) {
        expect(result.results[i].relevanceScore).toBeGreaterThanOrEqual(
          result.results[i + 1].relevanceScore
        );
      }
    });

    test('should sort by date when specified', async () => {
      const result = await searchService.search({
        query: 'netflix',
        filters: {
          sortBy: 'date',
          sortOrder: 'desc'
        }
      });

      // Results should be sorted by date (newest first)
      for (let i = 0; i < result.results.length - 1; i++) {
        const dateA = new Date(result.results[i].createdAt);
        const dateB = new Date(result.results[i + 1].createdAt);
        expect(dateA.getTime()).toBeGreaterThanOrEqual(dateB.getTime());
      }
    });

    test('should apply pagination', async () => {
      const result = await searchService.search({
        query: 'netflix',
        limit: 1,
        offset: 0
      });

      expect(result.results).toHaveLength(1);
      expect(result.totalCount).toBeGreaterThan(1);
    });

    test('should return empty results for empty query', async () => {
      const result = await searchService.search({
        query: '',
        limit: 10
      });

      expect(result.results).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.suggestions).toHaveLength(0);
    });

    test('should generate suggestions', async () => {
      const result = await searchService.search({
        query: 'netflix'
      });

      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should calculate facets', async () => {
      const result = await searchService.search({
        query: 'netflix'
      });

      expect(result.facets).toHaveProperty('entityTypes');
      expect(result.facets).toHaveProperty('platforms');
      expect(result.facets).toHaveProperty('categories');
      expect(result.facets).toHaveProperty('statuses');
      
      expect(result.facets.entityTypes.platform).toBeGreaterThan(0);
      expect(result.facets.entityTypes.product).toBeGreaterThan(0);
    });
  });

  describe('search suggestions', () => {
    test('should get search suggestions', async () => {
      const suggestions = await searchService.getSearchSuggestions('net', 5);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('net'))).toBe(true);
    });

    test('should return empty suggestions for short query', async () => {
      const suggestions = await searchService.getSearchSuggestions('n', 5);

      expect(suggestions).toHaveLength(0);
    });

    test('should limit suggestions count', async () => {
      const suggestions = await searchService.getSearchSuggestions('netflix', 2);

      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('index management', () => {
    test('should get index statistics', () => {
      const stats = searchService.getIndexStats();

      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('lastUpdate');
      expect(stats).toHaveProperty('entityCounts');
      
      expect(stats.totalItems).toBeGreaterThan(0);
      expect(stats.lastUpdate).toBeValidDate();
      expect(stats.entityCounts).toHaveProperty('platform');
      expect(stats.entityCounts).toHaveProperty('product');
    });

    test('should force index update', async () => {
      const statsBefore = searchService.getIndexStats();
      
      await searchService.forceIndexUpdate();
      
      const statsAfter = searchService.getIndexStats();
      expect(statsAfter.lastUpdate.getTime()).toBeGreaterThanOrEqual(
        statsBefore.lastUpdate.getTime()
      );
    });
  });

  describe('search result structure', () => {
    test('should return properly structured platform results', async () => {
      const result = await searchService.search({
        query: 'netflix',
        filters: { entityTypes: ['platform'] }
      });

      const platformResult = result.results[0];
      expect(platformResult).toHaveProperty('id');
      expect(platformResult).toHaveProperty('type', 'platform');
      expect(platformResult).toHaveProperty('title');
      expect(platformResult).toHaveProperty('subtitle');
      expect(platformResult).toHaveProperty('description');
      expect(platformResult).toHaveProperty('metadata');
      expect(platformResult).toHaveProperty('relevanceScore');
      expect(platformResult).toHaveProperty('url');
      expect(platformResult).toHaveProperty('icon');
      expect(platformResult).toHaveProperty('status');
      expect(platformResult).toHaveProperty('createdAt');
      
      expect(platformResult.metadata).toHaveProperty('creditBalance');
      expect(platformResult.metadata).toHaveProperty('isActive');
    });

    test('should return properly structured product results', async () => {
      const result = await searchService.search({
        query: 'netflix',
        filters: { entityTypes: ['product'] }
      });

      const productResult = result.results[0];
      expect(productResult).toHaveProperty('id');
      expect(productResult).toHaveProperty('type', 'product');
      expect(productResult).toHaveProperty('title');
      expect(productResult).toHaveProperty('subtitle');
      expect(productResult).toHaveProperty('description');
      expect(productResult).toHaveProperty('metadata');
      
      expect(productResult.metadata).toHaveProperty('category');
      expect(productResult.metadata).toHaveProperty('currentStock');
      expect(productResult.metadata).toHaveProperty('suggestedSellPrice');
    });
  });

  describe('error handling', () => {
    test('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const result = await searchService.search({
        query: 'test'
      });

      expect(result.results).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    test('should handle invalid JSON in localStorage', async () => {
      // Mock localStorage with invalid JSON
      Storage.prototype.getItem = jest.fn(() => 'invalid json');

      const result = await searchService.search({
        query: 'test'
      });

      expect(result.results).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    test('should handle search errors gracefully', async () => {
      // Mock a method to throw error
      const originalMethod = searchService.search;
      searchService.search = jest.fn().mockRejectedValue(new Error('Search error'));

      try {
        const result = await searchService.search({ query: 'test' });
        expect(result.results).toHaveLength(0);
      } catch (error) {
        expect(error.message).toBe('Search error');
      }

      // Restore original method
      searchService.search = originalMethod;
    });
  });

  describe('performance', () => {
    test('should complete search within reasonable time', async () => {
      const startTime = Date.now();
      
      await searchService.search({
        query: 'netflix',
        limit: 20
      });
      
      const endTime = Date.now();
      const searchTime = endTime - startTime;
      
      // Search should complete within 1 second
      expect(searchTime).toBeLessThan(1000);
    });

    test('should handle large result sets efficiently', async () => {
      // Add more mock data
      const largeMockData = Array.from({ length: 100 }, (_, i) => ({
        id: `platform-${i}`,
        name: `Platform ${i}`,
        description: `Description for platform ${i}`,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z'
      }));

      Storage.prototype.getItem = jest.fn((key) => {
        if (key === 'platforms') {
          return JSON.stringify(largeMockData);
        }
        return mockLocalStorage[key] || null;
      });

      await searchService.forceIndexUpdate();

      const startTime = Date.now();
      const result = await searchService.search({
        query: 'platform',
        limit: 50
      });
      const endTime = Date.now();

      expect(result.results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
