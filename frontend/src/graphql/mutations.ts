import { gql } from '@apollo/client';

// Authentication Mutations
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        email
        name
        role
        avatar
        phone
        createdAt
        updatedAt
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        name
        role
        avatar
        phone
        createdAt
        updatedAt
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password)
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

// User Profile Mutations
export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      name
      avatar
      phone
      preferences {
        newsletter
        notifications
        language
        currency
      }
    }
  }
`;

export const ADD_ADDRESS = gql`
  mutation AddAddress($input: AddressInput!) {
    addAddress(input: $input) {
      id
      type
      street
      city
      state
      zipCode
      country
      isDefault
    }
  }
`;

export const UPDATE_ADDRESS = gql`
  mutation UpdateAddress($id: ID!, $input: AddressInput!) {
    updateAddress(id: $id, input: $input) {
      id
      type
      street
      city
      state
      zipCode
      country
      isDefault
    }
  }
`;

export const DELETE_ADDRESS = gql`
  mutation DeleteAddress($id: ID!) {
    deleteAddress(id: $id)
  }
`;

// Cart Mutations
export const ADD_TO_CART = gql`
  mutation AddToCart($productId: ID!, $quantity: Int!) {
    addToCart(productId: $productId, quantity: $quantity) {
      id
      items {
        id
        product {
          id
          name
          price
          images
          stock
        }
        quantity
        price
      }
      subtotal
      tax
      shipping
      discount
      total
      itemCount
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($itemId: ID!, $quantity: Int!) {
    updateCartItem(itemId: $itemId, quantity: $quantity) {
      id
      items {
        id
        product {
          id
          name
          price
          images
          stock
        }
        quantity
        price
      }
      subtotal
      tax
      shipping
      discount
      total
      itemCount
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($itemId: ID!) {
    removeFromCart(itemId: $itemId) {
      id
      items {
        id
        product {
          id
          name
          price
          images
          stock
        }
        quantity
        price
      }
      subtotal
      tax
      shipping
      discount
      total
      itemCount
    }
  }
`;

export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart
  }
`;

// Wishlist Mutations
export const ADD_TO_WISHLIST = gql`
  mutation AddToWishlist($productId: ID!) {
    addToWishlist(productId: $productId) {
      id
      product {
        id
        name
        price
        originalPrice
        images
        rating
        reviewCount
        stock
        isOnSale
      }
      createdAt
    }
  }
`;

export const REMOVE_FROM_WISHLIST = gql`
  mutation RemoveFromWishlist($productId: ID!) {
    removeFromWishlist(productId: $productId)
  }
`;

// Order Mutations
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
      total
      items {
        id
        product {
          id
          name
          images
        }
        quantity
        price
      }
      shippingAddress {
        street
        city
        state
        zipCode
        country
      }
      createdAt
    }
  }
`;

export const CANCEL_ORDER = gql`
  mutation CancelOrder($id: ID!, $reason: String) {
    cancelOrder(id: $id, reason: $reason) {
      id
      status
      updatedAt
    }
  }
`;

// Payment Mutations
export const CREATE_PAYMENT_INTENT = gql`
  mutation CreatePaymentIntent($orderId: ID!, $paymentMethod: PaymentMethod!) {
    createPaymentIntent(orderId: $orderId, paymentMethod: $paymentMethod) {
      clientSecret
      paymentIntentId
    }
  }
`;

export const CONFIRM_PAYMENT = gql`
  mutation ConfirmPayment($paymentIntentId: String!) {
    confirmPayment(paymentIntentId: $paymentIntentId) {
      success
      order {
        id
        status
      }
    }
  }
`;

// Review Mutations
export const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      rating
      comment
      user {
        name
      }
      createdAt
    }
  }
`;

export const UPDATE_REVIEW = gql`
  mutation UpdateReview($id: ID!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      id
      rating
      comment
      updatedAt
    }
  }
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($id: ID!) {
    deleteReview(id: $id)
  }
`;

// Admin Mutations
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      price
      originalPrice
      images
      category
      stock
      isActive
      createdAt
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      price
      originalPrice
      images
      category
      stock
      isActive
      updatedAt
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($id: ID!, $role: UserRole!) {
    updateUserRole(id: $id, role: $role) {
      id
      role
      updatedAt
    }
  }
`;

// Additional Admin Mutations
export const BULK_UPDATE_PRODUCTS = gql`
  mutation BulkUpdateProducts($productIds: [ID!]!, $updates: ProductUpdateInput!) {
    bulkUpdateProducts(productIds: $productIds, updates: $updates) {
      success
      updatedCount
      errors
    }
  }
`;

export const BULK_DELETE_PRODUCTS = gql`
  mutation BulkDeleteProducts($productIds: [ID!]!) {
    bulkDeleteProducts(productIds: $productIds) {
      success
      deletedCount
      errors
    }
  }
`;

export const BULK_UPDATE_ORDERS = gql`
  mutation BulkUpdateOrders($orderIds: [ID!]!, $status: OrderStatus!) {
    bulkUpdateOrders(orderIds: $orderIds, status: $status) {
      success
      updatedCount
      errors
    }
  }
`;

export const BULK_UPDATE_USERS = gql`
  mutation BulkUpdateUsers($userIds: [ID!]!, $updates: UserUpdateInput!) {
    bulkUpdateUsers(userIds: $userIds, updates: $updates) {
      success
      updatedCount
      errors
    }
  }
`;

export const BULK_DELETE_USERS = gql`
  mutation BulkDeleteUsers($userIds: [ID!]!) {
    bulkDeleteUsers(userIds: $userIds) {
      success
      deletedCount
      errors
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      name
      role
      isActive
      createdAt
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      name
      role
      isActive
      phone
      updatedAt
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const ACTIVATE_USER = gql`
  mutation ActivateUser($id: ID!) {
    activateUser(id: $id) {
      id
      isActive
      updatedAt
    }
  }
`;

export const DEACTIVATE_USER = gql`
  mutation DeactivateUser($id: ID!) {
    deactivateUser(id: $id) {
      id
      isActive
      updatedAt
    }
  }
`;

export const EXPORT_ORDERS = gql`
  mutation ExportOrders($filter: OrderFilter, $format: ExportFormat!) {
    exportOrders(filter: $filter, format: $format) {
      success
      downloadUrl
      expiresAt
    }
  }
`;

export const EXPORT_USERS = gql`
  mutation ExportUsers($filter: UserFilter, $format: ExportFormat!) {
    exportUsers(filter: $filter, format: $format) {
      success
      downloadUrl
      expiresAt
    }
  }
`;

export const EXPORT_PRODUCTS = gql`
  mutation ExportProducts($filter: ProductFilter, $format: ExportFormat!) {
    exportProducts(filter: $filter, format: $format) {
      success
      downloadUrl
      expiresAt
    }
  }
`;