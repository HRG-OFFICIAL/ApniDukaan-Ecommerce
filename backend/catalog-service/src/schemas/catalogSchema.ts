import { gql } from 'apollo-server-express';

export const catalogTypeDefs = gql`
  type Product {
    id: ID!
    name: String!
    description: String!
    shortDescription: String
    price: Float!
    comparePrice: Float
    sku: String!
    barcode: String
    category: Category!
    subcategory: Category
    brand: String
    tags: [String!]!
    images: [ProductImage!]!
    variants: [ProductVariant!]!
    specifications: [ProductSpecification!]!
    inventory: ProductInventory!
    dimensions: ProductDimensions
    seo: ProductSEO
    status: ProductStatus!
    featured: Boolean!
    rating: ProductRating!
    views: Int!
    salesCount: Int!
    availableInventory: Int!
    discountPercentage: Int!
    isLowStock: Boolean!
    isOutOfStock: Boolean!
    publishedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    description: String
    slug: String!
    parent: Category
    level: Int!
    path: String!
    image: CategoryImage
    icon: String
    isActive: Boolean!
    isFeatured: Boolean!
    sortOrder: Int!
    seo: CategorySEO
    productCount: Int!
    children: [Category!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Review {
    id: ID!
    product: Product!
    user: ID!
    userName: String!
    rating: Int!
    title: String!
    content: String!
    images: [ReviewImage!]!
    verified: Boolean!
    status: ReviewStatus!
    helpfulVotes: ReviewVotes!
    unhelpfulVotes: ReviewVotes!
    helpfulnessRatio: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ProductImage {
    url: String!
    alt: String!
    isPrimary: Boolean!
  }

  type ProductVariant {
    name: String!
    options: [ProductVariantOption!]!
  }

  type ProductVariantOption {
    name: String!
    value: String!
    priceModifier: Float!
  }

  type ProductSpecification {
    name: String!
    value: String!
  }

  type ProductInventory {
    quantity: Int!
    lowStockThreshold: Int!
    trackInventory: Boolean!
  }

  type ProductDimensions {
    length: Float
    width: Float
    height: Float
    weight: Float
    unit: String
    weightUnit: String
  }

  type ProductSEO {
    title: String
    description: String
    keywords: [String!]!
    slug: String
  }

  type ProductRating {
    average: Float!
    count: Int!
  }

  type CategoryImage {
    url: String!
    alt: String!
  }

  type CategorySEO {
    title: String
    description: String
    keywords: [String!]!
  }

  type ReviewImage {
    url: String!
    alt: String!
  }

  type ReviewVotes {
    count: Int!
  }

  type RatingStats {
    averageRating: Float!
    totalReviews: Int!
    ratingDistribution: RatingDistribution!
  }

  type RatingDistribution {
    five: Int!
    four: Int!
    three: Int!
    two: Int!
    one: Int!
  }

  type ProductSearchResult {
    products: [Product!]!
    total: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
  }

  enum ProductStatus {
    DRAFT
    ACTIVE
    INACTIVE
    ARCHIVED
  }

  enum ReviewStatus {
    PENDING
    APPROVED
    REJECTED
  }

  enum SortBy {
    NEWEST
    OLDEST
    PRICE_LOW_HIGH
    PRICE_HIGH_LOW
    RATING
    POPULARITY
    NAME_A_Z
    NAME_Z_A
  }

  input ProductSearchInput {
    query: String
    category: ID
    minPrice: Float
    maxPrice: Float
    brand: String
    tags: [String!]
    inStock: Boolean
    featured: Boolean
    sortBy: SortBy
    page: Int
    limit: Int
  }

  input CreateProductInput {
    name: String!
    description: String!
    shortDescription: String
    price: Float!
    comparePrice: Float
    sku: String!
    barcode: String
    category: ID!
    subcategory: ID
    brand: String
    tags: [String!]
    images: [ProductImageInput!]!
    variants: [ProductVariantInput!]
    specifications: [ProductSpecificationInput!]
    inventory: ProductInventoryInput!
    dimensions: ProductDimensionsInput
    seo: ProductSEOInput
    status: ProductStatus
    featured: Boolean
  }

  input UpdateProductInput {
    name: String
    description: String
    shortDescription: String
    price: Float
    comparePrice: Float
    sku: String
    barcode: String
    category: ID
    subcategory: ID
    brand: String
    tags: [String!]
    images: [ProductImageInput!]
    variants: [ProductVariantInput!]
    specifications: [ProductSpecificationInput!]
    inventory: ProductInventoryInput
    dimensions: ProductDimensionsInput
    seo: ProductSEOInput
    status: ProductStatus
    featured: Boolean
  }

  input ProductImageInput {
    url: String!
    alt: String
    isPrimary: Boolean
  }

  input ProductVariantInput {
    name: String!
    options: [ProductVariantOptionInput!]!
  }

  input ProductVariantOptionInput {
    name: String!
    value: String!
    priceModifier: Float
  }

  input ProductSpecificationInput {
    name: String!
    value: String!
  }

  input ProductInventoryInput {
    quantity: Int!
    lowStockThreshold: Int
    trackInventory: Boolean
  }

  input ProductDimensionsInput {
    length: Float
    width: Float
    height: Float
    weight: Float
    unit: String
    weightUnit: String
  }

  input ProductSEOInput {
    title: String
    description: String
    keywords: [String!]
    slug: String
  }

  input CreateCategoryInput {
    name: String!
    description: String
    slug: String
    parent: ID
    image: CategoryImageInput
    icon: String
    isActive: Boolean
    isFeatured: Boolean
    sortOrder: Int
    seo: CategorySEOInput
  }

  input UpdateCategoryInput {
    name: String
    description: String
    slug: String
    parent: ID
    image: CategoryImageInput
    icon: String
    isActive: Boolean
    isFeatured: Boolean
    sortOrder: Int
    seo: CategorySEOInput
  }

  input CategoryImageInput {
    url: String!
    alt: String
  }

  input CategorySEOInput {
    title: String
    description: String
    keywords: [String!]
  }

  input CreateReviewInput {
    product: ID!
    rating: Int!
    title: String!
    content: String!
    images: [ReviewImageInput!]
  }

  input ReviewImageInput {
    url: String!
    alt: String
  }

  type Query {
    # Product queries
    products(input: ProductSearchInput): ProductSearchResult!
    product(id: ID, slug: String, sku: String): Product
    featuredProducts(limit: Int): [Product!]!
    
    # Category queries
    categories: [Category!]!
    category(id: ID, slug: String): Category
    categoryTree: [Category!]!
    featuredCategories(limit: Int): [Category!]!
    
    # Review queries
    reviews(productId: ID!, limit: Int, offset: Int): [Review!]!
    review(id: ID!): Review
    productRatingStats(productId: ID!): RatingStats!
    userReviews(limit: Int, offset: Int): [Review!]!
  }

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

  scalar DateTime
`;
