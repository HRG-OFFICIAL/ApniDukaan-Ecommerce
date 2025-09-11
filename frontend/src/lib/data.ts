import { Product } from '../graphql/types';
import { Shirt, Tv, Home, Dumbbell, Book, ToyBrick } from 'lucide-react';

export const sampleProducts: Product[] = [
  {
    id: '1',
    name: "boAt Rockerz 450 Bluetooth Headphones",
    description: "High-quality Bluetooth headphones with great sound quality",
    price: 1499,
    originalPrice: 2990,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
    category: "Electronics",
    rating: 4.2,
    reviewCount: 1284,
    stock: 25,
    isBestseller: true,
    isOnSale: false,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: "Fire-Boltt Phoenix Pro Smartwatch",
    description: "Advanced smartwatch with multiple health tracking features",
    price: 1999,
    originalPrice: 7999,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
    category: "Electronics",
    rating: 4.1,
    reviewCount: 8924,
    stock: 15,
    isBestseller: false,
    isOnSale: false,
    isNew: true,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: "American Tourister Laptop Backpack",
    description: "Durable laptop backpack perfect for travel and work",
    price: 899,
    originalPrice: 2175,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"],
    category: "Accessories",
    rating: 4.3,
    reviewCount: 15647,
    stock: 30,
    isBestseller: false,
    isOnSale: false,
    isNew: false,
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: "GoPro HERO11 Black Action Camera",
    description: "Professional action camera for capturing amazing adventures",
    price: 37999,
    originalPrice: 54500,
    images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop"],
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
  }
];

export interface Category {
  name: string;
  icon: React.ElementType;
  count: number;
}

export const categories: Category[] = [
  { name: "Electronics", icon: Tv, count: 245 },
  { name: "Fashion", icon: Shirt, count: 189 },
  { name: "Home & Garden", icon: Home, count: 156 },
  { name: "Sports", icon: Dumbbell, count: 134 },
  { name: "Books", icon: Book, count: 98 },
  { name: "Toys", icon: ToyBrick, count: 87 }
];
