import mongoose, { Schema, Document } from 'mongoose';
import { ICart, timestampPlugin } from '@shopsphere/shared';

export interface ICartDocument extends ICart, Document {
  addItem(productId: string, quantity: number, price: number, productData: any): Promise<void>;
  updateItemQuantity(productId: string, quantity: number): Promise<void>;
  removeItem(productId: string): Promise<void>;
  clearCart(): Promise<void>;
  calculateTotals(): { subtotal: number; itemCount: number };
}

const cartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 99
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  variant: {
    name: String,
    value: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new Schema<ICartDocument>({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  itemCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add timestamp plugin
cartSchema.plugin(timestampPlugin);

// Index for cleanup of abandoned carts
cartSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(this: ICartDocument) {
  const totals = this.calculateTotals();
  this.subtotal = totals.subtotal;
  this.itemCount = totals.itemCount;
  this.lastActivity = new Date();
});

// Instance method to add item
cartSchema.methods.addItem = async function(
  this: ICartDocument,
  productId: string,
  quantity: number,
  price: number,
  productData: any
): Promise<void> {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].total = this.items[existingItemIndex].quantity * price;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      productName: productData.name,
      productImage: productData.images?.[0]?.url || '',
      sku: productData.sku,
      quantity,
      price,
      total: quantity * price,
      variant: productData.variant || null,
      addedAt: new Date()
    });
  }

  await this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function(
  this: ICartDocument,
  productId: string,
  quantity: number
): Promise<void> {
  const itemIndex = this.items.findIndex(
    item => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = quantity;
      this.items[itemIndex].total = quantity * this.items[itemIndex].price;
    }
    await this.save();
  }
};

// Instance method to remove item
cartSchema.methods.removeItem = async function(
  this: ICartDocument,
  productId: string
): Promise<void> {
  this.items = this.items.filter(
    item => item.product.toString() !== productId
  );
  await this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = async function(this: ICartDocument): Promise<void> {
  this.items = [];
  await this.save();
};

// Instance method to calculate totals
cartSchema.methods.calculateTotals = function(this: ICartDocument): { subtotal: number; itemCount: number } {
  const subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  const itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  return { subtotal, itemCount };
};

// Static methods
cartSchema.statics.findByUser = function(userId: string) {
  return this.findOne({ user: userId });
};

cartSchema.statics.createForUser = function(userId: string) {
  return this.create({ user: userId, items: [] });
};

cartSchema.statics.findOrCreateForUser = async function(userId: string) {
  let cart = await this.findByUser(userId);
  if (!cart) {
    cart = await this.createForUser(userId);
  }
  return cart;
};

// Transform output
cartSchema.methods.toJSON = function(this: ICartDocument) {
  const cart = this.toObject();
  delete cart.__v;
  return cart;
};

// Create and export the model
export const Cart = mongoose.model<ICartDocument>('Cart', cartSchema);

// Export the schema for testing
export { cartSchema };
