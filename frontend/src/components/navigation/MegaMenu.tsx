'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SubCategory {
  name: string;
  slug: string;
  description: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  children: SubCategory[];
  sortOrder: number;
}

interface MegaMenuProps {
  categories: Category[];
}

const MegaMenu: React.FC<MegaMenuProps> = ({ categories }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mega-menu-container')) {
        setIsOpen(false);
        setActiveCategory(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCategoryHover = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    setIsOpen(true);
  };

  const handleCategoryLeave = () => {
    // Add small delay to prevent flickering
    setTimeout(() => {
      setActiveCategory(null);
      setIsOpen(false);
    }, 100);
  };

  const activeCategoryData = categories.find(cat => cat.slug === activeCategory);

  return (
    <div className="relative mega-menu-container">
      {/* Main Navigation */}
      <nav className="hidden lg:flex space-x-8">
        {categories.map((category) => (
          <div
            key={category._id}
            className="relative"
            onMouseEnter={() => handleCategoryHover(category.slug)}
            onMouseLeave={handleCategoryLeave}
          >
            <Link
              href={`/category/${category.slug}`}
              className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium py-4 transition-colors duration-200"
            >
              <span>{category.name}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium py-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Categories</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {/* Mega Menu Dropdown */}
      {isOpen && activeCategoryData && (
        <div className="absolute top-full left-0 w-screen max-w-6xl bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-2">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {activeCategoryData.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {activeCategoryData.description}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {activeCategoryData.children.map((subCategory, index) => (
                <div key={index} className="space-y-2">
                  <Link
                    href={`/category/${activeCategoryData.slug}/${subCategory.slug}`}
                    className="block text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200"
                  >
                    {subCategory.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {subCategory.description}
                  </p>
                </div>
              ))}
            </div>

            {/* View All Link */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href={`/category/${activeCategoryData.slug}`}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View all {activeCategoryData.name} products
                <ChevronDownIcon className="w-4 h-4 ml-1 rotate-[-90deg]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Categories Menu */}
      {isOpen && !activeCategoryData && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-2">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category._id} className="border-b border-gray-100 last:border-b-0">
                  <Link
                    href={`/category/${category.slug}`}
                    className="block py-3 text-gray-700 hover:text-blue-600 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {category.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MegaMenu;
