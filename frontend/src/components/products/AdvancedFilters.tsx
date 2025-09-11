'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, X, Star, Filter } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface PriceRange {
  min: number
  max: number
}

interface FiltersProps {
  onFiltersChange: (filters: any) => void
  activeFilters: any
  isOpen: boolean
  onToggle: () => void
}

const brands: FilterOption[] = [
  { id: 'apple', label: 'Apple', count: 156 },
  { id: 'samsung', label: 'Samsung', count: 89 },
  { id: 'nike', label: 'Nike', count: 234 },
  { id: 'adidas', label: 'Adidas', count: 167 },
  { id: 'sony', label: 'Sony', count: 78 },
  { id: 'lg', label: 'LG', count: 45 },
  { id: 'oneplus', label: 'OnePlus', count: 67 },
  { id: 'xiaomi', label: 'Xiaomi', count: 123 },
  { id: 'techsound', label: 'TechSound', count: 45 },
  { id: 'fittech', label: 'FitTech', count: 67 },
  { id: 'ecowear', label: 'EcoWear', count: 89 },
  { id: 'photopro', label: 'PhotoPro', count: 23 },
  { id: 'comfortseat', label: 'ComfortSeat', count: 34 },
  { id: 'soundwave', label: 'SoundWave', count: 56 }
]

const categories: FilterOption[] = [
  { id: 'electronics', label: 'Electronics', count: 345 },
  { id: 'clothing', label: 'Clothing', count: 567 },
  { id: 'accessories', label: 'Accessories', count: 234 },
  { id: 'home-kitchen', label: 'Home & Kitchen', count: 189 },
  { id: 'sports', label: 'Sports & Fitness', count: 156 },
  { id: 'books', label: 'Books', count: 89 },
  { id: 'beauty', label: 'Beauty & Health', count: 234 },
  { id: 'photography', label: 'Photography', count: 78 },
  { id: 'furniture', label: 'Furniture', count: 123 },
  { id: 'automotive', label: 'Automotive', count: 45 },
  { id: 'toys-games', label: 'Toys & Games', count: 156 },
  { id: 'jewelry', label: 'Jewelry & Watches', count: 89 }
]

export function AdvancedFilters({ onFiltersChange, activeFilters, isOpen, onToggle }: FiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    brands: true,
    price: true,
    rating: true,
    availability: true
  })

  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: activeFilters.priceMin || 0,
    max: activeFilters.priceMax || 10000
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleFilterChange = (filterType: string, value: any) => {
    const newFilters = {
      ...activeFilters,
      [filterType]: value
    }
    onFiltersChange(newFilters)
  }

  const handleMultiSelectFilter = (filterType: string, value: string) => {
    const currentValues = activeFilters[filterType] || []
    let newValues

    if (currentValues.includes(value)) {
      newValues = currentValues.filter((v: string) => v !== value)
    } else {
      newValues = [...currentValues, value]
    }

    handleFilterChange(filterType, newValues)
  }

  const handlePriceRangeChange = () => {
    handleFilterChange('priceMin', priceRange.min)
    handleFilterChange('priceMax', priceRange.max)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    setPriceRange({ min: 0, max: 10000 })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (activeFilters.categories?.length) count += activeFilters.categories.length
    if (activeFilters.brands?.length) count += activeFilters.brands.length
    if (activeFilters.rating) count += 1
    if (activeFilters.priceMin || activeFilters.priceMax) count += 1
    if (activeFilters.availability?.length) count += activeFilters.availability.length
    return count
  }

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string
    sectionKey: string
    children: React.ReactNode 
  }) => (
    <div className="border-b border-gray-200 pb-6">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full py-2 text-left font-semibold text-gray-900 hover:text-blue-600"
      >
        <span>{title}</span>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="mt-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )

  const RatingFilter = () => (
    <div className="space-y-3">
      {[5, 4, 3, 2, 1].map(rating => (
        <label key={rating} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
          <input
            type="radio"
            name="rating"
            value={rating}
            checked={activeFilters.rating === rating}
            onChange={() => handleFilterChange('rating', rating)}
            className="sr-only"
          />
          <div className={`flex items-center space-x-2 ${activeFilters.rating === rating ? 'text-blue-600' : 'text-gray-600'}`}>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm">& up</span>
          </div>
        </label>
      ))}
    </div>
  )

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className="lg:hidden mb-6 w-full"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {getActiveFilterCount() > 0 && (
          <Badge className="ml-2 bg-blue-100 text-blue-800">
            {getActiveFilterCount()}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge className="ml-2 bg-blue-100 text-blue-800">
              {getActiveFilterCount()}
            </Badge>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-800"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {activeFilters.categories?.map((category: string) => (
              <Badge
                key={category}
                variant="secondary"
                className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                onClick={() => handleMultiSelectFilter('categories', category)}
              >
                {categories.find(c => c.id === category)?.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {activeFilters.brands?.map((brand: string) => (
              <Badge
                key={brand}
                variant="secondary"
                className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                onClick={() => handleMultiSelectFilter('brands', brand)}
              >
                {brands.find(b => b.id === brand)?.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {activeFilters.rating && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200"
                onClick={() => handleFilterChange('rating', null)}
              >
                {activeFilters.rating}+ Stars
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Categories */}
        <FilterSection title="Categories" sectionKey="categories">
          <div className="space-y-2">
            {categories.map(category => (
              <label
                key={category.id}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.categories?.includes(category.id) || false}
                    onChange={() => handleMultiSelectFilter('categories', category.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <span className="text-sm text-gray-700">{category.label}</span>
                </div>
                <span className="text-xs text-gray-500">({category.count})</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Brands */}
        <FilterSection title="Brands" sectionKey="brands">
          <div className="space-y-2">
            {brands.map(brand => (
              <label
                key={brand.id}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.brands?.includes(brand.id) || false}
                    onChange={() => handleMultiSelectFilter('brands', brand.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <span className="text-sm text-gray-700">{brand.label}</span>
                </div>
                <span className="text-xs text-gray-500">({brand.count})</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" sectionKey="price">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="10000"
                />
              </div>
            </div>
            <Button
              onClick={handlePriceRangeChange}
              size="sm"
              className="w-full"
            >
              Apply Price Filter
            </Button>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Customer Rating" sectionKey="rating">
          <RatingFilter />
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability" sectionKey="availability">
          <div className="space-y-2">
            {[
              { id: 'in-stock', label: 'In Stock', count: 1234 },
              { id: 'out-of-stock', label: 'Out of Stock', count: 45 },
              { id: 'on-sale', label: 'On Sale', count: 234 },
              { id: 'new-arrivals', label: 'New Arrivals', count: 56 }
            ].map(option => (
              <label
                key={option.id}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={activeFilters.availability?.includes(option.id) || false}
                    onChange={() => handleMultiSelectFilter('availability', option.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </div>
                <span className="text-xs text-gray-500">({option.count})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}
