import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar JSON

  enum OrderStatus {
    PENDING
    CONFIRMED
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
    REFUNDED
  }

  enum PaymentMethod {
    CREDIT_CARD
    DEBIT_CARD
    PAYPAL
    APPLE_PAY
    GOOGLE_PAY
    CASH_ON_DELIVERY
  }

  enum UserRole {
    ADMIN
    MODERATOR
    USER
    GUEST
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    avatar: String
    phone: String
    addresses: [Address!]!
    preferences: UserPreferences
    createdAt: String!
    lastLoginAt: String
  }

  type Address {
    id: ID!
    type: String!
    street: String!
    city: String!
    state: String!
    zipCode: String!
    country: String!
    isDefault: Boolean!
  }

  type UserPreferences {
    newsletter: Boolean
    notifications: Boolean
    language: String
    currency: String
  }

  type Product {
    id: ID!
    name: String!
    slug: String
    description: String!
    shortDescription: String
    price: Float!
    originalPrice: Float
    currency: String
    images: [String!]!
    thumbnailImage: String
    category: Category
    subcategory: String
    brand: String
    tags: [String!]
    inventory: Inventory
    rating: Rating
    sales: Sales
    sku: String
    colors: [String!]
    sizes: [String!]
    isBestseller: Boolean
    isOnSale: Boolean
    isNew: Boolean
    isFeatured: Boolean
    isActive: Boolean
    stock: Int!
    reviewCount: Int
    specifications: JSON
    reviews: [Review!]
    createdAt: String!
    updatedAt: String!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    image: String
    productCount: Int
  }

  type Inventory {
    quantity: Int!
    lowStockThreshold: Int!
  }

  type Rating {
    average: Float!
    count: Int!
  }

  type Sales {
    totalSold: Int!
    revenue: Float!
  }

  type Review {
    id: ID!
    rating: Int!
    comment: String!
    user: ReviewUser!
    createdAt: String!
    updatedAt: String
  }

  type ReviewUser {
    id: ID!
    name: String!
  }

  type Cart {
    id: ID!
    items: [CartItem!]!
    subtotal: Float!
    tax: Float!
    shipping: Float!
    discount: Float!
    total: Float!
    itemCount: Int!
  }

  type CartItem {
    id: ID!
    product: Product!
    quantity: Int!
    price: Float!
  }

  type Order {
    id: ID!
    orderNumber: String!
    status: OrderStatus!
    total: Float!
    subtotal: Float!
    tax: Float!
    shipping: Float!
    discount: Float!
    items: [OrderItem!]!
    customer: OrderCustomer
    shippingAddress: Address!
    billingAddress: Address
    payment: Payment
    tracking: Tracking
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem {
    id: ID!
    product: OrderProduct!
    quantity: Int!
    price: Float!
  }

  type OrderProduct {
    id: ID!
    name: String!
    images: [String!]!
  }

  type OrderCustomer {
    id: ID!
    name: String!
    email: String!
  }

  type Payment {
    method: PaymentMethod!
    status: String!
    transactionId: String
  }

  type Tracking {
    status: String!
    carrier: String!
    trackingNumber: String!
    estimatedDelivery: String
  }

  type WishlistItem {
    id: ID!
    product: Product!
    createdAt: String!
  }

  type AuthResponse {
    accessToken: String!
    refreshToken: String
    user: User!
  }

  type DashboardStats {
    totalOrders: Int!
    totalRevenue: Float!
    totalUsers: Int!
    totalProducts: Int!
    recentOrders: [Order!]!
    topProducts: [TopProduct!]!
  }

  type TopProduct {
    id: ID!
    name: String!
    sales: Int!
    revenue: Float!
  }

  type ProductsResponse {
    products: [Product!]!
    totalCount: Int!
  }

  input ProductFilter {
    category: String
    minPrice: Float
    maxPrice: Float
    rating: Float
    inStock: Boolean
    isOnSale: Boolean
    isBestseller: Boolean
    isNew: Boolean
  }

  input ProductSort {
    field: String!
    direction: String!
  }

  input OrderFilter {
    status: OrderStatus
    dateFrom: String
    dateTo: String
    customerId: ID
  }

  input OrderSort {
    field: String!
    direction: String!
  }

  input UserFilter {
    role: UserRole
    isActive: Boolean
    dateFrom: String
    dateTo: String
  }

  input UserSort {
    field: String!
    direction: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    phone: String
  }

  input UpdateProfileInput {
    name: String
    phone: String
    avatar: String
    preferences: UserPreferencesInput
  }

  input UserPreferencesInput {
    newsletter: Boolean
    notifications: Boolean
    language: String
    currency: String
  }

  input AddressInput {
    type: String!
    street: String!
    city: String!
    state: String!
    zipCode: String!
    country: String!
    isDefault: Boolean
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
    shippingAddressId: ID!
    billingAddressId: ID
    paymentMethod: PaymentMethod!
    couponCode: String
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
  }

  input CreateReviewInput {
    productId: ID!
    rating: Int!
    comment: String!
  }

  input UpdateReviewInput {
    rating: Int
    comment: String
  }

  input CreateProductInput {
    name: String!
    description: String!
    price: Float!
    originalPrice: Float
    images: [String!]!
    category: String!
    stock: Int!
    specifications: JSON
    isActive: Boolean
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    originalPrice: Float
    images: [String!]
    category: String
    stock: Int
    specifications: JSON
    isActive: Boolean
  }

  type Query {
    # Product queries
    products(filter: ProductFilter, sort: ProductSort, search: String, limit: Int, offset: Int): ProductsResponse!
    product(id: ID!): Product
    categories: [Category!]!
    searchProducts(query: String!, filters: ProductFilter, sort: ProductSort, limit: Int, offset: Int): [Product!]!

    # User queries
    me: User
    myOrders(filter: OrderFilter, sort: OrderSort, limit: Int, offset: Int): [Order!]!
    order(id: ID!): Order

    # Cart queries
    cart: Cart
    wishlist: [WishlistItem!]!

    # Admin queries
    orders(filter: OrderFilter, sort: OrderSort, limit: Int, offset: Int): [Order!]!
    users(filter: UserFilter, sort: UserSort, limit: Int, offset: Int): [User!]!
    dashboardStats: DashboardStats!
  }

  type Mutation {
    # Auth mutations
    login(email: String!, password: String!): AuthResponse!
    register(input: RegisterInput!): AuthResponse!
    logout: Boolean!
    refreshToken(refreshToken: String!): AuthResponse!
    forgotPassword(email: String!): Boolean!
    resetPassword(token: String!, password: String!): Boolean!
    verifyEmail(token: String!): Boolean!

    # Profile mutations
    updateProfile(input: UpdateProfileInput!): User!
    addAddress(input: AddressInput!): Address!
    updateAddress(id: ID!, input: AddressInput!): Address!
    deleteAddress(id: ID!): Boolean!

    # Cart mutations
    addToCart(productId: ID!, quantity: Int!): Cart!
    updateCartItem(itemId: ID!, quantity: Int!): Cart!
    removeFromCart(itemId: ID!): Cart!
    clearCart: Boolean!

    # Wishlist mutations
    addToWishlist(productId: ID!): WishlistItem!
    removeFromWishlist(productId: ID!): Boolean!

    # Order mutations
    createOrder(input: CreateOrderInput!): Order!
    cancelOrder(id: ID!, reason: String): Order!

    # Payment mutations
    createPaymentIntent(orderId: ID!, paymentMethod: PaymentMethod!): JSON!
    confirmPayment(paymentIntentId: String!): JSON!

    # Review mutations
    createReview(input: CreateReviewInput!): Review!
    updateReview(id: ID!, input: UpdateReviewInput!): Review!
    deleteReview(id: ID!): Boolean!

    # Admin mutations
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    updateUserRole(id: ID!, role: UserRole!): User!
  }
`;
