import { Product } from '../graphql/types';
import { Shirt, Tv, Home, Dumbbell, Book, ToyBrick } from 'lucide-react';

export const sampleProducts: Product[] = [
  {
    id: '1',
    name: "boAt Rockerz 450 Bluetooth Headphones",
    description: "High-quality Bluetooth headphones with great sound quality and noise cancellation",
    price: 1499,
    originalPrice: 2990,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
    category: "Electronics",
    rating: 4.2,
    reviewCount: 1284,
    stock: 25,
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: "Fire-Boltt Phoenix Pro Smartwatch",
    description: "Advanced smartwatch with multiple health tracking features and 7-day battery life",
    price: 1999,
    originalPrice: 7999,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
    category: "Electronics",
    rating: 4.1,
    reviewCount: 8924,
    stock: 15,
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: "Wildcraft Laptop Backpack",
    description: "Durable laptop backpack perfect for travel and work with anti-theft features",
    price: 899,
    originalPrice: 2175,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"],
    category: "Accessories",
    rating: 4.3,
    reviewCount: 15647,
    stock: 30,
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: "Samsung Galaxy S23 Ultra",
    description: "Premium smartphone with 200MP camera and S Pen support",
    price: 124999,
    originalPrice: 149999,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop"],
    category: "Electronics",
    rating: 4.4,
    reviewCount: 1573,
    stock: 8,
    isBestseller: false,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: "OnePlus 11 5G",
    description: "Flagship smartphone with Snapdragon 8 Gen 2 and 100W fast charging",
    price: 56999,
    originalPrice: 61999,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop"],
    category: "Electronics",
    rating: 4.5,
    reviewCount: 3247,
    stock: 12,
    isBestseller: true,
    isOnSale: true,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    name: "Realme Narzo 60 Pro",
    description: "Budget smartphone with 67W fast charging and 108MP camera",
    price: 19999,
    originalPrice: 22999,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop"],
    category: "Electronics",
    rating: 4.0,
    reviewCount: 5678,
    stock: 45,
    isBestseller: false,
    isOnSale: true,
    isNew: true,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
