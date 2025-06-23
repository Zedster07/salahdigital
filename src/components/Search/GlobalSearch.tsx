import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchService, SearchResult, SearchFilters, SearchOptions } from '../../services/SearchService';
import { formatCurrency } from '../../utils/helpers';
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  TrendingUp, 
  ExternalLink,
  ChevronDown,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  Tag,
  Building,
  Package,
  ShoppingCart,
  CreditCard
} from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

export function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<SearchFilters>({
    entityTypes: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (searchQuery.trim().length === 0) {
        setResults([]);
        setSuggestions([]);
        setTotalCount(0);
        setSearchTime(0);
        return;
      }

      setIsLoading(true);
      try {
        const searchOptions: SearchOptions = {
          query: searchQuery,
          filters,
          limit: 20,
          fuzzySearch: true,
          highlightMatches: true
        };

        const response = await searchService.search(searchOptions);
        setResults(response.results);
        setSuggestions(response.suggestions);
        setTotalCount(response.totalCount);
        setSearchTime(response.searchTime);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [filters]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    }

    if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

    // Navigate to result
    if (onNavigate) {
      onNavigate(result.url);
    } else {
      window.location.href = result.url;
    }
    onClose();
  };

  // Handle recent search click
  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    debouncedSearch(recentQuery);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (query.trim()) {
      debouncedSearch(query);
    }
  };

  // Get entity type icon
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'platform': return <Building className="h-4 w-4" />;
      case 'product': return <Package className="h-4 w-4" />;
      case 'sale': return <ShoppingCart className="h-4 w-4" />;
      case 'credit_movement': return <CreditCard className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Search Modal */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-full max-w-4xl mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search platforms, products, sales, and credit movements..."
                  className="w-full pl-10 pr-4 py-3 text-lg border-0 focus:ring-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {isLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Filters"
              >
                <Filter className="h-5 w-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Stats */}
            {(totalCount > 0 || searchTime > 0) && (
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {totalCount > 0 ? `${totalCount} result${totalCount !== 1 ? 's' : ''}` : 'No results'}
                  {searchTime > 0 && ` in ${searchTime}ms`}
                </span>
                {query && (
                  <span className="text-xs">
                    Press ↑↓ to navigate, Enter to select, Esc to close
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Entity Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entity Types
                  </label>
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
                          checked={filters.entityTypes?.includes(value as any) || false}
                          onChange={(e) => {
                            const currentTypes = filters.entityTypes || [];
                            const newTypes = e.target.checked
                              ? [...currentTypes, value as any]
                              : currentTypes.filter(t => t !== value);
                            handleFilterChange({ entityTypes: newTypes });
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Icon className="h-4 w-4 ml-2 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy || 'relevance'}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder || 'desc'}
                    onChange={(e) => handleFilterChange({ sortOrder: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          <div ref={resultsRef} className="max-h-96 overflow-y-auto">
            {query.trim() === '' && recentSearches.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Recent Searches
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(recentQuery)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {recentQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() !== '' && results.length === 0 && !isLoading && (
              <div className="p-8 text-center">
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
                          onClick={() => handleSearchChange(suggestion)}
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

            {results.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`p-4 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          {getEntityIcon(result.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </h3>
                          <div className="flex items-center space-x-2 ml-2">
                            {result.status && (
                              <span className={`text-xs font-medium ${getStatusColor(result.status, result.type)}`}>
                                {result.status}
                              </span>
                            )}
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.subtitle}
                        </p>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {result.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(result.createdAt).toLocaleDateString()}
                            </span>
                            {result.matchedFields.length > 0 && (
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
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Showing {results.length} of {totalCount} results
                </span>
                <span>
                  Use ↑↓ to navigate • Enter to select • Esc to close
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
