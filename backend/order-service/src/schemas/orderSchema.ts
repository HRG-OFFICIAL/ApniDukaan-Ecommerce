import { gql } from 'apollo-server-express';

export const orderTypeDefs = gql`
  type Order {
    id: ID!
    orderNumber: String!
    user: ID!
    email: String!
    items: [OrderItem!]!
    subtotal: Float!
    tax: Float!
    shipping: Float!
    discount: Float!
    total: Float!
    currency: String!
    status: OrderStatus!
    paymentStatus: PaymentStatus!
    paymentMethod: String!
    paymentIntentId: String
    shippingAddress: Address!
    billingAddress: Address!
    shippingMethod: ShippingMethod!
    tracking: TrackingInfo
    notes: OrderNotes
    couponCode: String
    refunds: [Refund!]!
    cancelledAt: DateTime
    cancelReason: String
    fulfilledAt: DateTime
    deliveredAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Cart {
    id: ID!
    user: ID!
    items: [CartItem!]!
    subtotal: Float!
    itemCount: Int!
    lastActivity: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrderItem {
    product: ID!
    productName: String!
    productImage: String!
    sku: String!
    quantity: Int!
    price: Float!
    total: Float!
    variant: ProductVariant
  }

  type CartItem {
    product: ID!
    productName: String!
    productImage: String!
    sku: String!
    quantity: Int!
    price: Float!
    total: Float!
    variant: ProductVariant
    addedAt: DateTime!
  }

  type ProductVariant {
    name: String!
    value: String!
  }

  type Address {
    firstName: String!
    lastName: String!
    company: String
    address1: String!
    address2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    phone: String
  }

  type ShippingMethod {
    name: String!
    cost: Float!
    estimatedDays: Int
  }

  type TrackingInfo {
    number: String!
    carrier: String!
    url: String
    updatedAt: DateTime!
  }

  type OrderNotes {
    customer: String
    internal: String
  }

  type Refund {
    amount: Float!
    reason: String!
    refundId: String
    processedAt: DateTime!
  }

  type OrderStats {
    totalOrders: Int!
    totalRevenue: Float!
    averageOrderValue: Float!
    pendingOrders: Int!
    confirmedOrders: Int!
    fulfilledOrders: Int!
    cancelledOrders: Int!
  }

  enum OrderStatus {
    PENDING
    CONFIRMED
    PROCESSING
    FULFILLED
    DELIVERED
    CANCELLED
    REFUNDED
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
    PARTIALLY_REFUNDED
  }

  input CreateOrderInput {
    shippingAddress: AddressInput!
    billingAddress: AddressInput!
    paymentMethod: String!
    shippingMethod: ShippingMethodInput!
    couponCode: String
    notes: String
  }

  input AddressInput {
    firstName: String!
    lastName: String!
    company: String
    address1: String!
    address2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    phone: String
  }

  input ShippingMethodInput {
    name: String!
    cost: Float!
    estimatedDays: Int
  }

  input AddToCartInput {
    productId: ID!
    quantity: Int!
    price: Float!
    productData: ProductDataInput!
  }

  input ProductDataInput {
    name: String!
    sku: String!
    images: [ProductImageInput!]!
    variant: ProductVariantInput
  }

  input ProductImageInput {
    url: String!
  }

  input ProductVariantInput {
    name: String!
    value: String!
  }

  input UpdateCartItemInput {
    productId: ID!
    quantity: Int!
  }

  input AddTrackingInput {
    trackingNumber: String!
    carrier: String!
  }

  type Query {
    # Order queries
    order(id: ID, orderNumber: String): Order
    orders(limit: Int, offset: Int): [Order!]!
    userOrders(limit: Int, offset: Int): [Order!]!
    ordersByStatus(status: OrderStatus!, limit: Int, offset: Int): [Order!]!
    orderStats(startDate: DateTime, endDate: DateTime): OrderStats!
    
    # Cart queries
    cart: Cart!
    cartItemCount: Int!
  }

  type Mutation {
    # Order mutations
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    cancelOrder(id: ID!, reason: String!): Order!
    addTrackingInfo(id: ID!, input: AddTrackingInput!): Order!
    
    # Cart mutations
    addToCart(input: AddToCartInput!): Cart!
    updateCartItem(input: UpdateCartItemInput!): Cart!
    removeFromCart(productId: ID!): Cart!
    clearCart: Cart!
  }

  scalar DateTime
`;
