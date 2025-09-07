import mongoose, { Schema, Document } from 'mongoose';
import { IWishlist, IWishlistItem, timestampPlugin } from '@shopsphere/shared';

export interface IWishlistDocument extends IWishlist, Document {}

const wishlistItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const wishlistSchema = new Schema<IWishlistDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [wishlistItemSchema]
});

// Add timestamp plugin
wishlistSchema.plugin(timestampPlugin);

// Indexes
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ 'items.productId': 1 });
wishlistSchema.index({ createdAt: -1 });

// Virtual for total items count
wishlistSchema.virtual('totalItems').get(function(this: IWishlistDocument) {
  return this.items.length;
});

// Instance methods
wishlistSchema.methods.addItem = function(this: IWishlistDocument, productId: string) {
  // Check if item already exists
  const existingItem = this.items.find(item => 
    item.productId.toString() === productId
  );
  
  if (existingItem) {
    // Update the addedAt date to move it to the top
    existingItem.addedAt = new Date();
  } else {
    // Add new item
    this.items.unshift({
      productId: new mongoose.Types.ObjectId(productId),
      addedAt: new Date()
    });
  }
  
  return this.save();
};

wishlistSchema.methods.removeItem = function(this: IWishlistDocument, productId: string) {
  this.items = this.items.filter(item => 
    item.productId.toString() !== productId
  );
  return this.save();
};

wishlistSchema.methods.hasItem = function(this: IWishlistDocument, productId: string): boolean {
  return this.items.some(item => 
    item.productId.toString() === productId
  );
};

wishlistSchema.methods.clear = function(this: IWishlistDocument) {
  this.items = [];
  return this.save();
};

wishlistSchema.methods.getItemIds = function(this: IWishlistDocument): string[] {
  return this.items.map(item => item.productId.toString());
};

// Static methods
wishlistSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

wishlistSchema.statics.createForUser = function(userId: string) {
  return this.create({
    userId,
    items: []
  });
};

wishlistSchema.statics.findOrCreateForUser = async function(userId: string) {
  let wishlist = await this.findOne({ userId });
  
  if (!wishlist) {
    wishlist = await this.create({
      userId,
      items: []
    });
  }
  
  return wishlist;
};

// Remove items when products are deleted (would be called by Catalog service)
wishlistSchema.statics.removeProductFromAllWishlists = function(productId: string) {
  return this.updateMany(
    { 'items.productId': productId },
    { $pull: { items: { productId } } }
  );
};

// Get popular wishlist items for analytics
wishlistSchema.statics.getPopularItems = function(limit: number = 10) {
  return this.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        count: { $sum: 1 },
        lastAdded: { $max: '$items.addedAt' }
      }
    },
    { $sort: { count: -1, lastAdded: -1 } },
    { $limit: limit }
  ]);
};

// Transform output
wishlistSchema.methods.toJSON = function(this: IWishlistDocument) {
  const wishlist = this.toObject();
  
  // Add virtual fields
  wishlist.totalItems = this.totalItems;
  
  // Remove MongoDB specific fields
  delete wishlist.__v;
  
  return wishlist;
};

export const Wishlist = mongoose.model<IWishlistDocument>('Wishlist', wishlistSchema);
export { wishlistSchema };
