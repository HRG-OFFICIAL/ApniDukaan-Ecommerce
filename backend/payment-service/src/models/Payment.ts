import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'wallet';
  paymentProvider: string;
  paymentIntentId: string;
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  metadata: Record<string, any>;
  gatewayResponse: Record<string, any>;
  refunds: IRefund[];
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  failureReason?: string;
  webhookEvents: IWebhookEvent[];
}

export interface IRefund {
  refundId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  processedAt?: Date;
  metadata: Record<string, any>;
}

export interface IWebhookEvent {
  eventId: string;
  eventType: string;
  provider: 'stripe' | 'paypal';
  processedAt: Date;
  data: Record<string, any>;
}

const RefundSchema = new Schema<IRefund>({
  refundId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  processedAt: { type: Date },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const WebhookEventSchema = new Schema<IWebhookEvent>({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  provider: { type: String, enum: ['stripe', 'paypal'], required: true },
  processedAt: { type: Date, default: Date.now },
  data: { type: Schema.Types.Mixed, required: true }
});

const PaymentSchema = new Schema<IPayment>({
  orderId: { type: mongoose.Types.ObjectId, required: true, index: true },
  userId: { type: mongoose.Types.ObjectId, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD', uppercase: true },
  paymentMethod: { 
    type: String, 
    enum: ['stripe', 'paypal', 'wallet'], 
    required: true 
  },
  paymentProvider: { type: String, required: true },
  paymentIntentId: { type: String, required: true, unique: true },
  transactionId: { type: String, index: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  gatewayResponse: { type: Schema.Types.Mixed, default: {} },
  refunds: [RefundSchema],
  processedAt: { type: Date },
  failureReason: { type: String },
  webhookEvents: [WebhookEventSchema]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PaymentSchema.index({ orderId: 1, status: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ paymentIntentId: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for total refunded amount
PaymentSchema.virtual('totalRefundedAmount').get(function() {
  return this.refunds
    .filter(refund => refund.status === 'completed')
    .reduce((total, refund) => total + refund.amount, 0);
});

// Virtual for net amount (original amount minus refunds)
PaymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.totalRefundedAmount;
});

// Instance methods
PaymentSchema.methods.addRefund = function(refundData: Partial<IRefund>) {
  this.refunds.push(refundData);
  return this.save();
};

PaymentSchema.methods.updateStatus = function(status: IPayment['status'], metadata?: Record<string, any>) {
  this.status = status;
  if (status === 'completed' || status === 'failed') {
    this.processedAt = new Date();
  }
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

PaymentSchema.methods.addWebhookEvent = function(eventData: Omit<IWebhookEvent, 'processedAt'>) {
  const existingEvent = this.webhookEvents.find(event => event.eventId === eventData.eventId);
  if (!existingEvent) {
    this.webhookEvents.push({
      ...eventData,
      processedAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
PaymentSchema.statics.findByOrderId = function(orderId: string) {
  return this.findOne({ orderId }).sort({ createdAt: -1 });
};

PaymentSchema.statics.findByUserId = function(userId: string, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

PaymentSchema.statics.findPendingPayments = function(timeoutMinutes = 30) {
  const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
  return this.find({
    status: { $in: ['pending', 'processing'] },
    createdAt: { $lt: timeoutDate }
  });
};

PaymentSchema.statics.getPaymentStats = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
