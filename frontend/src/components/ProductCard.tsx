'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart } from 'lucide-react'
import { Product } from '../types'
import { useCart } from '../contexts/CartContext'

interface ProductCardProps {
  product: Product;
}

const badgeColors = {
  'Best Seller': 'bg-yellow-400 text-yellow-900',
  'New': 'bg-blue-500 text-white',
  'Sale': 'bg-red-500 text-white',
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAddToCart = () => {
    addItem({
      id: product.id.toString(),
      productId: product.id.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      maxStock: 100
    });
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/product/${product.id}`}>
        <div className="relative">
          <Image
            src={product.image}
            alt={product.name}
            width={400}
            height={400}
            className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
          />
          {product.badge && (
            <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded ${badgeColors[product.badge]}`}>
              {product.badge}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-800 truncate h-10">{product.name}</h3>
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-xs text-gray-600 ml-1">{product.rating} ({product.reviews})</span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <p className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
            <p className="text-sm text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</p>
            <p className="text-xs font-semibold text-green-600">{discount}% off</p>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}
