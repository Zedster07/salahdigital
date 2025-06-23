import React, { useState, useEffect, useRef } from 'react';
import { searchService } from '../../services/SearchService';
import { GlobalSearch } from './GlobalSearch';
import { Search, Command } from 'lucide-react';

interface SearchHeaderProps {
  onNavigate?: (url: string) => void;
}

export function SearchHeader({ onNavigate }: SearchHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  
  const quickSearchRef = useRef<HTMLDivElement>(null);
  const quickSearchInputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      // Escape to close quick search
      if (e.key === 'Escape' && showQuickSearch) {
        setShowQuickSearch(false);
        setQuickSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQuickSearch]);

  // Handle click outside quick search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickSearchRef.current && !quickSearchRef.current.contains(event.target as Node)) {
        setShowQuickSearch(false);
        setQuickSearchQuery('');
      }
    };

    if (showQuickSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuickSearch]);

  // Focus quick search input when opened
  useEffect(() => {
    if (showQuickSearch && quickSearchInputRef.current) {
      quickSearchInputRef.current.focus();
    }
  }, [showQuickSearch]);

  // Handle quick search input change
  const handleQuickSearchChange = async (value: string) => {
    setQuickSearchQuery(value);
    
    if (value.trim().length >= 2) {
      try {
        const searchSuggestions = await searchService.getSearchSuggestions(value, 5);
        setSuggestions(searchSuggestions);
      } catch (error) {
        console.error('Failed to get search suggestions:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  // Handle quick search submit
  const handleQuickSearchSubmit = (query: string = quickSearchQuery) => {
    if (query.trim()) {
      setShowQuickSearch(false);
      setQuickSearchQuery('');
      setIsSearchOpen(true);
      // The GlobalSearch component will handle the actual search
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleQuickSearchSubmit(suggestion);
  };

  return (
    <>
      {/* Search Button and Quick Search */}
      <div className="relative" ref={quickSearchRef}>
        {/* Search Button */}
        <button
          onClick={() => setShowQuickSearch(!showQuickSearch)}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Search (Ctrl+K)"
        >
          <Search className="h-5 w-5" />
          <span className="hidden md:inline text-sm">Search</span>
          <div className="hidden lg:flex items-center space-x-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </button>

        {/* Quick Search Dropdown */}
        {showQuickSearch && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={quickSearchInputRef}
                  type="text"
                  value={quickSearchQuery}
                  onChange={(e) => handleQuickSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickSearchSubmit();
                    }
                  }}
                  placeholder="Quick search..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                    Suggestions:
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleQuickSearchSubmit()}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <span>Advanced Search</span>
                  <div className="flex items-center space-x-1 text-xs">
                    <span>Enter</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
}

// Search Statistics Component
export function SearchStats() {
  const [stats, setStats] = useState<{
    totalItems: number;
    lastUpdate: Date;
    entityCounts: { [key: string]: number };
  } | null>(null);

  useEffect(() => {
    const loadStats = () => {
      try {
        const searchStats = searchService.getIndexStats();
        setStats(searchStats);
      } catch (error) {
        console.error('Failed to load search stats:', error);
      }
    };

    loadStats();
    
    // Update stats every minute
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Search Index Statistics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalItems}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Items
          </div>
        </div>
        
        {Object.entries(stats.entityCounts).map(([type, count]) => (
          <div key={type} className="text-center">
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {count}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {type.replace('_', ' ')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Last updated: {stats.lastUpdate.toLocaleString()}
      </div>
    </div>
  );
}

// Search Tips Component
export function SearchTips() {
  const tips = [
    {
      title: "Quick Search",
      description: "Press Ctrl+K (or Cmd+K on Mac) to open search from anywhere",
      shortcut: "Ctrl+K"
    },
    {
      title: "Entity Types",
      description: "Filter by platforms, products, sales, or credit movements",
      shortcut: "Use filters"
    },
    {
      title: "Fuzzy Search",
      description: "Search works even with typos and partial matches",
      shortcut: "Auto-enabled"
    },
    {
      title: "Navigation",
      description: "Use arrow keys to navigate results, Enter to select",
      shortcut: "↑↓ Enter"
    },
    {
      title: "Recent Searches",
      description: "Your recent searches are saved for quick access",
      shortcut: "Auto-saved"
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Search Tips
      </h3>
      
      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {index + 1}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {tip.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {tip.description}
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono">
                {tip.shortcut}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
