import mongoose, { Schema, Model } from 'mongoose';
import { ICart, ICartItem, ICartDiscount, ICartTotals, ICartModel } from '../types/cart.types';

// Cart Item Schema
const CartItemSchema = new Schema<ICartItem>({
  productId: {
    type: String,
    required: true
  },
  variantId: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [999, 'Quantity cannot exceed 999']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    required: true,
    min: [0, 'Original price cannot be negative']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  image: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  attributes: {
    type: Map,
    of: String,
    default: new Map()
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false,
  toJSON: {
    transform: (doc, ret) => {
      if (ret.attributes instanceof Map) {
        ret.attributes = Object.fromEntries(ret.attributes);
      }
      return ret;
    }
  }
});

// Cart Discount Schema
const CartDiscountSchema = new Schema<ICartDiscount>({
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: [0, 'Discount value cannot be negative']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Discount description cannot exceed 200 characters']
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  minimumAmount: {
    type: Number,
    min: [0, 'Minimum amount cannot be negative']
  },
  maximumDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  }
}, { _id: false });

// Cart Totals Schema
const CartTotalsSchema = new Schema<ICartTotals>({
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
    default: 0
  },
  discount: {
    type: Number,
    required: true,
    min: [0, 'Discount cannot be negative'],
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    min: [0, 'Tax cannot be negative'],
    default: 0
  },
  shipping: {
    type: Number,
    required: true,
    min: [0, 'Shipping cannot be negative'],
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative'],
    default: 0
  }
}, { _id: false });

