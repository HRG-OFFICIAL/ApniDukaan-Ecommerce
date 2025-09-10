import { gql } from '@apollo/client';

// Order Subscriptions
export const ORDER_STATUS_UPDATED = gql`
  subscription OrderStatusUpdated($orderId: ID!) {
    orderStatusUpdated(orderId: $orderId) {
      id
      orderNumber
      status
      updatedAt
      tracking {
        status
        carrier
        trackingNumber
        estimatedDelivery
      }
    }
  }
`;

export const ORDER_CREATED = gql`
  subscription OrderCreated {
    orderCreated {
      id
      orderNumber
      status
      total
      customer {
        id
        name
        email
      }
      createdAt
    }
  }
`;

// Cart Subscriptions
export const CART_UPDATED = gql`
  subscription CartUpdated {
    cartUpdated {
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

// Product Subscriptions
export const PRODUCT_STOCK_UPDATED = gql`
  subscription ProductStockUpdated($productId: ID!) {
    productStockUpdated(productId: $productId) {
      id
      name
      stock
      updatedAt
    }
  }
`;

export const PRODUCT_PRICE_UPDATED = gql`
  subscription ProductPriceUpdated($productId: ID!) {
    productPriceUpdated(productId: $productId) {
      id
      name
      price
      originalPrice
      updatedAt
    }
  }
`;

// Notification Subscriptions
export const NOTIFICATION_RECEIVED = gql`
  subscription NotificationReceived {
    notificationReceived {
      id
      type
      title
      message
      data
      isRead
      createdAt
    }
  }
`;

// Admin Subscriptions
export const ADMIN_ORDER_UPDATED = gql`
  subscription AdminOrderUpdated {
    adminOrderUpdated {
      id
      orderNumber
      status
      total
      customer {
        id
        name
        email
      }
      items {
        id
        product {
          id
          name
        }
        quantity
        price
      }
      updatedAt
    }
  }
`;

export const ADMIN_USER_UPDATED = gql`
  subscription AdminUserUpdated {
    adminUserUpdated {
      id
      email
      name
      role
      isActive
      lastLoginAt
      updatedAt
    }
  }
`;

export const ADMIN_PRODUCT_UPDATED = gql`
  subscription AdminProductUpdated {
    adminProductUpdated {
      id
      name
      price
      stock
      isActive
      updatedAt
    }
  }
`;

// Chat/Support Subscriptions
export const MESSAGE_RECEIVED = gql`
  subscription MessageReceived($conversationId: ID!) {
    messageReceived(conversationId: $conversationId) {
      id
      content
      sender {
        id
        name
        type
      }
      createdAt
    }
  }
`;

export const CONVERSATION_UPDATED = gql`
  subscription ConversationUpdated {
    conversationUpdated {
      id
      status
      lastMessage {
        id
        content
        sender {
          id
          name
        }
        createdAt
      }
      updatedAt
    }
  }
`;
