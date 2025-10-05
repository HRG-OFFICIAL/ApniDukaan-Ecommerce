const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}

class CartService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Cart API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getCart(): Promise<Cart> {
    try {
      const response = await this.request<{ success: boolean; data: Cart }>('/api/cart');
      return response.data;
    } catch (error) {
      console.error('Failed to get cart:', error);
      // Return empty cart on error
      return {
        id: '',
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        itemCount: 0
      };
    }
  }

  async addToCart(productId: string, quantity: number = 1): Promise<Cart> {
    try {
      const response = await this.request<{ success: boolean; data: Cart }>('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    try {
      const response = await this.request<{ success: boolean; data: Cart }>(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    }
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    try {
      const response = await this.request<{ success: boolean; data: Cart }>(`/api/cart/items/${itemId}`, {
        method: 'DELETE'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      await this.request('/api/cart/clear', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }

  async applyCoupon(code: string): Promise<{ success: boolean; discount: number; message: string }> {
    try {
      const response = await this.request<{ success: boolean; discount: number; message: string }>('/api/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      return response;
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      throw error;
    }
  }

  async removeCoupon(): Promise<void> {
    try {
      await this.request('/api/cart/coupon', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to remove coupon:', error);
      throw error;
    }
  }

  // Local storage fallback for offline functionality
  private getLocalCart(): Cart {
    try {
      const localCart = localStorage.getItem('cart');
      return localCart ? JSON.parse(localCart) : {
        id: '',
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        itemCount: 0
      };
    } catch (error) {
      console.error('Failed to get local cart:', error);
      return {
        id: '',
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        itemCount: 0
      };
    }
  }

  private setLocalCart(cart: Cart): void {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save local cart:', error);
    }
  }

  // Offline cart operations
  async addToCartOffline(product: Omit<CartItem, 'id'>, quantity: number = 1): Promise<Cart> {
    const cart = this.getLocalCart();
    const existingItem = cart.items.find(item => item.productId === product.productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        ...product,
        id: `local_${Date.now()}_${Math.random()}`,
        quantity
      });
    }
    
    this.calculateCartTotals(cart);
    this.setLocalCart(cart);
    return cart;
  }

  async updateCartItemOffline(itemId: string, quantity: number): Promise<Cart> {
    const cart = this.getLocalCart();
    const item = cart.items.find(item => item.id === itemId);
    
    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(item => item.id !== itemId);
      } else {
        item.quantity = quantity;
      }
    }
    
    this.calculateCartTotals(cart);
    this.setLocalCart(cart);
    return cart;
  }

  async removeFromCartOffline(itemId: string): Promise<Cart> {
    const cart = this.getLocalCart();
    cart.items = cart.items.filter(item => item.id !== itemId);
    this.calculateCartTotals(cart);
    this.setLocalCart(cart);
    return cart;
  }

  async clearCartOffline(): Promise<Cart> {
    const cart = {
      id: '',
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      itemCount: 0
    };
    this.setLocalCart(cart);
    return cart;
  }

  private calculateCartTotals(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.tax = cart.subtotal * 0.18; // 18% GST
    cart.shipping = cart.subtotal > 1000 ? 0 : 50; // Free shipping above ₹1000
    cart.discount = 0; // Will be calculated when coupon is applied
    cart.total = cart.subtotal + cart.tax + cart.shipping - cart.discount;
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

export const cartService = new CartService();
export default cartService;