// Main Cart Schema
const CartSchema = new Schema<ICart>({
  userId: {
    type: String,
    sparse: true,
    index: true
  },
  sessionId: {
    type: String,
    sparse: true,
    index: true
  },
  items: {
    type: [CartItemSchema],
    default: [],
    validate: {
      validator: function(items: ICartItem[]) {
        return items.length <= 100; // Maximum 100 items per cart
      },
      message: 'Cart cannot contain more than 100 items'
    }
  },
  totals: {
    type: CartTotalsSchema,
    required: true,
    default: {
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0
    }
  },
  discount: {
    type: CartDiscountSchema
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted', 'expired'],
    default: 'active',
    index: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    source: String,
    campaign: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (removed duplicates that are already defined in schema)
CartSchema.index({ userId: 1, status: 1 });
CartSchema.index({ sessionId: 1, status: 1 });
CartSchema.index({ createdAt: -1 });
CartSchema.index({ updatedAt: -1 });
CartSchema.index({ 'items.productId': 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for item count
CartSchema.virtual('itemCount').get(function(this: ICart) {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Virtual for unique product count
CartSchema.virtual('productCount').get(function(this: ICart) {
  return this.items.length;
});

// Virtual for cart weight
CartSchema.virtual('totalWeight').get(function(this: ICart) {
  return this.items.reduce((weight, item) => {
    return weight + ((item.weight || 0) * item.quantity);
  }, 0);
});

// Virtual for checking if cart is empty
CartSchema.virtual('isEmpty').get(function(this: ICart) {
  return this.items.length === 0;
});

// Virtual for cart value without discounts
CartSchema.virtual('originalValue').get(function(this: ICart) {
  return this.items.reduce((total, item) => {
    return total + (item.originalPrice * item.quantity);
  }, 0);
});

// Pre-save middleware to calculate totals
CartSchema.pre('save', function(this: ICart) {
  this.calculateTotals();
  
  // Set expiration for guest carts
  if (!this.userId && !this.expiresAt) {
    const expirationHours = process.env.GUEST_CART_TTL_HOURS ? 
      parseInt(process.env.GUEST_CART_TTL_HOURS) : 24;
    this.expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
  }
  
  // Update item timestamps
  this.items.forEach(item => {
    if (this.isModified('items')) {
      item.updatedAt = new Date();
    }
  });
});

// Instance method to calculate cart totals
CartSchema.methods.calculateTotals = function(this: ICart) {
  // Calculate subtotal
  const subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  let discount = 0;
  if (this.discount) {
    switch (this.discount.type) {
      case 'percentage':
        discount = (subtotal * this.discount.value) / 100;
        if (this.discount.maximumDiscount) {
          discount = Math.min(discount, this.discount.maximumDiscount);
        }
        break;
      case 'fixed':
        discount = Math.min(this.discount.value, subtotal);
        break;
      case 'shipping':
        // Shipping discount will be applied to shipping cost
        break;
    }
  }

  // Calculate tax (simplified - in reality would be more complex)
  const taxRate = parseFloat(process.env.TAX_RATE || '0.08');
  const tax = (subtotal - discount) * taxRate;

  // Calculate shipping (simplified)
  let shipping = 0;
  const freeShippingThreshold = parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '50');
  const baseShippingCost = parseFloat(process.env.BASE_SHIPPING_COST || '5.99');
  
  if (subtotal >= freeShippingThreshold) {
    shipping = 0;
  } else {
    shipping = baseShippingCost;
    
    // Apply shipping discount
    if (this.discount && this.discount.type === 'shipping') {
      if (this.discount.value >= 100) {
        shipping = 0; // Free shipping
      } else {
        shipping = shipping * (1 - this.discount.value / 100);
      }
    }
  }

  const total = subtotal - discount + tax + shipping;

  this.totals = {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

// Instance method to add item to cart
CartSchema.methods.addItem = function(
  this: ICart, 
  item: Omit<ICartItem, 'addedAt' | 'updatedAt'>
) {
  const existingItemIndex = this.items.findIndex(
    cartItem => cartItem.productId === item.productId && 
                cartItem.variantId === item.variantId
  );

  if (existingItemIndex >= 0) {
    // Update existing item
    this.items[existingItemIndex].quantity += item.quantity;
    this.items[existingItemIndex].price = item.price; // Update price in case it changed
    this.items[existingItemIndex].updatedAt = new Date();
  } else {
    // Add new item
    this.items.push({
      ...item,
      addedAt: new Date(),
      updatedAt: new Date()
    });
  }

  return this.save();
};

// Instance method to update item quantity
CartSchema.methods.updateItem = function(
  this: ICart, 
  productId: string, 
  variantId: string | undefined, 
  quantity: number
) {
  const itemIndex = this.items.findIndex(
    item => item.productId === productId && item.variantId === variantId
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    this.items.splice(itemIndex, 1);
  } else {
    this.items[itemIndex].quantity = quantity;
    this.items[itemIndex].updatedAt = new Date();
  }

  return this.save();
};

// Instance method to remove item from cart
CartSchema.methods.removeItem = function(
  this: ICart, 
  productId: string, 
  variantId?: string
) {
  const initialLength = this.items.length;
  this.items = this.items.filter(
    item => !(item.productId === productId && item.variantId === variantId)
  );

  if (this.items.length === initialLength) {
    throw new Error('Item not found in cart');
  }

  return this.save();
};

// Instance method to clear cart
CartSchema.methods.clear = function(this: ICart) {
  this.items = [];
  this.discount = undefined;
  return this.save();
};

// Instance method to apply discount
CartSchema.methods.applyDiscount = function(this: ICart, discount: ICartDiscount) {
  // Validate minimum amount if specified
  if (discount.minimumAmount && this.totals.subtotal < discount.minimumAmount) {
    throw new Error(`Minimum order amount of $${discount.minimumAmount} required`);
  }

  this.discount = {
    ...discount,
    appliedAt: new Date()
  };

  return this.save();
};

// Instance method to remove discount
CartSchema.methods.removeDiscount = function(this: ICart) {
  this.discount = undefined;
  return this.save();
};

// Static method to find cart by user or session
CartSchema.statics.findActiveCart = function(userId?: string, sessionId?: string) {
  const query: any = { status: 'active' };
  
  if (userId) {
    query.userId = userId;
  } else if (sessionId) {
    query.sessionId = sessionId;
  } else {
    return null;
  }

  return this.findOne(query).sort({ updatedAt: -1 });
};

// Static method to find abandoned carts
CartSchema.statics.findAbandonedCarts = function(hoursAgo: number = 24) {
  const cutoffDate = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
  
  return this.find({
    status: 'active',
    updatedAt: { $lt: cutoffDate },
    'items.0': { $exists: true } // Has at least one item
  });
};

// Static method to clean up expired carts
CartSchema.statics.cleanupExpiredCarts = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { 
        status: 'expired',
        updatedAt: { $lt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) } // 7 days old
      }
    ]
  });
};

// Create and export the model
const Cart: ICartModel = mongoose.model<ICart, ICartModel>('Cart', CartSchema);

export default Cart;
export { CartSchema };
