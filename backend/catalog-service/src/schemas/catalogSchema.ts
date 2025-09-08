import { gql } from 'apollo-server-express';

export const catalogTypeDefs = gql`
  scalar DateTime
  scalar JSON

  # Product Types
  type Product @key(fields: "id") {
    id: ID!
    name: String!
    slug: String!
    description: String!
    shortDescription: String
    sku: String!
    price: Float!
    originalPrice: Float
    currency: String!
    images: [String!]!
    thumbnailImage: String
    category: Category!
    subcategory: Category
    brand: String
    tags: [String!]!
    attributes: [ProductAttribute!]!
    inventory: ProductInventory!
    shipping: ProductShipping!
    seo: ProductSEO!
    status: ProductStatus!
    featured: Boolean!
    visibility: ProductVisibility!
    rating: ProductRating!
    sales: ProductSales!
    isOnSale: Boolean!
    saleStartDate: DateTime
    saleEndDate: DateTime
    # Virtual fields
    discountPercentage: Int!
    isNew: Boolean!
    isBestseller: Boolean!
    isLowStock: Boolean!
    isOutOfStock: Boolean!
    reviews(page: Int = 1, limit: Int = 10, rating: Int, sortBy: ReviewSortBy = NEWEST, verifiedOnly: Boolean = false): ReviewConnection!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ProductAttribute {
    name: String!
    value: String!
    type: ProductAttributeType!
  }

  type ProductInventory {
    quantity: Int!
    reserved: Int!
    available: Int!
    lowStockThreshold: Int!
    trackQuantity: Boolean!
    allowBackorder: Boolean!
    sku: String
    barcode: String
    weight: Float
    dimensions: ProductDimensions
  }

  type ProductShipping {
    weight: Float!
    dimensions: ProductDimensions!
    freeShipping: Boolean!
    shippingClass: String
    estimatedDeliveryDays: Int
  }

  type ProductSEO {
    title: String
    description: String
    keywords: [String!]!
    canonicalUrl: String
    metaTags: [MetaTag!]!
  }

  type MetaTag {
    name: String!
    content: String!
    property: String
  }

  type ProductRating {
    average: Float!
    count: Int!
    distribution: [RatingDistribution!]!
  }

  type RatingDistribution {
    rating: Int!
    count: Int!
    percentage: Float!
  }

  type ProductSales {
    totalSold: Int!
    revenue: Float!
    lastSoldAt: DateTime
  }

  # Category Types
  type Category @key(fields: "id") {
    id: ID!
    name: String!
    slug: String!
    description: String
    image: String
    parent: Category
    children: [Category!]!
    level: Int!
    order: Int!
    active: Boolean!
    seo: CategorySEO!
    productCount: Int!
    breadcrumb: [CategoryBreadcrumb!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CategoryBreadcrumb {
    id: ID!
    name: String!
    slug: String!
    level: Int!
  }

  type CategorySEO {
    title: String
    description: String
    keywords: [String!]!
  }

  # Review Types
  type Review {
    id: ID!
    product: Product!
    user: User!
    rating: Int!
    title: String!
    comment: String!
    pros: [String!]!
    cons: [String!]!
    images: [ReviewImage!]!
    verified: Boolean!
    helpfulVotes: Int!
    helpfulBy: [ID!]!
    status: ReviewStatus!
    replies: [ReviewReply!]!
    moderatedBy: User
    moderatedAt: DateTime
    moderationNote: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ReviewImage {
    url: String!
    alt: String
    caption: String
  }

  type ReviewReply {
    id: ID!
    user: User!
    comment: String!
    createdAt: DateTime!
  }

  type ReviewConnection {
    edges: [ReviewEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ReviewEdge {
    node: Review!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # User Type (from user service)
  type User @key(fields: "id") {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    avatar: String
  }

  # Enums
  enum ProductStatus {
    ACTIVE
    DRAFT
    ARCHIVED
    DELETED
  }

  enum ProductVisibility {
    PUBLIC
    PRIVATE
    HIDDEN
  }

  enum ProductAttributeType {
    TEXT
    NUMBER
    BOOLEAN
    SELECT
    MULTI_SELECT
    DATE
    URL
  }

  enum ReviewStatus {
    PENDING
    APPROVED
    REJECTED
    SPAM
  }

  enum ReviewSortBy {
    NEWEST
    OLDEST
    HIGHEST_RATING
    LOWEST_RATING
    MOST_HELPFUL
  }

  enum ProductSortBy {
    NAME_A_Z
    NAME_Z_A
    PRICE_LOW_HIGH
    PRICE_HIGH_LOW
    NEWEST
    OLDEST
    RATING_HIGH_LOW
    POPULARITY
  }

  # Input Types
  input ProductSearchInput {
    query: String
    category: ID
    brand: String
    minPrice: Float
    maxPrice: Float
    rating: Int
    tags: [String!]
    sortBy: ProductSortBy
    page: Int = 1
    limit: Int = 20
    featured: Boolean
    onSale: Boolean
    inStock: Boolean
  }

  input CreateProductInput {
    name: String!
    description: String!
    shortDescription: String
    sku: String!
    price: Float!
    originalPrice: Float
    currency: String = "USD"
    images: [String!]!
    category: ID!
    subcategory: ID
    brand: String
    tags: [String!] = []
    attributes: [ProductAttributeInput!] = []
    inventory: ProductInventoryInput!
    shipping: ProductShippingInput!
    seo: ProductSEOInput
    featured: Boolean = false
    visibility: ProductVisibility = PUBLIC
    saleStartDate: DateTime
    saleEndDate: DateTime
  }

  input ProductAttributeInput {
    name: String!
    value: String!
    type: ProductAttributeType!
  }

  input ProductInventoryInput {
    quantity: Int!
    lowStockThreshold: Int = 5
    trackQuantity: Boolean = true
    allowBackorder: Boolean = false
    sku: String
    barcode: String
    weight: Float
    dimensions: ProductDimensionsInput
  }

  input ProductDimensionsInput {
    length: Float!
    width: Float!
    height: Float!
    unit: String = "cm"
  }

  input ProductShippingInput {
    weight: Float!
    dimensions: ProductDimensionsInput!
    freeShipping: Boolean = false
    shippingClass: String
    estimatedDeliveryDays: Int
  }

  input ProductSEOInput {
    title: String
    description: String
    keywords: [String!] = []
    canonicalUrl: String
  }

  input UpdateProductInput {
    name: String
    description: String
    shortDescription: String
    price: Float
    originalPrice: Float
    images: [String!]
    category: ID
    subcategory: ID
    brand: String
    tags: [String!]
    attributes: [ProductAttributeInput!]
    inventory: ProductInventoryInput
    shipping: ProductShippingInput
    seo: ProductSEOInput
    status: ProductStatus
    featured: Boolean
    visibility: ProductVisibility
    saleStartDate: DateTime
    saleEndDate: DateTime
  }

  input CreateCategoryInput {
    name: String!
    description: String
    image: String
    parent: ID
    order: Int = 0
    active: Boolean = true
    seo: CategorySEOInput
  }

  input CategorySEOInput {
    title: String
    description: String
    keywords: [String!] = []
  }

  input UpdateCategoryInput {
    name: String
    description: String
    image: String
    parent: ID
    order: Int
    active: Boolean
    seo: CategorySEOInput
  }

  input CreateReviewInput {
    product: ID!
    rating: Int!
    title: String!
    comment: String!
    pros: [String!] = []
    cons: [String!] = []
    images: [ReviewImageInput!] = []
  }

  input ReviewImageInput {
    url: String!
    alt: String
    caption: String
  }

  # Query Types
  type Query {
    # Product queries
    products(input: ProductSearchInput): ProductSearchResult!
    product(id: ID, slug: String, sku: String): Product
    featuredProducts(limit: Int = 12): [Product!]!

    # Category queries
    categories(tree: Boolean = false, includeProductCount: Boolean = false): [Category!]!
    category(id: ID, slug: String): Category
    featuredCategories(limit: Int = 8): [Category!]!

    # Review queries
    reviews(productId: ID!, limit: Int = 10, offset: Int = 0): [Review!]!
    review(id: ID!): Review
    productRatingStats(productId: ID!): RatingStats!
    userReviews(limit: Int = 10, offset: Int = 0): [Review!]!
  }

  # Mutation Types
  type Mutation {
    # Product mutations (Admin only)
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    updateProductInventory(id: ID!, quantity: Int!): Product!

    # Category mutations (Admin only)
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    # Review mutations
    createReview(input: CreateReviewInput!): Review!
    updateReviewStatus(id: ID!, status: ReviewStatus!): Review!
    markReviewHelpful(id: ID!): Review!
    markReviewUnhelpful(id: ID!): Review!
    deleteReview(id: ID!): Boolean!
  }

  # Result Types
  type ProductSearchResult {
    products: [Product!]!
    totalCount: Int!
    pageInfo: PageInfo!
    filters: ProductFilters!
  }

  type ProductFilters {
    categories: [Category!]!
    brands: [String!]!
    priceRange: PriceRange!
    ratings: [RatingFilter!]!
    tags: [String!]!
  }

  type PriceRange {
    min: Float!
    max: Float!
  }

  type RatingFilter {
    rating: Int!
    count: Int!
  }

  type RatingStats {
    average: Float!
    total: Int!
    distribution: [RatingDistribution!]!
  }
`;