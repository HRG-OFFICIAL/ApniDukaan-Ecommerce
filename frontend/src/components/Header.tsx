'use client'

import Link from 'next/link'
import { Search, ShoppingCart, User, Menu, X, Store } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useState, useEffect } from 'react'
import MegaMenu from './navigation/MegaMenu'
import CategoryService, { Category } from '../services/categoryService'

export default function Header() {
  const { isAuthenticated, user } = useAuth()
  const { itemCount } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const navLinks = [
    { name: 'Deals', href: '/deals' },
    { name: 'New Arrivals', href: '/new' },
  ];

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryService = CategoryService.getInstance();
        const fetchedCategories = await categoryService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-2xl text-gray-900">ApniDukaan</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-lg mx-auto">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for products, brands and more"
                className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href={isAuthenticated ? "/account" : "/login"} className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <User className="h-6 w-6 mr-1" />
              <span>{isAuthenticated ? `Hi, ${user?.name}` : "Login"}</span>
            </Link>
            <Link href="/cart" className="relative flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mega Menu Navigation */}
      {!isLoading && categories.length > 0 && (
        <div className="hidden lg:block border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MegaMenu categories={categories} />
          </div>
        </div>
      )}
      
      {isMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-4 bg-white">
          {navLinks.map(link => (
            <Link key={link.name} href={link.href} className="block text-gray-700 hover:text-blue-600">{link.name}</Link>
          ))}
          
          {/* Mobile Categories */}
          {!isLoading && categories.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(category => (
                  <Link 
                    key={category._id} 
                    href={`/category/${category.slug}`}
                    className="text-sm text-gray-700 hover:text-blue-600 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-t pt-4 space-y-4">
             <Link href={isAuthenticated ? "/account" : "/login"} className="flex items-center text-gray-700 hover:text-blue-600">
               <User className="h-6 w-6 mr-2" /> {isAuthenticated ? "My Account" : "Login / Sign Up"}
             </Link>
             <Link href="/cart" className="flex items-center text-gray-700 hover:text-blue-600">
               <ShoppingCart className="h-6 w-6 mr-2" /> Cart ({itemCount})
             </Link>
          </div>
        </div>
      )}
    </header>
  );
}
