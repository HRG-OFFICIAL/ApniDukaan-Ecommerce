import { gql } from 'apollo-server-express';

export const paymentTypeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.3",
          import: ["@key", "@shareable", "@external", "@requires"])

  # Payment Types
  type Payment @key(fields: "id") {
    id: ID!
    orderId: String!
    userId: String!
    amount: Float!
    currency: String!
    paymentMethod: PaymentMethod!
    paymentProvider: String!
    paymentIntentId: String!
    transactionId: String
    status: PaymentStatus!
    metadata: JSON
    gatewayResponse: JSON
    refunds: [Refund!]!
    totalRefundedAmount: Float!
    netAmount: Float!
    processedAt: DateTime
    failureReason: String
    webhookEvents: [WebhookEvent!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Refund {
    refundId: String!
    amount: Float!
    reason: String!
    status: RefundStatus!
    processedAt: DateTime
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WebhookEvent {
    eventId: String!
    eventType: String!
    provider: PaymentProvider!
    processedAt: DateTime!
    data: JSON!
  }

  # Stripe Types
  type StripePaymentIntent {
    id: String!
    clientSecret: String!
    status: String!
    amount: Float!
    currency: String!
    paymentMethod: String
    nextAction: JSON
  }

  type StripeCustomer {
    id: String!
    email: String!
    name: String
    metadata: JSON
  }

  type StripeSetupIntent {
    id: String!
    clientSecret: String!
    status: String!
  }

  # PayPal Types
  type PayPalOrder {
    id: String!
    status: String!
    amount: Float!
    currency: String!
    approveLink: String!
    captureLink: String!
  }

  # Input Types
  input CreateStripePaymentIntentInput {
    amount: Float!
    currency: String!
    orderId: String!
    userId: String!
    customerId: String
    paymentMethodId: String
    metadata: JSON
    automaticPaymentMethods: Boolean
  }

  input ConfirmStripePaymentIntentInput {
    paymentIntentId: String!
    paymentMethodId: String
  }

  input CreatePayPalOrderInput {
    amount: Float!
    currency: String!
    orderId: String!
    userId: String!
    description: String
    metadata: JSON
  }

  input CapturePayPalOrderInput {
    paypalOrderId: String!
    metadata: JSON
  }

  input RefundPaymentInput {
    paymentIntentId: String!
    amount: Float
    reason: String
    metadata: JSON
  }

  input CreateStripeCustomerInput {
    email: String!
    name: String
    metadata: JSON
  }

  input PaymentFilters {
    userId: String
    orderId: String
    status: PaymentStatus
    paymentMethod: PaymentMethod
    dateFrom: DateTime
    dateTo: DateTime
    amountMin: Float
    amountMax: Float
  }

  # Enums
  enum PaymentMethod {
    STRIPE
    PAYPAL
    WALLET
  }

  enum PaymentStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    REFUNDED
    CANCELLED
  }

  enum RefundStatus {
    PENDING
    COMPLETED
    FAILED
  }

  enum PaymentProvider {
    STRIPE
    PAYPAL
  }

  # Response Types
  type PaymentResponse {
    success: Boolean!
    payment: Payment
    error: String
    message: String
  }

  type StripePaymentIntentResponse {
    success: Boolean!
    paymentIntent: StripePaymentIntent
    payment: Payment
    error: String
    message: String
  }

  type PayPalOrderResponse {
    success: Boolean!
    paypalOrder: PayPalOrder
    payment: Payment
    error: String
    message: String
  }

  type RefundResponse {
    success: Boolean!
    payment: Payment
    refund: Refund
    error: String
    message: String
  }

  type PaymentStatsResponse {
    totalAmount: Float!
    totalCount: Int!
    avgAmount: Float!
    paymentMethodBreakdown: [PaymentMethodStats!]!
    statusBreakdown: [PaymentStatusStats!]!
    timeSeriesData: [PaymentTimeSeriesData!]!
  }

  type PaymentMethodStats {
    paymentMethod: PaymentMethod!
    totalAmount: Float!
    count: Int!
    avgAmount: Float!
  }

  type PaymentStatusStats {
    status: PaymentStatus!
    count: Int!
    percentage: Float!
  }

  type PaymentTimeSeriesData {
    date: String!
    amount: Float!
    count: Int!
  }

  # Queries
  type Query {
    # Payment queries
    payment(id: ID!): Payment
    payments(
      filters: PaymentFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "createdAt"
      sortOrder: String = "DESC"
    ): [Payment!]!
    
    paymentsByOrder(orderId: String!): [Payment!]!
    paymentsByUser(
      userId: String!
      limit: Int = 10
      offset: Int = 0
    ): [Payment!]!

    # Stripe queries
    stripePaymentIntent(paymentIntentId: String!): StripePaymentIntent
    stripeCustomer(customerId: String!): StripeCustomer

    # PayPal queries
    paypalOrder(orderId: String!): PayPalOrder

    # Analytics
    paymentStats(
      dateFrom: DateTime!
      dateTo: DateTime!
      filters: PaymentFilters
    ): PaymentStatsResponse!

    # Health check
    paymentServiceHealth: ServiceHealth!
  }

  # Mutations
  type Mutation {
    # Stripe mutations
    createStripePaymentIntent(
      input: CreateStripePaymentIntentInput!
    ): StripePaymentIntentResponse!
    
    confirmStripePaymentIntent(
      input: ConfirmStripePaymentIntentInput!
    ): PaymentResponse!

    createStripeCustomer(
      input: CreateStripeCustomerInput!
    ): StripeCustomer!

    createStripeSetupIntent(
      customerId: String!
    ): StripeSetupIntent!

    # PayPal mutations
    createPayPalOrder(
      input: CreatePayPalOrderInput!
    ): PayPalOrderResponse!

    capturePayPalOrder(
      input: CapturePayPalOrderInput!
    ): PaymentResponse!

    # Refund mutations
    refundStripePayment(
      input: RefundPaymentInput!
    ): RefundResponse!

    refundPayPalPayment(
      captureId: String!
      amount: Float
      metadata: JSON
    ): RefundResponse!

    # Admin mutations
    updatePaymentStatus(
      paymentId: ID!
      status: PaymentStatus!
      metadata: JSON
    ): PaymentResponse!

    cancelPayment(
      paymentId: ID!
      reason: String
    ): PaymentResponse!
  }

  # Subscriptions
  type Subscription {
    paymentStatusChanged(paymentId: ID!): Payment!
    paymentsByUser(userId: String!): Payment!
    paymentsByOrder(orderId: String!): Payment!
  }

  # Shared types
  type ServiceHealth {
    status: String!
    timestamp: DateTime!
    version: String!
    dependencies: [DependencyHealth!]!
  }

  type DependencyHealth {
    name: String!
    status: String!
    responseTime: Int
    error: String
  }

  scalar DateTime
  scalar JSON
`;

export default paymentTypeDefs;
