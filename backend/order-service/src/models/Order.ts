import mongoose, { Schema, Document } from 'mongoose';
import { IOrder, OrderStatus, PaymentStatus, timestampPlugin } from '@shopsphere/shared';

export interface IOrderDocument extends IOrder, Document {
  calculateTotal(): number;
  updateStatus(status: OrderStatus): Promise<void>;
  addTrackingInfo(trackingNumber: string, carrier: string): Promise<void>;
  canBeCancelled(): boolean;
}

const orderItemSchema = new Schema({
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
    min: 1
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
  }
});

const shippingAddressSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  company: String,
  address1: {
    type: String,
    required: true
  },
  address2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  phone: String
});

const orderSchema = new Schema<IOrderDocument>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'cash_on_delivery'],
    required: true
  },
  paymentIntentId: {
    type: String,
    sparse: true,
    index: true
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  billingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  shippingMethod: {
    name: {
      type: String,
      required: true
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    estimatedDays: {
      type: Number,
      min: 1
    }
  },
  tracking: {
    number: String,
    carrier: String,
    url: String,
    updatedAt: Date
  },
  notes: {
    customer: String,
    internal: String
  },
  couponCode: String,
  refunds: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true
    },
    refundId: String,
    processedAt: {
      type: Date,
      default: Date.now
    }
  }],
  cancelledAt: Date,
  cancelReason: String,
  fulfilledAt: Date,
  deliveredAt: Date
});

// Add timestamp plugin
orderSchema.plugin(timestampPlugin);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ email: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(this: IOrderDocument) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
});

// Instance method to calculate total
orderSchema.methods.calculateTotal = function(this: IOrderDocument): number {
  return this.subtotal + this.tax + this.shipping - this.discount;
};

// Instance method to update status
orderSchema.methods.updateStatus = async function(
  this: IOrderDocument,
  status: OrderStatus
): Promise<void> {
  this.status = status;
  
  if (status === OrderStatus.FULFILLED) {
    this.fulfilledAt = new Date();
  } else if (status === OrderStatus.DELIVERED) {
    this.deliveredAt = new Date();
  } else if (status === OrderStatus.CANCELLED) {
    this.cancelledAt = new Date();
  }
  
  await this.save();
};

// Instance method to add tracking info
orderSchema.methods.addTrackingInfo = async function(
  this: IOrderDocument,
  trackingNumber: string,
  carrier: string
): Promise<void> {
  this.tracking = {
    number: trackingNumber,
    carrier,
    url: this.generateTrackingUrl(trackingNumber, carrier),
    updatedAt: new Date()
  };
  
  await this.save();
};

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function(this: IOrderDocument): boolean {
  return [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(this.status);
};

// Helper method to generate tracking URL
orderSchema.methods.generateTrackingUrl = function(
  trackingNumber: string,
  carrier: string
): string {
  const trackingUrls: { [key: string]: string } = {
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'fedex': `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
    'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
  };
  
  return trackingUrls[carrier.toLowerCase()] || '';
};

// Static methods
orderSchema.statics.findByUser = function(userId: string, limit: number = 20, skip: number = 0) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

orderSchema.statics.findByOrderNumber = function(orderNumber: string) {
  return this.findOne({ orderNumber });
};

orderSchema.statics.findByStatus = function(status: OrderStatus, limit: number = 50, skip: number = 0) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

orderSchema.statics.getOrderStats = async function(startDate?: Date, endDate?: Date) {
  const matchStage: any = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', OrderStatus.PENDING] }, 1, 0] }
        },
        confirmedOrders: {
          $sum: { $cond: [{ $eq: ['$status', OrderStatus.CONFIRMED] }, 1, 0] }
        },
        fulfilledOrders: {
          $sum: { $cond: [{ $eq: ['$status', OrderStatus.FULFILLED] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    fulfilledOrders: 0,
    cancelledOrders: 0
  };
};

// Transform output
orderSchema.methods.toJSON = function(this: IOrderDocument) {
  const order = this.toObject();
  delete order.__v;
  return order;
};

// Create and export the model
export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);

// Export the schema for testing
export { orderSchema };
