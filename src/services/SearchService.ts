import { Platform, DigitalProduct, StockSale, PlatformCreditMovement } from '../types';

export interface SearchResult {
  id: string;
  type: 'platform' | 'product' | 'sale' | 'credit_movement';
  title: string;
  subtitle: string;
  description: string;
  metadata: Record<string, any>;
  relevanceScore: number;
  matchedFields: string[];
  url: string;
  icon: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SearchFilters {
  entityTypes?: ('platform' | 'product' | 'sale' | 'credit_movement')[];
  platformId?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  status?: string;
  category?: string;
  paymentStatus?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'relevance' | 'date' | 'amount' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
  fuzzySearch?: boolean;
  highlightMatches?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  searchTime: number;
  suggestions: string[];
  facets: {
    entityTypes: { [key: string]: number };
    platforms: { [key: string]: number };
    categories: { [key: string]: number };
    statuses: { [key: string]: number };
  };
}

class SearchService {
  private searchIndex: Map<string, any> = new Map();
  private lastIndexUpdate: Date = new Date(0);
  private indexUpdateInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeIndex();
  }

  // Initialize and maintain search index
  private async initializeIndex(): Promise<void> {
    try {
      await this.updateSearchIndex();
      
      // Set up periodic index updates
      setInterval(() => {
        this.updateSearchIndex();
      }, this.indexUpdateInterval);
    } catch (error) {
      console.error('Failed to initialize search index:', error);
    }
  }

  private async updateSearchIndex(): Promise<void> {
    try {
      const now = new Date();
      console.log('Updating search index...');

      // Get all data from localStorage (in production, this would come from API)
      const platforms = this.getPlatformsFromStorage();
      const products = this.getProductsFromStorage();
      const sales = this.getSalesFromStorage();
      const creditMovements = this.getCreditMovementsFromStorage();

      // Clear existing index
      this.searchIndex.clear();

      // Index platforms
      platforms.forEach(platform => {
        this.indexPlatform(platform);
      });

      // Index products
      products.forEach(product => {
        this.indexProduct(product);
      });

      // Index sales
      sales.forEach(sale => {
        this.indexSale(sale);
      });

      // Index credit movements
      creditMovements.forEach(movement => {
        this.indexCreditMovement(movement);
      });

      this.lastIndexUpdate = now;
      console.log(`Search index updated with ${this.searchIndex.size} items`);
    } catch (error) {
      console.error('Failed to update search index:', error);
    }
  }

  private getPlatformsFromStorage(): Platform[] {
    try {
      const stored = localStorage.getItem('platforms');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load platforms from storage:', error);
      return [];
    }
  }

  private getProductsFromStorage(): DigitalProduct[] {
    try {
      const stored = localStorage.getItem('digitalProducts');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load products from storage:', error);
      return [];
    }
  }

  private getSalesFromStorage(): StockSale[] {
    try {
      const stored = localStorage.getItem('stockSales');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load sales from storage:', error);
      return [];
    }
  }

  private getCreditMovementsFromStorage(): PlatformCreditMovement[] {
    try {
      const stored = localStorage.getItem('platformCreditMovements');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load credit movements from storage:', error);
      return [];
    }
  }

  // Index individual entities
  private indexPlatform(platform: Platform): void {
    const searchableText = [
      platform.name,
      platform.description,
      platform.contactName,
      platform.contactEmail,
      platform.contactPhone,
      platform.isActive ? 'active' : 'inactive',
      platform.creditBalance.toString(),
      platform.lowBalanceThreshold.toString()
    ].filter(Boolean).join(' ').toLowerCase();

    this.searchIndex.set(`platform_${platform.id}`, {
      entity: platform,
      type: 'platform',
      searchableText,
      keywords: this.extractKeywords(searchableText)
    });
  }

  private indexProduct(product: DigitalProduct): void {
    const searchableText = [
      product.name,
      product.description,
      product.category,
      product.durationType,
      product.currentStock.toString(),
      product.averagePurchasePrice.toString(),
      product.suggestedSellPrice.toString(),
      product.platformBuyingPrice.toString(),
      product.profitMargin.toString(),
      product.isActive ? 'active' : 'inactive'
    ].filter(Boolean).join(' ').toLowerCase();

    this.searchIndex.set(`product_${product.id}`, {
      entity: product,
      type: 'product',
      searchableText,
      keywords: this.extractKeywords(searchableText)
    });
  }

