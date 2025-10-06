'use client'

import React, { useState, useEffect } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { 
  Shirt, 
  Smartphone, 
  Home, 
  Gamepad2, 
  Sparkles, 
  Dumbbell, 
  Baby, 
  Dog,
  Grid3X3,
  ChevronRight,
  Search
} from 'lucide-react'
import Link from 'next/link'

// Same category groups as navbar
const categoryGroups = [
  {
    title: 'Fashion & Clothing',
    icon: <Shirt className="h-6 w-6 text-gray-700" />,
    subcategories: [
      {
        title: 'Women\'s Fashion',
        items: [
          { name: 'Women\'s Clothing', count: 2683, href: '/products?category=womens-clothing' },
          { name: 'Women\'s Shoes', count: 2410, href: '/products?category=womens-shoes' },
          { name: 'Women\'s Handbags', count: 2930, href: '/products?category=womens-handbags' },
          { name: 'Women\'s Jewelry', count: 2623, href: '/products?category=womens-jewelry' },
          { name: 'Women\'s Accessories', count: 2147, href: '/products?category=womens-accessories' },
          { name: 'Women\'s Watches', count: 1009, href: '/products?category=womens-watches' }
        ]
      },
      {
        title: 'Men\'s Fashion',
        items: [
          { name: 'Men\'s Clothing', count: 2816, href: '/products?category=mens-clothing' },
          { name: 'Men\'s Shoes', count: 3057, href: '/products?category=mens-shoes' },
          { name: 'Men\'s Accessories', count: 2727, href: '/products?category=mens-accessories' },
          { name: 'Men\'s Watches', count: 1980, href: '/products?category=mens-watches' }
        ]
      },
      {
        title: 'Kids\' Fashion',
        items: [
          { name: 'Girls\' Clothing', count: 4412, href: '/products?category=girls-clothing' },
          { name: 'Boys\' Clothing', count: 3804, href: '/products?category=boys-clothing' },
          { name: 'Girls\' Shoes', count: 1687, href: '/products?category=girls-shoes' },
          { name: 'Boys\' Shoes', count: 922, href: '/products?category=boys-shoes' },
          { name: 'Girls\' Jewelry', count: 2856, href: '/products?category=girls-jewelry' },
          { name: 'Boys\' Jewelry', count: 1676, href: '/products?category=boys-jewelry' }
        ]
      }
    ]
  },
  {
    title: 'Electronics & Technology',
    icon: <Smartphone className="h-6 w-6 text-gray-700" />,
    subcategories: [
      {
        title: 'Computers & Tablets',
        items: [
          { name: 'Computers & Tablets', count: 1290, href: '/products?category=computers-tablets' },
          { name: 'Computers', count: 1143, href: '/products?category=computers' },
          { name: 'Computer Components', count: 1302, href: '/products?category=computer-components' },
          { name: 'Computer Monitors', count: 553, href: '/products?category=computer-monitors' },
          { name: 'Laptop Accessories', count: 1043, href: '/products?category=laptop-accessories' }
        ]
      },
      {
        title: 'Mobile & Accessories',
        items: [
          { name: 'Cell Phones & Accessories', count: 531, href: '/products?category=cell-phones' },
          { name: 'Tablet Accessories', count: 1306, href: '/products?category=tablet-accessories' },
          { name: 'Wearable Technology', count: 1248, href: '/products?category=wearable-tech' }
        ]
      },
      {
        title: 'Audio & Video',
        items: [
          { name: 'Headphones & Earbuds', count: 1425, href: '/products?category=headphones' },
          { name: 'Home Audio & Theater Products', count: 744, href: '/products?category=home-audio' },
          { name: 'Televisions & Video Products', count: 1361, href: '/products?category=tv-video' },
          { name: 'Camera & Photo', count: 952, href: '/products?category=camera-photo' }
        ]
      },
      {
        title: 'Gaming',
        items: [
          { name: 'Video Games', count: 819, href: '/products?category=video-games' },
          { name: 'PlayStation 5 Consoles, Games & Accessories', count: 792, href: '/products?category=playstation-5' },
          { name: 'Nintendo Switch Consoles, Games & Accessories', count: 889, href: '/products?category=nintendo-switch' },
          { name: 'Xbox Series X & S Consoles, Games & Accessories', count: 871, href: '/products?category=xbox-series' }
        ]
      }
    ]
  },
  {
    title: 'Home & Garden',
    icon: <Home className="h-6 w-6 text-gray-700" />,
    subcategories: [
      {
        title: 'Furniture & Decor',
        items: [
          { name: 'Furniture', count: 899, href: '/products?category=furniture' },
          { name: 'Home Décor Products', count: 1263, href: '/products?category=home-decor' },
          { name: 'Wall Art', count: 1315, href: '/products?category=wall-art' },
          { name: 'Seasonal Décor', count: 1359, href: '/products?category=seasonal-decor' },
          { name: 'Lighting & Ceiling Fans', count: 1311, href: '/products?category=lighting' }
        ]
      },
      {
        title: 'Kitchen & Dining',
        items: [
          { name: 'Kitchen & Dining', count: 753, href: '/products?category=kitchen-dining' },
          { name: 'Home Appliances', count: 1081, href: '/products?category=home-appliances' },
          { name: 'Vacuum Cleaners & Floor Care', count: 1278, href: '/products?category=vacuum-cleaners' }
        ]
      },
      {
        title: 'Bedding & Bath',
        items: [
          { name: 'Bedding', count: 1286, href: '/products?category=bedding' },
          { name: 'Bath Products', count: 1326, href: '/products?category=bath-products' }
        ]
      }
    ]
  },
  {
    title: 'Toys & Games',
    icon: <Gamepad2 className="h-6 w-6 text-gray-700" />,
    subcategories: [
      {
        title: 'Kids\' Toys',
        items: [
          { name: 'Toys & Games', count: 3215, href: '/products?category=toys-games' },
          { name: 'Baby & Toddler Toys', count: 1391, href: '/products?category=baby-toddler-toys' },
          { name: 'Dolls & Accessories', count: 1160, href: '/products?category=dolls' },
          { name: 'Stuffed Animals & Plush Toys', count: 833, href: '/products?category=stuffed-animals' }
        ]
      },
      {
        title: 'Educational & Learning',
        items: [
          { name: 'Learning & Education Toys', count: 551, href: '/products?category=learning-toys' },
          { name: 'Puzzles', count: 1108, href: '/products?category=puzzles' },
          { name: 'Building Toys', count: 987, href: '/products?category=building-toys' }
        ]
      }
    ]
  },
  {
    title: 'Beauty & Personal Care',
    icon: <Sparkles className="h-6 w-6 text-gray-700" />,
    subcategories: [
      {
        title: 'Beauty & Cosmetics',
        items: [
          { name: 'Makeup', count: 1296, href: '/products?category=makeup' },
          { name: 'Skin Care Products', count: 1245, href: '/products?category=skin-care' },
          { name: 'Hair Care Products', count: 1337, href: '/products?category=hair-care' },
          { name: 'Beauty Tools & Accessories', count: 938, href: '/products?category=beauty-tools' }
        ]
      },
      {
        title: 'Personal Care',
        items: [
          { name: 'Shaving & Hair Removal Products', count: 1176, href: '/products?category=shaving' },
          { name: 'Oral Care Products', count: 621, href: '/products?category=oral-care' },
          { name: 'Foot, Hand & Nail Care Products', count: 1471, href: '/products?category=foot-hand-nail' }
        ]
      }
    ]
  },
  {
    title: 'Sports & Outdoors',
    icon: <Dumbbell className="h-6 w-6 text-gray-700" />,
    subcategories: [
      {
        title: 'Sports & Fitness',
        items: [
          { name: 'Sports & Fitness', count: 1028, href: '/products?category=sports-fitness' },
          { name: 'Sports Nutrition Products', count: 682, href: '/products?category=sports-nutrition' },
          { name: 'Outdoor Recreation', count: 548, href: '/products?category=outdoor-recreation' }
        ]
      },
      {
        title: 'Automotive',
        items: [
          { name: 'Automotive Performance Parts & Accessories', count: 1453, href: '/products?category=auto-performance' },
          { name: 'Automotive Tires & Wheels', count: 1449, href: '/products?category=auto-tires' },
          { name: 'Car Care', count: 1336, href: '/products?category=car-care' }
        ]
      }
    ]
  },
  {
    title: 'Baby & Kids',
    icon: <Baby className="h-6 w-6 text-gray-700" />,
    subcategories: [
      {
        title: 'Baby Clothing',
        items: [
          { name: 'Baby Boys\' Clothing & Shoes', count: 1366, href: '/products?category=baby-boys-clothing' },
          { name: 'Baby Girls\' Clothing & Shoes', count: 504, href: '/products?category=baby-girls-clothing' }
        ]
      },
      {
        title: 'Baby Care',
        items: [
          { name: 'Baby Care Products', count: 1030, href: '/products?category=baby-care' },
          { name: 'Baby & Toddler Feeding Supplies', count: 1180, href: '/products?category=baby-feeding' },
          { name: 'Baby Safety Products', count: 720, href: '/products?category=baby-safety' }
        ]
      }
    ]
  },
  {
    title: 'Pets & Animals',
    icon: <Dog className="h-6 w-6 text-gray-700" />,
    subcategories: [
      {
        title: 'Pet Supplies',
        items: [
          { name: 'Dog Supplies', count: 1284, href: '/products?category=dog-supplies' },
          { name: 'Cat Supplies', count: 1380, href: '/products?category=cat-supplies' },
          { name: 'Fish & Aquatic Pets', count: 1094, href: '/products?category=fish-aquatic' },
          { name: 'Small Animal Supplies', count: 927, href: '/products?category=small-animals' }
        ]
      }
    ]
  }
]

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCategories, setFilteredCategories] = useState(categoryGroups)

  // Filter categories based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categoryGroups)
      return
    }

    const filtered = categoryGroups.map(group => ({
      ...group,
      subcategories: group.subcategories.map(subcategory => ({
        ...subcategory,
        items: subcategory.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subcategory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(subcategory => subcategory.items.length > 0)
    })).filter(group => group.subcategories.length > 0)

    setFilteredCategories(filtered)
  }, [searchQuery])

  return (
    <MainLayout pageTitle="Categories" className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Shop by Category</h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                Discover products organized by your interests
              </p>
            </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

          {/* Featured Categories */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Featured Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categoryGroups.slice(0, 8).map((group) => (
                <Link
                key={group.title}
                href={`#${group.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                {group.icon}
                <span className="text-xs font-medium text-gray-700 mt-2 text-center leading-tight">
                  {group.title}
                </span>
                </Link>
              ))}
            </div>
        </div>

        {/* All Categories */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">All Categories</h2>
          <div className="space-y-8">
            {filteredCategories.map((group) => (
              <div key={group.title} id={group.title.toLowerCase().replace(/\s+/g, '-')} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  {group.icon}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">{group.title}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.subcategories.map((subcategory, index) => (
                    <div key={subcategory.title} className="relative">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 text-center">{subcategory.title}</h4>
                      <ul className="space-y-2">
                        {subcategory.items.map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className="flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 transition-colors group py-1 px-2 rounded hover:bg-blue-50"
                            >
                              <span className="group-hover:text-blue-600 font-medium">{item.name}</span>
                              <span className="text-xs text-gray-400">({item.count})</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {/* Light separator */}
                      {index < group.subcategories.length - 1 && (
                        <div className="hidden lg:block absolute top-0 right-0 w-px h-full bg-gray-200"></div>
                      )}
                    </div>
                  ))}
                    </div>
                  </div>
              ))}
            </div>
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}