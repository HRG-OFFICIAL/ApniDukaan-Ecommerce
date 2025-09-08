import { Product, Category } from '../types';
import { Shirt, Tv, Home, Dumbbell, Book, ToyBrick } from 'lucide-react';

export const sampleProducts: Product[] = [
  {
    id: 1,
    name: "boAt Rockerz 450 Bluetooth Headphones",
    price: 1499,
    originalPrice: 2990,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    rating: 4.2,
    reviews: 1284,
    badge: "Best Seller"
  },
  {
    id: 2,
    name: "Fire-Boltt Phoenix Pro Smartwatch",
    price: 1999,
    originalPrice: 7999,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    rating: 4.1,
    reviews: 8924,
    badge: "New"
  },
  {
    id: 3,
    name: "American Tourister Laptop Backpack",
    price: 899,
    originalPrice: 2175,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    rating: 4.3,
    reviews: 15647
  },
  {
    id: 4,
    name: "GoPro HERO11 Black Action Camera",
    price: 37999,
    originalPrice: 54500,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
    rating: 4.4,
    reviews: 1573,
    badge: "Sale"
  }
];

export const categories: Category[] = [
  { name: "Electronics", icon: Tv, count: 245 },
  { name: "Fashion", icon: Shirt, count: 189 },
  { name: "Home & Garden", icon: Home, count: 156 },
  { name: "Sports", icon: Dumbbell, count: 134 },
  { name: "Books", icon: Book, count: 98 },
  { name: "Toys", icon: ToyBrick, count: 87 }
];