  private indexSale(sale: StockSale): void {
    const searchableText = [
      sale.productName,
      sale.customerName,
      sale.customerPhone,
      sale.quantity.toString(),
      sale.unitPrice.toString(),
      sale.totalPrice.toString(),
      sale.paymentMethod,
      sale.paymentStatus,
      sale.profit.toString(),
      sale.paymentType,
      sale.subscriptionDuration?.toString()
    ].filter(Boolean).join(' ').toLowerCase();

    this.searchIndex.set(`sale_${sale.id}`, {
      entity: sale,
      type: 'sale',
      searchableText,
      keywords: this.extractKeywords(searchableText)
    });
  }

  private indexCreditMovement(movement: PlatformCreditMovement): void {
    const searchableText = [
      movement.type,
      movement.amount.toString(),
      movement.previousBalance.toString(),
      movement.newBalance.toString(),
      movement.reference,
      movement.description,
      movement.createdBy
    ].filter(Boolean).join(' ').toLowerCase();

    this.searchIndex.set(`movement_${movement.id}`, {
      entity: movement,
      type: 'credit_movement',
      searchableText,
      keywords: this.extractKeywords(searchableText)
    });
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter((word, index, array) => array.indexOf(word) === index);
  }

  // Main search function
  public async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      // Ensure index is up to date
      if (Date.now() - this.lastIndexUpdate.getTime() > this.indexUpdateInterval) {
        await this.updateSearchIndex();
      }

      const {
        query,
        filters = {},
        limit = 20,
        offset = 0,
        includeInactive = false,
        fuzzySearch = true,
        highlightMatches = true
      } = options;

      // Normalize query
      const normalizedQuery = query.toLowerCase().trim();
      const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

      if (queryWords.length === 0) {
        return this.getEmptySearchResponse();
      }

      // Search through index
      const matches: Array<{ item: any; score: number; matchedFields: string[] }> = [];

      for (const [key, indexItem] of this.searchIndex.entries()) {
        const { entity, type, searchableText, keywords } = indexItem;

        // Apply entity type filter
        if (filters.entityTypes && !filters.entityTypes.includes(type)) {
          continue;
        }

        // Apply platform filter
        if (filters.platformId) {
          if (type === 'platform' && entity.id !== filters.platformId) continue;
          if (type === 'product' && entity.platformId !== filters.platformId) continue;
          if (type === 'sale' && entity.platformId !== filters.platformId) continue;
          if (type === 'credit_movement' && entity.platformId !== filters.platformId) continue;
        }

        // Apply date range filter
        if (filters.dateRange) {
          const entityDate = new Date(entity.createdAt || entity.saleDate);
          const startDate = new Date(filters.dateRange.startDate);
          const endDate = new Date(filters.dateRange.endDate);
          
          if (entityDate < startDate || entityDate > endDate) {
            continue;
          }
        }

        // Apply status filters
        if (!this.passesStatusFilters(entity, type, filters, includeInactive)) {
          continue;
        }

        // Calculate relevance score
        const scoreResult = this.calculateRelevanceScore(
          queryWords,
          searchableText,
          keywords,
          entity,
          type,
          fuzzySearch
        );

        if (scoreResult.score > 0) {
          matches.push({
            item: { entity, type },
            score: scoreResult.score,
            matchedFields: scoreResult.matchedFields
          });
        }
      }

      // Sort by relevance or specified criteria
      this.sortMatches(matches, filters.sortBy, filters.sortOrder);

      // Apply pagination
      const paginatedMatches = matches.slice(offset, offset + limit);

      // Convert to search results
      const results = paginatedMatches.map(match => 
        this.convertToSearchResult(match.item, match.score, match.matchedFields, highlightMatches, normalizedQuery)
      );

      // Generate suggestions
      const suggestions = this.generateSuggestions(queryWords, matches);

