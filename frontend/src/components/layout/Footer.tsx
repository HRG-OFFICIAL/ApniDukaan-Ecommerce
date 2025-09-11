'use client'

import Link from 'next/link'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Truck,
  RotateCcw,
  Heart
} from 'lucide-react'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { ThemeToggle } from '../ui/ThemeToggle'

const footerLinks = {
  company: {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Blog', href: '/blog' },
      { name: 'Contact', href: '/contact' }
    ]
  },
  customer: {
    title: 'Customer Care',
    links: [
      { name: 'Help Center', href: '/help' },
      { name: 'Track Your Order', href: '/track-order' },
      { name: 'Returns & Refunds', href: '/returns' },
      { name: 'Size Guide', href: '/size-guide' },
      { name: 'Gift Cards', href: '/gift-cards' }
    ]
  },
  policies: {
    title: 'Policies',
    links: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Shipping Policy', href: '/shipping' },
      { name: 'Return Policy', href: '/return-policy' }
    ]
  },
  categories: {
    title: 'Categories',
    links: [
      { name: 'Electronics', href: '/categories/electronics' },
      { name: 'Clothing', href: '/categories/clothing' },
      { name: 'Home & Garden', href: '/categories/home-garden' },
      { name: 'Sports', href: '/categories/sports' },
      { name: 'Books', href: '/categories/books' }
    ]
  }
}

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $50'
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy'
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure checkout'
  },
  {
    icon: Heart,
    title: '24/7 Support',
    description: 'Dedicated support team'
  }
]

const paymentMethods = [
  'Visa', 'Mastercard', 'American Express', 'PayPal', 'Apple Pay', 'Google Pay'
]

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com' }
]

export default function Footer() {
  const { currency } = usePreferencesStore()
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Features Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <div className="h-10 w-10 rounded bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-2xl font-bold text-white">ApniDukaan</span>
            </Link>
            
            <p className="text-gray-400 mb-6 max-w-sm">
              Your ultimate e-commerce destination. Discover amazing products, 
              unbeatable prices, and exceptional service.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-400" />
                <span className="text-sm">123 Commerce St, City, State 12345</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <span className="text-sm">support@apnidukaan.com</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 dark:bg-gray-700 p-2 rounded-full hover:bg-blue-600 transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>

            {/* Theme Toggle */}
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-3">Theme Preference</p>
              <ThemeToggle variant="compact" />
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-4 text-sm">
              Subscribe to get special offers, new arrivals and exclusive deals.
            </p>
            <form className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} ApniDukaan. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Currency: {currency}</span>
                <span>•</span>
                <span>English (US)</span>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 mr-2">We accept:</span>
              <div className="flex items-center space-x-1">
                <CreditCard className="h-6 w-6 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {paymentMethods.join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
