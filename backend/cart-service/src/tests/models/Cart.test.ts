import Cart from '../../models/Cart';
import { createMockCartItem, createMockDiscount } from '../setup';

describe('Cart Model', () => {
  describe('Cart Creation', () => {
    it('should create a new cart with default values', async () => {
      const cart = new Cart({
        userId: 'user123',
        items: [],
        totals: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        },
        currency: 'USD',
        status: 'active'
      });

      await cart.save();

      expect(cart.userId).toBe('user123');
      expect(cart.currency).toBe('USD');
      expect(cart.status).toBe('active');
      expect(cart.items).toHaveLength(0);
      expect(cart.totals.total).toBe(0);
      expect(cart.createdAt).toBeDefined();
      expect(cart.updatedAt).toBeDefined();
    });

    it('should create a session-based cart', async () => {
      const cart = new Cart({
        sessionId: 'session123',
        items: [],
        totals: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        },
        currency: 'USD',
        status: 'active'
      });

      await cart.save();

      expect(cart.sessionId).toBe('session123');
      expect(cart.userId).toBeUndefined();
      expect(cart.expiresAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const cart = new Cart({});

      await expect(cart.save()).rejects.toThrow();
    });

    it('should validate currency enum', async () => {
      const cart = new Cart({
        userId: 'user123',
        currency: 'INVALID',
        items: [],
        totals: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        }
      });

      await expect(cart.save()).rejects.toThrow();
    });
  });

  describe('Virtual Properties', () => {
    let cart: any;

    beforeEach(async () => {
      cart = new Cart({
        userId: 'user123',
        items: [
          createMockCartItem({ quantity: 2, price: 10.00 }),
          createMockCartItem({ 
            productId: '507f1f77bcf86cd799439012',
            quantity: 3, 
            price: 5.00 
          })
        ],
        totals: {
          subtotal: 35.00,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 35.00
        },
        currency: 'USD',
        status: 'active'
      });
      await cart.save();
    });

    it('should calculate item count correctly', () => {
      expect(cart.itemCount).toBe(5); // 2 + 3
    });

    it('should calculate product count correctly', () => {
      expect(cart.productCount).toBe(2);
    });

    it('should calculate total weight correctly', () => {
      const expectedWeight = (0.5 * 2) + (0.5 * 3); // 2.5
      expect(cart.totalWeight).toBe(expectedWeight);
    });

    it('should determine if cart is empty', async () => {
      expect(cart.isEmpty).toBe(false);

      const emptyCart = new Cart({
        userId: 'user456',
        items: [],
        totals: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        },
        currency: 'USD',
        status: 'active'
      });
      await emptyCart.save();

      expect(emptyCart.isEmpty).toBe(true);
    });

    it('should calculate original value correctly', () => {
      // originalPrice is 24.99 for both items
      const expectedValue = (24.99 * 2) + (24.99 * 3);
      expect(cart.originalValue).toBe(expectedValue);
    });
  });

  describe('Instance Methods', () => {
    let cart: any;

    beforeEach(async () => {
      cart = new Cart({
        userId: 'user123',
        items: [],
        totals: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        },
        currency: 'USD',
        status: 'active'
      });
      await cart.save();
    });

    describe('addItem', () => {
      it('should add new item to cart', async () => {
        const item = createMockCartItem();
        await cart.addItem(item);

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].productId).toBe(item.productId);
        expect(cart.items[0].quantity).toBe(item.quantity);
      });

      it('should combine quantities for existing items', async () => {
        const item = createMockCartItem({ quantity: 2 });
        await cart.addItem(item);

        // Add same item again
        const sameItem = createMockCartItem({ quantity: 3 });
        await cart.addItem(sameItem);

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(5);
      });

      it('should treat items with different variants as separate', async () => {
        const item1 = createMockCartItem({ variantId: 'variant1' });
        const item2 = createMockCartItem({ variantId: 'variant2' });

        await cart.addItem(item1);
        await cart.addItem(item2);

        expect(cart.items).toHaveLength(2);
      });
    });

    describe('updateItem', () => {
      beforeEach(async () => {
        const item = createMockCartItem({ quantity: 3 });
        await cart.addItem(item);
      });

      it('should update item quantity', async () => {
        await cart.updateItem('507f1f77bcf86cd799439011', undefined, 5);

        expect(cart.items[0].quantity).toBe(5);
      });

      it('should remove item when quantity is 0', async () => {
        await cart.updateItem('507f1f77bcf86cd799439011', undefined, 0);

        expect(cart.items).toHaveLength(0);
      });

      it('should throw error for non-existent item', async () => {
        await expect(
          cart.updateItem('507f1f77bcf86cd799439999', undefined, 2)
        ).rejects.toThrow('Item not found in cart');
      });
    });

    describe('removeItem', () => {
      beforeEach(async () => {
        const item = createMockCartItem();
        await cart.addItem(item);
      });

      it('should remove item from cart', async () => {
        await cart.removeItem('507f1f77bcf86cd799439011');

        expect(cart.items).toHaveLength(0);
      });

      it('should throw error for non-existent item', async () => {
        await expect(
          cart.removeItem('507f1f77bcf86cd799439999')
        ).rejects.toThrow('Item not found in cart');
      });
    });

    describe('clear', () => {
      beforeEach(async () => {
        const item = createMockCartItem();
        await cart.addItem(item);
        await cart.applyDiscount(createMockDiscount());
      });

      it('should clear all items and discount', async () => {
        await cart.clear();

        expect(cart.items).toHaveLength(0);
        expect(cart.discount).toBeUndefined();
      });
    });

    describe('applyDiscount', () => {
      it('should apply discount to cart', async () => {
        const discount = createMockDiscount();
        await cart.applyDiscount(discount);

        expect(cart.discount).toBeDefined();
        expect(cart.discount.code).toBe('TEST10');
        expect(cart.discount.type).toBe('percentage');
        expect(cart.discount.value).toBe(10);
      });

      it('should throw error if minimum amount not met', async () => {
        const discount = createMockDiscount({ minimumAmount: 50 });
        cart.totals.subtotal = 25;

        await expect(cart.applyDiscount(discount)).rejects.toThrow('Minimum order amount');
      });
    });

    describe('removeDiscount', () => {
      beforeEach(async () => {
        const discount = createMockDiscount();
        await cart.applyDiscount(discount);
      });

      it('should remove discount from cart', async () => {
        await cart.removeDiscount();

        expect(cart.discount).toBeUndefined();
      });
    });
  });

  describe('Total Calculations', () => {
    let cart: any;

    beforeEach(async () => {
      cart = new Cart({
        userId: 'user123',
        items: [
          createMockCartItem({ quantity: 2, price: 10.00 })
        ],
        totals: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        },
        currency: 'USD',
        status: 'active'
      });
    });

    it('should calculate subtotal correctly', async () => {
      await cart.save();

      expect(cart.totals.subtotal).toBe(20.00);
    });

    it('should calculate percentage discount correctly', async () => {
      const discount = createMockDiscount({ 
        type: 'percentage', 
        value: 10 
      });
      await cart.applyDiscount(discount);

      expect(cart.totals.discount).toBe(2.00); // 10% of 20
    });

    it('should calculate fixed discount correctly', async () => {
      const discount = createMockDiscount({ 
        type: 'fixed', 
        value: 5 
      });
      await cart.applyDiscount(discount);

      expect(cart.totals.discount).toBe(5.00);
    });

    it('should not exceed subtotal with fixed discount', async () => {
      const discount = createMockDiscount({ 
        type: 'fixed', 
        value: 50 
      });
      await cart.applyDiscount(discount);

      expect(cart.totals.discount).toBe(20.00); // Limited to subtotal
    });

    it('should calculate tax correctly', async () => {
      // Assuming 8% tax rate from environment
      process.env.TAX_RATE = '0.08';
      await cart.save();

      const expectedTax = (cart.totals.subtotal - cart.totals.discount) * 0.08;
      expect(cart.totals.tax).toBeCloseTo(expectedTax, 2);
    });

    it('should calculate shipping correctly', async () => {
      process.env.FREE_SHIPPING_THRESHOLD = '50';
      process.env.BASE_SHIPPING_COST = '5.99';
      
      await cart.save();

      // Should have shipping cost since subtotal < threshold
      expect(cart.totals.shipping).toBe(5.99);
    });

    it('should apply free shipping for orders above threshold', async () => {
      process.env.FREE_SHIPPING_THRESHOLD = '15';
      
      await cart.save();

      // Should have no shipping cost since subtotal > threshold
      expect(cart.totals.shipping).toBe(0);
    });

    it('should calculate total correctly', async () => {
      await cart.save();

      const expectedTotal = cart.totals.subtotal - cart.totals.discount + 
                          cart.totals.tax + cart.totals.shipping;
      expect(cart.totals.total).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test carts
      await Cart.create({
        userId: 'user123',
        items: [createMockCartItem()],
        totals: { subtotal: 20, discount: 0, tax: 0, shipping: 0, total: 20 },
        currency: 'USD',
        status: 'active'
      });

      await Cart.create({
        sessionId: 'session123',
        items: [createMockCartItem()],
        totals: { subtotal: 15, discount: 0, tax: 0, shipping: 0, total: 15 },
        currency: 'USD',
        status: 'active'
      });

      await Cart.create({
        userId: 'user456',
        items: [createMockCartItem()],
        totals: { subtotal: 25, discount: 0, tax: 0, shipping: 0, total: 25 },
        currency: 'USD',
        status: 'active',
        updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      });
    });

    describe('findActiveCart', () => {
      it('should find cart by user ID', async () => {
        const cart = await Cart.findActiveCart('user123');

        expect(cart).toBeDefined();
        expect(cart!.userId).toBe('user123');
      });

      it('should find cart by session ID', async () => {
        const cart = await Cart.findActiveCart(undefined, 'session123');

        expect(cart).toBeDefined();
        expect(cart!.sessionId).toBe('session123');
      });

      it('should return null if no user or session provided', async () => {
        const cart = await Cart.findActiveCart();

        expect(cart).toBeNull();
      });
    });

    describe('findAbandonedCarts', () => {
      it('should find abandoned carts older than specified hours', async () => {
        const abandonedCarts = await Cart.findAbandonedCarts(24);

        expect(abandonedCarts).toHaveLength(1);
        expect(abandonedCarts[0].userId).toBe('user456');
      });

      it('should not find recently updated carts', async () => {
        const abandonedCarts = await Cart.findAbandonedCarts(1);

        expect(abandonedCarts).toHaveLength(1); // Only the 25-hour old cart
      });
    });

    describe('cleanupExpiredCarts', () => {
      beforeEach(async () => {
        // Create an expired cart
        await Cart.create({
          sessionId: 'expired_session',
          items: [],
          totals: { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 },
          currency: 'USD',
          status: 'expired',
          updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
        });
      });

      it('should clean up expired carts', async () => {
        const result = await Cart.cleanupExpiredCarts();

        expect(result.deletedCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Cart Item Validation', () => {
    it('should enforce maximum items per cart', async () => {
      const cart = new Cart({
        userId: 'user123',
        items: new Array(101).fill(createMockCartItem()), // Exceeds max of 100
        totals: { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 },
        currency: 'USD',
        status: 'active'
      });

      await expect(cart.save()).rejects.toThrow('Cart cannot contain more than 100 items');
    });

    it('should validate item quantity limits', async () => {
      const cart = new Cart({
        userId: 'user123',
        items: [createMockCartItem({ quantity: 1000 })], // Exceeds max of 999
        totals: { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 },
        currency: 'USD',
        status: 'active'
      });

      await expect(cart.save()).rejects.toThrow();
    });

    it('should validate item price is not negative', async () => {
      const cart = new Cart({
        userId: 'user123',
        items: [createMockCartItem({ price: -10 })],
        totals: { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 },
        currency: 'USD',
        status: 'active'
      });

      await expect(cart.save()).rejects.toThrow();
    });
  });
});
