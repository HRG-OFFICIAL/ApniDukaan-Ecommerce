'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dialog, Disclosure, Menu, Transition } from '@headlessui/react'
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon, BellIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../contexts/AuthContext'
import { useCartStore } from '../../contexts/CartContext'
import { cn } from '../../utils/cn'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Categories', href: '/categories' },
  { name: 'Deals', href: '/deals' },
  { name: 'About', href: '/about' },
]

const userNavigation = [
  { name: 'Your Profile', href: '/profile' },
  { name: 'Your Orders', href: '/orders' },
  { name: 'Wishlist', href: '/wishlist' },
  { name: 'Settings', href: '/settings' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { itemCount, toggleCart } = useCartStore()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-primary-600 to-accent-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-xl text-gray-900">ShopSphere</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            {isAuthenticated && (
              <Link href="/wishlist" className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <HeartIcon className="h-6 w-6" />
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && (
              <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors relative">
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            )}

            {/* Shopping Cart */}
            <button
              onClick={toggleCart}
              className="p-2 text-gray-400 hover:text-primary-600 transition-colors relative"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      {user?.avatar ? (
                        <img className="h-8 w-8 rounded-full" src={user.avatar} alt="" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm text-gray-700">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                    </div>
                    {userNavigation.map((item) => (
                      <Menu.Item key={item.name}>
                        {({ active }) => (
                          <Link
                            href={item.href}
                            className={cn(
                              active ? 'bg-gray-100' : '',
                              'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            {item.name}
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={cn(
                            active ? 'bg-gray-100' : '',
                            'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 text-gray-400 hover:text-gray-500"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog as="div" className="md:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-50" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-primary-600 to-accent-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-xl text-gray-900">ShopSphere</span>
            </Link>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500"
              onClick={() => setMobileMenuOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              {/* Mobile Search */}
              <div className="py-6">
                <form onSubmit={handleSearch} className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
              
              {/* Mobile Navigation */}
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {/* Mobile User Actions */}
              <div className="py-6">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-base font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    {userNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-base font-semibold leading-7 text-red-600 hover:bg-gray-50 rounded-md"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/login"
                      className="block px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block px-3 py-2 text-base font-semibold leading-7 text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  )
}

