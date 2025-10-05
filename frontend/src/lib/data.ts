// Product type definition moved to services
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isNew: boolean;
  isBestseller: boolean;
  isOnSale?: boolean;
  reviews?: any[];
  createdAt?: string;
  updatedAt?: string;
  deliveryInfo: {
    freeShipping: boolean;
    estimatedDays: number;
    expressAvailable: boolean;
    codAvailable: boolean;
  };
}
import { Shirt, Tv, Home, Dumbbell, Book, ToyBrick } from 'lucide-react';

export const sampleProducts: Product[] = [
  {
    id: '1',
    name: "boAt Rockerz 450 Bluetooth Headphones",
    slug: 'boat-rockerz-450-bluetooth-headphones',
    description: "High-quality Bluetooth headphones with great sound quality and noise cancellation",
    price: 1499,
    originalPrice: 2990,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
    category: "Electronics",
    brand: "boAt",
    rating: 4.2,
    reviewCount: 1284,
    stock: 25,
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryInfo: {
      freeShipping: true,
      estimatedDays: 5,
      expressAvailable: true,
      codAvailable: true
    }
  },
  {
    id: '2',
    name: "Fire-Boltt Phoenix Pro Smartwatch",
    slug: 'fire-boltt-phoenix-pro-smartwatch',
    description: "Advanced smartwatch with multiple health tracking features and 7-day battery life",
    price: 1999,
    originalPrice: 7999,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
    category: "Electronics",
    brand: "Fire-Boltt",
    rating: 4.1,
    reviewCount: 8924,
    stock: 15,
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryInfo: {
      freeShipping: true,
      estimatedDays: 4,
      expressAvailable: true,
      codAvailable: true
    }
  },
  {
    id: '3',
    name: "Wildcraft Laptop Backpack",
    slug: 'wildcraft-laptop-backpack',
    description: "Durable laptop backpack perfect for travel and work with anti-theft features",
    price: 899,
    originalPrice: 2175,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"],
    category: "Accessories",
    brand: "Wildcraft",
    rating: 4.3,
    reviewCount: 15647,
    stock: 30,
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryInfo: {
      freeShipping: false,
      estimatedDays: 6,
      expressAvailable: true,
      codAvailable: true
    }
  },
  {
    id: '4',
    name: "Samsung Galaxy S23 Ultra",
    slug: 'samsung-galaxy-s23-ultra',
    description: "Premium smartphone with 200MP camera and S Pen support",
    price: 124999,
    originalPrice: 149999,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop"],
    category: "Electronics",
    brand: "Samsung",
    rating: 4.4,
    reviewCount: 1573,
    stock: 8,
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryInfo: {
      freeShipping: true,
      estimatedDays: 3,
      expressAvailable: true,
      codAvailable: false
    }
  },
  {
    id: '5',
    name: "OnePlus 11 5G",
    slug: 'oneplus-11-5g',
    description: "Flagship smartphone with Snapdragon 8 Gen 2 and 100W fast charging",
    price: 56999,
    originalPrice: 61999,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop"],
    category: "Electronics",
    brand: "OnePlus",
    rating: 4.5,
    reviewCount: 3247,
    stock: 12,
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryInfo: {
      freeShipping: true,
      estimatedDays: 4,
      expressAvailable: true,
      codAvailable: true
    }
  },
  {
    id: '6',
    name: "Realme Narzo 60 Pro",
    slug: 'realme-narzo-60-pro',
    description: "Budget smartphone with 67W fast charging and 108MP camera",
    price: 19999,
    originalPrice: 22999,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop"],
    category: "Electronics",
    brand: "Realme",
    rating: 4.0,
    reviewCount: 5678,
    stock: 45,
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryInfo: {
      freeShipping: false,
      estimatedDays: 5,
      expressAvailable: true,
      codAvailable: true
    }
  }
];

export interface Category {
  name: string;
  icon: React.ElementType;
  count: number;
}

export const categories: Category[] = [
  { name: "Electronics", icon: Tv, count: 1245 },
  { name: "Fashion", icon: Shirt, count: 1189 },
  { name: "Home & Garden", icon: Home, count: 856 },
  { name: "Sports", icon: Dumbbell, count: 534 },
  { name: "Books", icon: Book, count: 298 },
  { name: "Toys", icon: ToyBrick, count: 387 }
];
