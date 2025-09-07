export interface IPayment {
  _id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerCustomerId?: string;
  failureReason?: string;
  refunds: IRefund[];
  metadata?: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentMethod {
  _id: string;
  userId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  providerMethodId: string;
  isDefault: boolean;
  // Card specific fields
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  // PayPal specific fields
  paypalEmail?: string;
  // Bank transfer specific fields
  bankName?: string;
  accountLast4?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: string;
  paymentId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  providerTransactionId?: string;
  providerResponse?: any;
  failureReason?: string;
  metadata?: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefund {
  _id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: RefundReason;
  providerRefundId?: string;
  providerResponse?: any;
  failureReason?: string;
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWebhookEvent {
  _id: string;
  provider: PaymentProvider;
  eventType: string;
  eventId: string;
  processed: boolean;
  attempts: number;
  lastAttempt?: Date;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REQUIRES_ACTION = 'requires_action'
}

export enum PaymentMethod {
  CARD = 'card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay'
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal'
}

export enum PaymentMethodType {
  CARD = 'card',
  PAYPAL = 'paypal',
  BANK_ACCOUNT = 'bank_account'
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  CHARGEBACK = 'chargeback'
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed'
}

export enum RefundStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RefundReason {
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
  FRAUDULENT = 'fraudulent',
  DUPLICATE = 'duplicate',
  ORDER_CANCELLED = 'order_cancelled',
  PRODUCT_NOT_RECEIVED = 'product_not_received',
  PRODUCT_UNACCEPTABLE = 'product_unacceptable',
  OTHER = 'other'
}

// Stripe specific interfaces
export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  customer?: string;
  payment_method?: string;
  metadata?: { [key: string]: string };
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: { [key: string]: string };
}

// PayPal specific interfaces
export interface PayPalOrder {
  id: string;
  status: string;
  intent: string;
  purchase_units: PayPalPurchaseUnit[];
  payer?: PayPalPayer;
}

export interface PayPalPurchaseUnit {
  amount: {
    currency_code: string;
    value: string;
  };
  reference_id?: string;
  description?: string;
}

export interface PayPalPayer {
  email_address: string;
  payer_id?: string;
  name?: {
    given_name: string;
    surname: string;
  };
}

// Input types
export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  customerEmail?: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface CreatePaymentMethodInput {
  type: PaymentMethodType;
  provider: PaymentProvider;
  // For Stripe
  stripePaymentMethodId?: string;
  // For PayPal
  paypalBillingAgreementId?: string;
  paypalEmail?: string;
  isDefault?: boolean;
}

export interface ProcessRefundInput {
  paymentId: string;
  amount: number;
  reason: RefundReason;
  notes?: string;
}

export interface PaymentSummary {
  totalPayments: number;
  totalRefunds: number;
  netAmount: number;
  currency: string;
  successRate: number;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  provider?: PaymentProvider;
  userId?: string;
  orderId?: string;
  amountMin?: number;
  amountMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
}
