import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchService, SearchResult, SearchFilters } from '../../services/SearchService';
import { formatCurrency } from '../../utils/helpers';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  DollarSign, 
  Tag, 
  Building, 
  Package, 
  ShoppingCart, 
  CreditCard,
  ExternalLink,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [facets, setFacets] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const entityTypes = searchParams.get('types')?.split(',') || [];
  const platformId = searchParams.get('platform');
  const sortBy = searchParams.get('sort') || 'relevance';
  const sortOrder = searchParams.get('order') || 'desc';
  const limit = 20;

  // Load search results
  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setResults([]);
      setTotalCount(0);
      setSearchTime(0);
      setSuggestions([]);
      setFacets({});
    }
  }, [searchParams]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const filters: SearchFilters = {
        entityTypes: entityTypes.length > 0 ? entityTypes as any : undefined,
        platformId: platformId || undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      };

      const response = await searchService.search({
        query,
        filters,
        limit,
        offset: (currentPage - 1) * limit,
        fuzzySearch: true,
        highlightMatches: true
      });

      setResults(response.results);
      setTotalCount(response.totalCount);
      setSearchTime(response.searchTime);
      setSuggestions(response.suggestions);
      setFacets(response.facets);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Update search parameters
  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    setSearchParams(newParams);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleEntityTypeFilter = (type: string, checked: boolean) => {
    const currentTypes = entityTypes.filter(t => t);
    const newTypes = checked 
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    updateSearchParams({
      types: newTypes.length > 0 ? newTypes.join(',') : null
    });
  };

  const handleSortChange = (newSortBy: string) => {
    updateSearchParams({ sort: newSortBy });
  };

  const handleSortOrderChange = () => {
    updateSearchParams({ order: sortOrder === 'asc' ? 'desc' : 'asc' });
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  // Get entity type icon
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'platform': return <Building className="h-5 w-5" />;
      case 'product': return <Package className="h-5 w-5" />;
      case 'sale': return <ShoppingCart className="h-5 w-5" />;
      case 'credit_movement': return <CreditCard className="h-5 w-5" />;
      default: return <Search className="h-5 w-5" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string, type: string) => {
    if (type === 'platform' || type === 'product') {
      return status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400';
    }
    if (type === 'sale') {
      switch (status) {
        case 'paid': return 'text-green-600 dark:text-green-400';
        case 'pending': return 'text-yellow-600 dark:text-yellow-400';
        case 'partial': return 'text-orange-600 dark:text-orange-400';
        default: return 'text-gray-500 dark:text-gray-400';
      }
    }
    return 'text-gray-500 dark:text-gray-400';
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Search Results
              </h1>
              {query && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                  Results for "<span className="font-medium">{query}</span>"
                </p>
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border border-gray-300 dark:border-gray-600`}
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Search Stats */}
          {(totalCount > 0 || searchTime > 0) && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>
                {totalCount > 0 ? `${totalCount.toLocaleString()} result${totalCount !== 1 ? 's' : ''}` : 'No results'}
                {searchTime > 0 && ` found in ${searchTime}ms`}
              </span>
              
              {/* Sort Controls */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="name">Name</option>
                  </select>
                  
                  <button
                    onClick={handleSortOrderChange}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Filters
                </h3>

                {/* Entity Types */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Entity Types
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'platform', label: 'Platforms', icon: Building },
                      { value: 'product', label: 'Products', icon: Package },
                      { value: 'sale', label: 'Sales', icon: ShoppingCart },
                      { value: 'credit_movement', label: 'Credit Movements', icon: CreditCard }
                    ].map(({ value, label, icon: Icon }) => (
                      <label key={value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={entityTypes.includes(value)}
                          onChange={(e) => handleEntityTypeFilter(value, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Icon className="h-4 w-4 ml-2 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        {facets.entityTypes?.[value] && (
                          <span className="ml-auto text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {facets.entityTypes[value]}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Facets */}
                {Object.keys(facets.statuses || {}).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Status
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(facets.statuses).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {status.replace('_', ' ')}
                          </span>
                          <span className="text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-3" />
                <span className="text-gray-600 dark:text-gray-400">Searching...</span>
              </div>
            )}

            {/* No Results */}
            {!isLoading && query && results.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Try adjusting your search terms or filters
                </p>
                {suggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Did you mean:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => updateSearchParams({ q: suggestion })}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results List */}
            {!isLoading && results.length > 0 && (
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          {getEntityIcon(result.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </h3>
                          <div className="flex items-center space-x-2 ml-4">
                            {result.status && (
                              <span className={`text-sm font-medium ${getStatusColor(result.status, result.type)}`}>
                                {result.status}
                              </span>
                            )}
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.subtitle}
                        </p>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          {result.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(result.createdAt).toLocaleDateString()}
                            </span>
                            {result.matchedFields && result.matchedFields.length > 0 && (
                              <span className="flex items-center">
                                <Tag className="h-3 w-3 mr-1" />
                                Matched: {result.matchedFields.join(', ')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-400">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {result.relevanceScore.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} results
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
