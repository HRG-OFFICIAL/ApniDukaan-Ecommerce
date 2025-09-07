'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  HeartIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { SearchBar } from '../common/SearchBar';
import { CartDropdown } from '../cart/CartDropdown';
import { UserMenu } from '../user/UserMenu';
import { MobileMenu } from './MobileMenu';

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const categories = [
    { name: 'Electronics', href: '/category/electronics' },
    { name: 'Fashion', href: '/category/fashion' },
    { name: 'Home & Garden', href: '/category/home-garden' },
    { name: 'Sports', href: '/category/sports' },
    { name: 'Books', href: '/category/books' },
  ];

  return (
    <>
      <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      }`}>
        {/* Top bar */}
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900">ShopSphere</span>
                </Link>
              </div>

              {/* Desktop Search Bar */}
              <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <SearchBar onSearch={handleSearch} placeholder="Search products..." />
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Mobile search button */}
                <button
                  className="md:hidden p-2 text-gray-600 hover:text-blue-600"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <MagnifyingGlassIcon className="h-6 w-6" />
                </button>

                {/* Wishlist */}
                {isAuthenticated && (
                  <Link 
                    href="/wishlist"
                    className="hidden sm:flex p-2 text-gray-600 hover:text-blue-600 relative"
                  >
                    <HeartIcon className="h-6 w-6" />
                  </Link>
                )}

                {/* Cart */}
                <div className="relative">
                  <button
                    className="p-2 text-gray-600 hover:text-blue-600 relative"
                    onClick={() => setIsCartOpen(!isCartOpen)}
                  >
                    <ShoppingBagIcon className="h-6 w-6" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {itemCount > 99 ? '99+' : itemCount}
                      </span>
                    )}
                  </button>
                  <CartDropdown 
                    isOpen={isCartOpen} 
                    onClose={() => setIsCartOpen(false)} 
                  />
                </div>

                {/* User Menu */}
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-6 w-6" />
                      )}
                      <span className="hidden sm:block text-sm font-medium">
                        {user?.firstName}
                      </span>
                    </button>
                    <UserMenu 
                      isOpen={isUserMenuOpen}
                      onClose={() => setIsUserMenuOpen(false)}
                      user={user}
                      onLogout={logout}
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/auth/login"
                      className="text-sm font-medium text-gray-600 hover:text-blue-600"
                    >
                      Sign In
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href="/auth/register"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 text-gray-600 hover:text-blue-600"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="hidden md:block bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8 h-12 overflow-x-auto">
              <Link
                href="/products"
                className="text-sm font-medium text-gray-900 hover:text-blue-600 whitespace-nowrap"
              >
                All Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 whitespace-nowrap"
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/deals"
                className="text-sm font-medium text-red-600 hover:text-red-700 whitespace-nowrap"
              >
                Today's Deals
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Search</h2>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-2 text-gray-600 hover:text-blue-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-4">
            <SearchBar 
              onSearch={(query) => {
                handleSearch(query);
                setIsSearchOpen(false);
              }}
              placeholder="Search products..."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={logout}
      />
    </>
  );
}
