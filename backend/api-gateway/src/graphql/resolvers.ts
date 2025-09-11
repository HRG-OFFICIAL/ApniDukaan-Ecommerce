import type { IResolvers } from '@graphql-tools/utils';

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4001';
const USER_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4003';

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}: ${text}`);
  }
  return res.json();
}

export const resolvers: IResolvers = {
  Query: {
    // Map to REST: GET /api/products
    async products(_parent, args) {
      const page = 1;
      const limit = args.limit ?? 20;
      const data = await getJson(`${CATALOG_URL}/api/products?page=${page}&limit=${limit}`);
      return { products: data.data, totalCount: data.pagination?.total ?? data.data?.length ?? 0 };
    },
    // Map to REST: GET /api/products/:id
    async product(_parent, { id }) {
      try {
        const data = await getJson(`${CATALOG_URL}/api/products/${id}`);
        return data.data ?? data;
      } catch (e) {
        return null;
      }
    },
    // Simple stubs for now
    async categories() {
      // If categories endpoint exists, map it; else return empty for now
      try {
        const data = await getJson(`${CATALOG_URL}/api/categories`);
        return data.data ?? data;
      } catch {
        return [];
      }
    },
    me() {
      return null;
    },
    myOrders() {
      return [];
    },
    order() {
      return null;
    },
    cart() {
      return null;
    },
    wishlist() {
      return [];
    },
    orders() {
      return [];
    },
    users() {
      return [];
    },
    dashboardStats() {
      return { totalOrders: 0, totalRevenue: 0, totalUsers: 0, totalProducts: 0, recentOrders: [], topProducts: [] };
    },
  },
  Mutation: {
    // Auth stubs
    async login() { throw new Error('Not implemented'); },
    async register() { throw new Error('Not implemented'); },
    async logout() { return true; },
    async refreshToken() { throw new Error('Not implemented'); },
    async forgotPassword() { return true; },
    async resetPassword() { return true; },
    async verifyEmail() { return true; },

    // Profile stubs
    async updateProfile() { throw new Error('Not implemented'); },
    async addAddress() { throw new Error('Not implemented'); },
    async updateAddress() { throw new Error('Not implemented'); },
    async deleteAddress() { return true; },

    // Cart stubs
    async addToCart() { throw new Error('Not implemented'); },
    async updateCartItem() { throw new Error('Not implemented'); },
    async removeFromCart() { throw new Error('Not implemented'); },
    async clearCart() { return true; },

    // Wishlist stubs
    async addToWishlist() { throw new Error('Not implemented'); },
    async removeFromWishlist() { return true; },

    // Order stubs
    async createOrder() { throw new Error('Not implemented'); },
    async cancelOrder() { throw new Error('Not implemented'); },

    // Payment stubs
    async createPaymentIntent() { throw new Error('Not implemented'); },
    async confirmPayment() { throw new Error('Not implemented'); },

    // Review stubs
    async createReview() { throw new Error('Not implemented'); },
    async updateReview() { throw new Error('Not implemented'); },
    async deleteReview() { return true; },

    // Admin stubs
    async updateOrderStatus() { throw new Error('Not implemented'); },
    async createProduct() { throw new Error('Not implemented'); },
    async updateProduct() { throw new Error('Not implemented'); },
    async deleteProduct() { return true; },
    async updateUserRole() { throw new Error('Not implemented'); },
  },
};

