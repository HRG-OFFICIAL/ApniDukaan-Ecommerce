import { gql } from 'apollo-server-express';

export const userTypeDefs = gql`
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    isEmailVerified: Boolean!
    role: UserRole!
    googleId: String
    avatar: String
    lastLogin: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum UserRole {
    CUSTOMER
    ADMIN
    SUPER_ADMIN
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type RefreshTokenPayload {
    accessToken: String!
    refreshToken: String!
  }

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

  input UpdateProfileInput {
    firstName: String
    lastName: String
    avatar: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  input VerifyEmailInput {
    token: String!
  }

  type Query {
    me: User
    users(limit: Int, offset: Int, role: UserRole): [User!]!
    user(id: ID!): User
    verifyToken(token: String!): Boolean!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): RefreshTokenPayload!
    logout: Boolean!
    logoutAll: Boolean!
    
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(input: ChangePasswordInput!): Boolean!
    
    forgotPassword(input: ForgotPasswordInput!): Boolean!
    resetPassword(input: ResetPasswordInput!): Boolean!
    
    verifyEmail(input: VerifyEmailInput!): Boolean!
    resendVerificationEmail: Boolean!
    
    # Admin only mutations
    updateUserRole(userId: ID!, role: UserRole!): User!
    deleteUser(userId: ID!): Boolean!
  }

  scalar DateTime
`;
