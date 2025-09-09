export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  compareAtPrice?: number
  images: string[] | Array<{url: string; alt?: string}>
  category: string | { slug: string; name: string }
  rating: number | { average: number; count: number }
  reviewCount: number
  stock: number
  stockQuantity?: number
  isNew?: boolean
  isBestseller?: boolean
  isOnSale?: boolean
  slug?: string
  brand?: { name: string }
  tags?: string[]
  inStock?: boolean
  variants?: Array<{id: string}>
}

export type Category = {
  name: string;
  icon: React.ElementType;
  count: number;
};