      // Calculate facets
      const facets = this.calculateFacets(matches);

      const searchTime = Date.now() - startTime;

      return {
        results,
        totalCount: matches.length,
        searchTime,
        suggestions,
        facets
      };

    } catch (error) {
      console.error('Search failed:', error);
      return this.getEmptySearchResponse();
    }
  }

  private passesStatusFilters(entity: any, type: string, filters: SearchFilters, includeInactive: boolean): boolean {
    // Check active status
    if (!includeInactive) {
      if (type === 'platform' && !entity.isActive) return false;
      if (type === 'product' && !entity.isActive) return false;
    }

    // Apply specific status filters
    if (filters.status) {
      if (type === 'sale' && entity.paymentStatus !== filters.status) return false;
      if (type === 'platform' && filters.status === 'active' && !entity.isActive) return false;
      if (type === 'platform' && filters.status === 'inactive' && entity.isActive) return false;
    }

    // Apply category filter
    if (filters.category && type === 'product' && entity.category !== filters.category) {
      return false;
    }

    // Apply payment status filter
    if (filters.paymentStatus && type === 'sale' && entity.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    // Apply amount filters
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      let amount = 0;
      if (type === 'sale') amount = entity.totalPrice;
      if (type === 'credit_movement') amount = Math.abs(entity.amount);
      if (type === 'platform') amount = entity.creditBalance;
      if (type === 'product') amount = entity.suggestedSellPrice;

      if (filters.minAmount !== undefined && amount < filters.minAmount) return false;
      if (filters.maxAmount !== undefined && amount > filters.maxAmount) return false;
    }

    return true;
  }

  private calculateRelevanceScore(
    queryWords: string[],
    searchableText: string,
    keywords: string[],
    entity: any,
    type: string,
    fuzzySearch: boolean
  ): { score: number; matchedFields: string[] } {
    let score = 0;
    const matchedFields: string[] = [];

    for (const word of queryWords) {
      // Exact match in searchable text
      if (searchableText.includes(word)) {
        score += 10;
        matchedFields.push('content');
      }

      // Keyword match
      if (keywords.includes(word)) {
        score += 8;
        matchedFields.push('keywords');
      }

      // Fuzzy matching
      if (fuzzySearch) {
        const fuzzyMatches = keywords.filter(keyword => 
          this.calculateLevenshteinDistance(word, keyword) <= 2
        );
        if (fuzzyMatches.length > 0) {
          score += 3;
          matchedFields.push('fuzzy');
        }
      }

      // Boost score for matches in important fields
      if (type === 'platform' && entity.name.toLowerCase().includes(word)) {
        score += 15;
        matchedFields.push('name');
      }
      if (type === 'product' && entity.name.toLowerCase().includes(word)) {
        score += 15;
        matchedFields.push('name');
      }
      if (type === 'sale' && entity.customerName?.toLowerCase().includes(word)) {
        score += 12;
        matchedFields.push('customer');
      }
    }

    // Boost recent items
    const daysSinceCreation = (Date.now() - new Date(entity.createdAt || entity.saleDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) score += 2;
    if (daysSinceCreation < 1) score += 3;

    return { score, matchedFields: [...new Set(matchedFields)] };
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private sortMatches(
    matches: Array<{ item: any; score: number; matchedFields: string[] }>,
    sortBy: string = 'relevance',
    sortOrder: string = 'desc'
  ): void {
    matches.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.item.entity.createdAt || a.item.entity.saleDate);
          const dateB = new Date(b.item.entity.createdAt || b.item.entity.saleDate);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'amount':
          const amountA = this.getEntityAmount(a.item.entity, a.item.type);
          const amountB = this.getEntityAmount(b.item.entity, b.item.type);
          comparison = amountA - amountB;
          break;
        case 'name':
          const nameA = this.getEntityName(a.item.entity, a.item.type);
          const nameB = this.getEntityName(b.item.entity, b.item.type);
          comparison = nameA.localeCompare(nameB);
          break;
        default: // relevance
          comparison = a.score - b.score;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  private getEntityAmount(entity: any, type: string): number {
    switch (type) {
      case 'sale': return entity.totalPrice || 0;
      case 'credit_movement': return Math.abs(entity.amount || 0);
      case 'platform': return entity.creditBalance || 0;
      case 'product': return entity.suggestedSellPrice || 0;
      default: return 0;
    }
  }

  private getEntityName(entity: any, type: string): string {
    switch (type) {
      case 'platform': return entity.name || '';
      case 'product': return entity.name || '';
      case 'sale': return entity.customerName || entity.productName || '';
      case 'credit_movement': return entity.reference || entity.description || '';
      default: return '';
    }
  }

  private convertToSearchResult(
    item: { entity: any; type: string },
    score: number,
    matchedFields: string[],
    highlightMatches: boolean,
    query: string
  ): SearchResult {
    const { entity, type } = item;

    switch (type) {
      case 'platform':
        return this.createPlatformSearchResult(entity, score, matchedFields);
      case 'product':
        return this.createProductSearchResult(entity, score, matchedFields);
      case 'sale':
        return this.createSaleSearchResult(entity, score, matchedFields);
      case 'credit_movement':
        return this.createCreditMovementSearchResult(entity, score, matchedFields);
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  private createPlatformSearchResult(platform: Platform, score: number, matchedFields: string[]): SearchResult {
    return {
      id: platform.id,
      type: 'platform',
      title: platform.name,
      subtitle: platform.description || 'Platform',
      description: `Balance: ${platform.creditBalance} DZD • Contact: ${platform.contactName || 'N/A'}`,
      metadata: {
        creditBalance: platform.creditBalance,
        lowBalanceThreshold: platform.lowBalanceThreshold,
        contactName: platform.contactName,
        contactEmail: platform.contactEmail,
        isActive: platform.isActive
      },
      relevanceScore: score,
      matchedFields,
      url: `/platforms/${platform.id}`,
      icon: '🏢',
      status: platform.isActive ? 'active' : 'inactive',
      createdAt: platform.createdAt,
      updatedAt: platform.updatedAt
    };
  }

  private createProductSearchResult(product: DigitalProduct, score: number, matchedFields: string[]): SearchResult {
    return {
      id: product.id,
      type: 'product',
      title: product.name,
      subtitle: `${product.category} • ${product.durationType}`,
      description: `Stock: ${product.currentStock} • Price: ${product.suggestedSellPrice} DZD • Margin: ${product.profitMargin}%`,
      metadata: {
        category: product.category,
        durationType: product.durationType,
        currentStock: product.currentStock,
        suggestedSellPrice: product.suggestedSellPrice,
        profitMargin: product.profitMargin,
        platformId: product.platformId,
        isActive: product.isActive
      },
      relevanceScore: score,
      matchedFields,
      url: `/inventory/products/${product.id}`,
      icon: '📦',
      status: product.isActive ? 'active' : 'inactive',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }

  private createSaleSearchResult(sale: StockSale, score: number, matchedFields: string[]): SearchResult {
    return {
      id: sale.id,
      type: 'sale',
      title: `${sale.productName} - ${sale.customerName || 'Customer'}`,
      subtitle: `Sale • ${new Date(sale.saleDate).toLocaleDateString()}`,
      description: `Qty: ${sale.quantity} • Total: ${sale.totalPrice} DZD • Profit: ${sale.profit} DZD • ${sale.paymentStatus}`,
      metadata: {
        productName: sale.productName,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        quantity: sale.quantity,
        totalPrice: sale.totalPrice,
        profit: sale.profit,
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        platformId: sale.platformId
      },
      relevanceScore: score,
      matchedFields,
      url: `/sales/${sale.id}`,
      icon: '💰',
      status: sale.paymentStatus,
      createdAt: sale.saleDate,
      updatedAt: sale.saleDate
    };
  }

  private createCreditMovementSearchResult(movement: PlatformCreditMovement, score: number, matchedFields: string[]): SearchResult {
    const isPositive = movement.amount > 0;
    return {
      id: movement.id,
      type: 'credit_movement',
      title: `${movement.type.replace('_', ' ').toUpperCase()} - ${Math.abs(movement.amount)} DZD`,
      subtitle: `Credit Movement • ${new Date(movement.createdAt).toLocaleDateString()}`,
      description: `${isPositive ? '+' : '-'}${Math.abs(movement.amount)} DZD • Balance: ${movement.newBalance} DZD • ${movement.reference || 'No reference'}`,
      metadata: {
        type: movement.type,
        amount: movement.amount,
        previousBalance: movement.previousBalance,
        newBalance: movement.newBalance,
        reference: movement.reference,
        description: movement.description,
        platformId: movement.platformId,
        createdBy: movement.createdBy
      },
      relevanceScore: score,
      matchedFields,
      url: `/platforms/${movement.platformId}/credits`,
      icon: isPositive ? '💳' : '💸',
      status: movement.type,
      createdAt: movement.createdAt
    };
  }

  private generateSuggestions(queryWords: string[], matches: any[]): string[] {
    const suggestions: Set<string> = new Set();

    // Add common search terms based on matches
    matches.slice(0, 10).forEach(match => {
      const { entity, type } = match.item;
      
      if (type === 'platform') {
        suggestions.add(entity.name);
        if (entity.contactName) suggestions.add(entity.contactName);
      }
      if (type === 'product') {
        suggestions.add(entity.name);
        suggestions.add(entity.category);
      }
      if (type === 'sale') {
        if (entity.customerName) suggestions.add(entity.customerName);
        suggestions.add(entity.productName);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }

  private calculateFacets(matches: any[]): SearchResponse['facets'] {
    const facets = {
      entityTypes: {} as { [key: string]: number },
      platforms: {} as { [key: string]: number },
      categories: {} as { [key: string]: number },
      statuses: {} as { [key: string]: number }
    };

    matches.forEach(match => {
      const { entity, type } = match.item;

      // Entity types
      facets.entityTypes[type] = (facets.entityTypes[type] || 0) + 1;

      // Platforms
      if (entity.platformId) {
        facets.platforms[entity.platformId] = (facets.platforms[entity.platformId] || 0) + 1;
      }

      // Categories
      if (entity.category) {
        facets.categories[entity.category] = (facets.categories[entity.category] || 0) + 1;
      }

      // Statuses
      let status = 'unknown';
      if (type === 'platform') status = entity.isActive ? 'active' : 'inactive';
      if (type === 'product') status = entity.isActive ? 'active' : 'inactive';
      if (type === 'sale') status = entity.paymentStatus;
      if (type === 'credit_movement') status = entity.type;

      facets.statuses[status] = (facets.statuses[status] || 0) + 1;
    });

    return facets;
  }

  private getEmptySearchResponse(): SearchResponse {
    return {
      results: [],
      totalCount: 0,
      searchTime: 0,
      suggestions: [],
      facets: {
        entityTypes: {},
        platforms: {},
        categories: {},
        statuses: {}
      }
    };
  }

  // Public utility methods
  public async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length < 2) return [];

    const suggestions: Set<string> = new Set();

    for (const [key, indexItem] of this.searchIndex.entries()) {
      const { entity, type, keywords } = indexItem;

      // Add matching keywords
      keywords.forEach((keyword: string) => {
        if (keyword.startsWith(normalizedQuery) && keyword !== normalizedQuery) {
          suggestions.add(keyword);
        }
      });

      // Add entity names that match
      const name = this.getEntityName(entity, type);
      if (name.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(name);
      }

      if (suggestions.size >= limit) break;
    }

    return Array.from(suggestions).slice(0, limit);
  }

  public getIndexStats(): { totalItems: number; lastUpdate: Date; entityCounts: { [key: string]: number } } {
    const entityCounts: { [key: string]: number } = {};

    for (const [key, indexItem] of this.searchIndex.entries()) {
      const type = indexItem.type;
      entityCounts[type] = (entityCounts[type] || 0) + 1;
    }

    return {
      totalItems: this.searchIndex.size,
      lastUpdate: this.lastIndexUpdate,
      entityCounts
    };
  }

  public async forceIndexUpdate(): Promise<void> {
    await this.updateSearchIndex();
  }
}

// Export singleton instance
export const searchService = new SearchService();
