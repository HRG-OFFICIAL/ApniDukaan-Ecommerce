export type Product = {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: 'Best Seller' | 'New' | 'Sale';
};

export type Category = {
  name: string;
  icon: React.ElementType;
  count: number;
};
