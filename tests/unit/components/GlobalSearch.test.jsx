import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalSearch } from '../../../src/components/Search/GlobalSearch';
import { searchService } from '../../../src/services/SearchService';

// Mock the search service
jest.mock('../../../src/services/SearchService', () => ({
  searchService: {
    search: jest.fn(),
    getSearchSuggestions: jest.fn()
  }
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('GlobalSearch Component', () => {
  const mockOnClose = jest.fn();
  const mockOnNavigate = jest.fn();

  const mockSearchResults = {
    results: [
      {
        id: 'platform-1',
        type: 'platform',
        title: 'Netflix Supplier',
        subtitle: 'Primary Netflix account supplier',
        description: 'Balance: 1500 DZD • Contact: John Smith',
        metadata: {
          creditBalance: 1500,
          isActive: true
        },
        url: '/platforms/platform-1',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        relevanceScore: 15,
        matchedFields: ['name']
      },
      {
        id: 'product-1',
        type: 'product',
        title: 'Netflix Premium 1 Month',
        subtitle: 'iptv • 1month',
        description: 'Stock: 45 • Price: 25 DZD • Margin: 40%',
        metadata: {
          category: 'iptv',
          currentStock: 45,
          suggestedSellPrice: 25
        },
        url: '/products/product-1',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        relevanceScore: 12,
        matchedFields: ['name', 'content']
      }
    ],
    totalCount: 2,
    searchTime: 15,
    suggestions: ['netflix premium', 'netflix basic'],
    facets: {
      entityTypes: { platform: 1, product: 1 },
      platforms: {},
      categories: { iptv: 1 },
      statuses: { active: 2 }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'recentSearches') {
        return JSON.stringify(['netflix', 'spotify']);
      }
      return null;
    });
    Storage.prototype.setItem = jest.fn();
    
    // Default mock implementations
    searchService.search.mockResolvedValue(mockSearchResults);
    searchService.getSearchSuggestions.mockResolvedValue(['netflix', 'netflix premium']);
  });

  describe('Rendering', () => {
    test('should not render when closed', () => {
      render(
        <GlobalSearch 
          isOpen={false} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      expect(screen.queryByPlaceholderText(/search platforms/i)).not.toBeInTheDocument();
    });

    test('should render when open', () => {
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      expect(screen.getByPlaceholderText(/search platforms/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    test('should focus search input when opened', () => {
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      expect(searchInput).toHaveFocus();
    });

    test('should show recent searches when input is empty', () => {
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('netflix')).toBeInTheDocument();
      expect(screen.getByText('spotify')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('should perform search when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      
      await user.type(searchInput, 'netflix');

      // Wait for debounced search
      await waitFor(() => {
        expect(searchService.search).toHaveBeenCalledWith({
          query: 'netflix',
          filters: {
            entityTypes: [],
            sortBy: 'relevance',
            sortOrder: 'desc'
          },
          limit: 20,
          fuzzySearch: true,
          highlightMatches: true
        });
      }, { timeout: 1000 });
    });

    test('should display search results', async () => {
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'netflix');

      await waitFor(() => {
        expect(screen.getByText('Netflix Supplier')).toBeInTheDocument();
        expect(screen.getByText('Netflix Premium 1 Month')).toBeInTheDocument();
      });

      expect(screen.getByText('2 results in 15ms')).toBeInTheDocument();
    });

    test('should show loading state during search', async () => {
      // Mock delayed search
      searchService.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSearchResults), 500))
      );

      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'netflix');

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });

    test('should show no results message', async () => {
      searchService.search.mockResolvedValue({
        results: [],
        totalCount: 0,
        searchTime: 10,
        suggestions: ['netflix', 'spotify'],
        facets: {}
      });

      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText('Did you mean:')).toBeInTheDocument();
        expect(screen.getByText('netflix')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('should close on Escape key', async () => {
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      
      await act(async () => {
        fireEvent.keyDown(searchInput, { key: 'Escape' });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should navigate results with arrow keys', async () => {
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'netflix');

      await waitFor(() => {
        expect(screen.getByText('Netflix Supplier')).toBeInTheDocument();
      });

      // Navigate down
      await act(async () => {
        fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      });

      // First result should be highlighted
      const firstResult = screen.getByText('Netflix Supplier').closest('div');
      expect(firstResult).toHaveClass('bg-blue-50');

      // Navigate down again
      await act(async () => {
        fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      });

      // Second result should be highlighted
      const secondResult = screen.getByText('Netflix Premium 1 Month').closest('div');
      expect(secondResult).toHaveClass('bg-blue-50');
    });

    test('should select result with Enter key', async () => {
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'netflix');

      await waitFor(() => {
        expect(screen.getByText('Netflix Supplier')).toBeInTheDocument();
      });

      // Navigate to first result and select
      await act(async () => {
        fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
      });

      expect(mockOnNavigate).toHaveBeenCalledWith('/platforms/platform-1');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Filters', () => {
    test('should show filters panel when toggled', async () => {
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      
      await act(async () => {
        fireEvent.click(filtersButton);
      });

      expect(screen.getByText('Entity Types')).toBeInTheDocument();
      expect(screen.getByText('Platforms')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
    });

    test('should filter by entity type', async () => {
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Select platform filter
      const platformCheckbox = screen.getByLabelText(/platforms/i);
      await user.click(platformCheckbox);

      // Type search query
      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'netflix');

      await waitFor(() => {
        expect(searchService.search).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              entityTypes: ['platform']
            })
          })
        );
      });
    });

    test('should change sort options', async () => {
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Change sort option
      const sortSelect = screen.getByDisplayValue('Relevance');
      await user.selectOptions(sortSelect, 'date');

      // Type search query
      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'netflix');

      await waitFor(() => {
        expect(searchService.search).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              sortBy: 'date'
            })
          })
        );
      });
    });
  });

  describe('Recent Searches', () => {
    test('should save search to recent searches', async () => {
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'netflix');

      await waitFor(() => {
        expect(screen.getByText('Netflix Supplier')).toBeInTheDocument();
      });

      // Click on result
      const result = screen.getByText('Netflix Supplier');
      await user.click(result);

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        expect.stringContaining('netflix')
      );
    });

    test('should click on recent search', async () => {
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const recentSearch = screen.getByText('netflix');
      await user.click(recentSearch);

      await waitFor(() => {
        expect(searchService.search).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'netflix'
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle search errors gracefully', async () => {
      searchService.search.mockRejectedValue(new Error('Search failed'));
      
      const user = userEvent.setup();
      
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      await user.type(searchInput, 'netflix');

      // Should not crash and should show no results
      await waitFor(() => {
        expect(screen.queryByText('Netflix Supplier')).not.toBeInTheDocument();
      });
    });

    test('should handle localStorage errors', () => {
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        render(
          <GlobalSearch 
            isOpen={true} 
            onClose={mockOnClose} 
            onNavigate={mockOnNavigate} 
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      expect(searchInput).toHaveAttribute('type', 'text');
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(
        <GlobalSearch 
          isOpen={true} 
          onClose={mockOnClose} 
          onNavigate={mockOnNavigate} 
        />
      );

      const searchInput = screen.getByPlaceholderText(/search platforms/i);
      
      // Should be focusable
      expect(searchInput).toHaveFocus();
      
      // Should handle tab navigation
      await act(async () => {
        fireEvent.keyDown(searchInput, { key: 'Tab' });
      });
    });
  });
});
