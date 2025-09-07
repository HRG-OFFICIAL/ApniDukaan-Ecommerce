import { gql } from 'apollo-server-express';

export const userTypeDefs = gql`
  extend type Query {
    me: User
    users(limit: Int = 20, offset: Int = 0, search: String): UsersResponse
    user(id: ID!): User
  }

  extend type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): TokenResponse!
    logout: Boolean!
    logoutAll: Boolean!
    
    # Password Management
    forgotPassword(email: String!): Boolean!
    resetPassword(input: ResetPasswordInput!): Boolean!
    changePassword(input: ChangePasswordInput!): Boolean!
    
    # Email Verification
    sendEmailVerification: Boolean!
    verifyEmail(token: String!): Boolean!
    
    # User Profile
    updateProfile(input: UpdateUserInput!): User!
    uploadAvatar(file: Upload!): User!
    deleteAccount: Boolean!
    
    # Address Management
    addAddress(input: CreateAddressInput!): Address!
    updateAddress(id: ID!, input: UpdateAddressInput!): Address!
    deleteAddress(id: ID!): Boolean!
    setDefaultAddress(id: ID!): Boolean!
    
    # Wishlist Management
    addToWishlist(productId: ID!): Boolean!
    removeFromWishlist(productId: ID!): Boolean!
    clearWishlist: Boolean!
  }

  # User type with Federation key directive
  type User @key(fields: "id") {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    role: UserRole!
    isEmailVerified: Boolean!
    avatar: String
    lastLogin: DateTime
    addresses: [Address!]!
    wishlist: Wishlist
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    success: Boolean!
    message: String
    user: User!
    tokens: TokenPair!
  }

  type TokenPair {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  type TokenResponse {
    success: Boolean!
    accessToken: String!
    expiresIn: Int!
  }

  type Address {
    id: ID!
    type: AddressType!
    firstName: String!
    lastName: String!
    street: String!
    street2: String
    city: String!
    state: String!
    zipCode: String!
    country: String!
    phone: String
    isDefault: Boolean!
  }

  type Wishlist {
    id: ID!
    items: [WishlistItem!]!
    totalItems: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WishlistItem {
    productId: ID!
    addedAt: DateTime!
  }

  type UsersResponse {
    users: [User!]!
    total: Int!
    hasMore: Boolean!
  }

  enum UserRole {
    CUSTOMER
    ADMIN
    MODERATOR
  }

  enum AddressType {
    HOME
    WORK
    OTHER
  }

  # Input types
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ResetPasswordInput {
    token: String!
    password: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    phone: String
    dateOfBirth: String
    gender: String
    preferences: UserPreferencesInput
  }

  input UserPreferencesInput {
    newsletter: Boolean
    notifications: NotificationPreferencesInput
    theme: String
    language: String
    currency: String
  }

  input NotificationPreferencesInput {
    email: Boolean
    push: Boolean
    sms: Boolean
  }

  input CreateAddressInput {
    type: AddressType!
    firstName: String!
    lastName: String!
    street: String!
    street2: String
    city: String!
    state: String!
    zipCode: String!
    country: String!
    phone: String
    isDefault: Boolean
  }

  input UpdateAddressInput {
    type: AddressType
    firstName: String
    lastName: String
    street: String
    street2: String
    city: String
    state: String
    zipCode: String
    country: String
    phone: String
    isDefault: Boolean
  }

  # Custom scalars
  scalar DateTime
  scalar Upload
`;
