'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  X, 
  Filter,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand';
  count?: number;
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
}

interface SmartSearchProps {
  placeholder?: string;
  showFilters?: boolean;
  onFiltersToggle?: () => void;
  className?: string;
}

const trendingSearches = [
  'wireless headphones',
  'fitness tracker',
  'laptop stand',
  'smartphone case',
  'bluetooth speaker'
];

const mockSuggestions: SearchSuggestion[] = [
  { id: '1', text: 'Premium Wireless Headphones', type: 'product', count: 245 },
  { id: '2', text: 'Smart Fitness Watch', type: 'product', count: 189 },
  { id: '3', text: 'Electronics', type: 'category', count: 1456 },
  { id: '4', text: 'Apple', type: 'brand', count: 567 },
  { id: '5', text: 'Samsung Galaxy', type: 'product', count: 123 },
  { id: '6', text: 'Nike', type: 'brand', count: 234 },
  { id: '7', text: 'Photography', type: 'category', count: 78 },
];

export default function SmartSearch({ 
  placeholder = "Search for products, brands, categories...", 
  showFilters = false,
  onFiltersToggle,
  className = ""
}: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Handle search suggestions
  useEffect(() => {
    if (query.length > 1) {
      setIsLoading(true);
      // Simulate API delay
      const timer = setTimeout(() => {
        const filtered = mockSuggestions.filter(s => 
          s.text.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered);
        setIsLoading(false);
      }, 200);
      
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsLoading(false);
      return undefined;
    }
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const itemCount = suggestions.length || recentSearches.length || trendingSearches.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < itemCount - 1 ? prev + 1 : -1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : itemCount - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(selectedIndex);
        } else if (query.trim()) {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionSelect = (index: number) => {
    let searchQuery = '';
    
    if (query && suggestions.length > 0) {
      searchQuery = suggestions[index]?.text || '';
    } else if (recentSearches.length > 0 && index < recentSearches.length) {
      searchQuery = recentSearches[index].query;
    } else {
      const trendingIndex = index - recentSearches.length;
      searchQuery = trendingSearches[trendingIndex] || '';
    }
    
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Add to recent searches
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: searchQuery.trim(),
      timestamp: new Date().toISOString()
    };
    
    const updatedRecent = [
      newSearch,
      ...recentSearches.filter(s => s.query !== searchQuery.trim()).slice(0, 4)
    ];
    
    setRecentSearches(updatedRecent);
    localStorage.setItem('recent-searches', JSON.stringify(updatedRecent));
    
    // Navigate to search page
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setQuery(searchQuery.trim());
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  const removeRecentSearch = (id: string) => {
    const updated = recentSearches.filter(s => s.id !== id);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product':
        return <Search className="h-4 w-4 text-gray-400" />;
      case 'category':
        return <Filter className="h-4 w-4 text-blue-500" />;
      case 'brand':
        return <Badge className="h-4 w-4 text-green-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderSuggestionsList = () => {
    if (query && suggestions.length > 0) {
      return (
        <>
          <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
            Search Suggestions
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSearch(suggestion.text)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group ${
                selectedIndex === index ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {getSuggestionIcon(suggestion.type)}
                <span className="text-sm">{suggestion.text}</span>
                <Badge variant="secondary" className="text-xs">
                  {suggestion.type}
                </Badge>
              </div>
              {suggestion.count && (
                <span className="text-xs text-gray-400">
                  {suggestion.count} results
                </span>
              )}
            </button>
          ))}
        </>
      );
    }

    return (
      <>
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <>
            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center justify-between">
              Recent Searches
              <button
                onClick={clearRecentSearches}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                Clear All
              </button>
            </div>
            {recentSearches.map((search, index) => (
              <button
                key={search.id}
                onClick={() => handleSearch(search.query)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group ${
                  selectedIndex === index ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{search.query}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(search.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200"
                >
                  <X className="h-3 w-3 text-gray-500" />
                </button>
              </button>
            ))}
          </>
        )}

        {/* Trending Searches */}
        <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center">
          <TrendingUp className="h-3 w-3 mr-1" />
          Trending Now
        </div>
        {trendingSearches.map((trending, index) => {
          const adjustedIndex = index + recentSearches.length;
          return (
            <button
              key={trending}
              onClick={() => handleSearch(trending)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                selectedIndex === adjustedIndex ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm">{trending}</span>
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder={placeholder}
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFiltersToggle}
              className="mr-2 lg:hidden"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          
          <button
            onClick={() => query.trim() && handleSearch(query)}
            className="p-2 text-blue-600 hover:text-blue-800 mr-2"
            disabled={!query.trim()}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-gray-500">Searching...</span>
              </div>
            </div>
          ) : (
            renderSuggestionsList()
          )}
        </div>
      )}
    </div>
  );
}
