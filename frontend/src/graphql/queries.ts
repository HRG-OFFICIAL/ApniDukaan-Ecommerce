import { gql } from '@apollo/client';

// Product Queries
export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilter, $sort: ProductSort, $search: String, $limit: Int, $offset: Int) {
    products(filter: $filter, sort: $sort, search: $search, limit: $limit, offset: $offset) {
      id
      name
      description
      shortDescription
      price
      originalPrice
      images
      category
      subcategory
      brand
      rating
      reviewCount
      stock
      sku
      colors
      sizes
      isBestseller
      isOnSale
      isNew
      isFeatured
      isActive
      tags
      createdAt
      updatedAt
    }
    totalCount
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price
      originalPrice
      images
      category
      rating
      reviewCount
      stock
      isBestseller
      isOnSale
      isNew
      specifications
      reviews {
        id
        rating
        comment
        user {
          name
        }
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      description
      image
      productCount
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($query: String!, $filters: ProductFilter, $sort: ProductSort, $limit: Int, $offset: Int) {
    searchProducts(query: $query, filters: $filters, sort: $sort, limit: $limit, offset: $offset) {
      id
      name
      description
      price
      originalPrice
      images
      category
      rating
      reviewCount
      stock
      isBestseller
      isOnSale
      isNew
    }
  }
`;

// User Queries
export const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      email
      name
      avatar
      phone
      addresses {
        id
        type
        street
        city
        state
        zipCode
        country
        isDefault
      }
      preferences {
        newsletter
        notifications
        language
        currency
      }
      createdAt
    }
  }
`;

export const GET_USER_ORDERS = gql`
  query GetUserOrders($filter: OrderFilter, $sort: OrderSort, $limit: Int, $offset: Int) {
    myOrders(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
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
      updatedAt
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      status
      total
      subtotal
      tax
      shipping
      discount
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
      billingAddress {
        street
        city
        state
        zipCode
        country
      }
      payment {
        method
        status
        transactionId
      }
      tracking {
        status
        carrier
        trackingNumber
        estimatedDelivery
      }
      createdAt
      updatedAt
    }
  }
`;

// Cart Queries
export const GET_CART = gql`
  query GetCart {
    cart {
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

export const GET_WISHLIST = gql`
  query GetWishlist {
    wishlist {
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

// Admin Queries
export const GET_ALL_ORDERS = gql`
  query GetAllOrders($filter: OrderFilter, $sort: OrderSort, $limit: Int, $offset: Int) {
    orders(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
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
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_USERS = gql`
  query GetAllUsers($filter: UserFilter, $sort: UserSort, $limit: Int, $offset: Int) {
    users(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
      id
      email
      name
      role
      isActive
      createdAt
      lastLoginAt
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalOrders
      totalRevenue
      totalUsers
      totalProducts
      recentOrders {
        id
        orderNumber
        customer
        total
        status
        createdAt
      }
      topProducts {
        id
        name
        sales
        revenue
      }
    }
  }
`;

// Additional Admin Queries
export const GET_ALL_PRODUCTS = gql`
  query GetAllProducts($filter: ProductFilter, $sort: ProductSort, $search: String, $limit: Int, $offset: Int) {
    products(filter: $filter, sort: $sort, search: $search, limit: $limit, offset: $offset) {
      id
      name
      description
      price
      originalPrice
      images
      category
      subcategory
      brand
      stock
      sku
      isActive
      isFeatured
      isOnSale
      rating
      reviewCount
      tags
      colors
      sizes
      createdAt
      updatedAt
    }
    totalCount
  }
`;

export const GET_PRODUCT_ANALYTICS = gql`
  query GetProductAnalytics($period: String) {
    productAnalytics(period: $period) {
      totalProducts
      activeProducts
      outOfStockProducts
      lowStockProducts
      topSellingProducts {
        id
        name
        sales
        revenue
      }
      categoryBreakdown {
        category
        count
        revenue
      }
    }
  }
`;

export const GET_ORDER_ANALYTICS = gql`
  query GetOrderAnalytics($period: String) {
    orderAnalytics(period: $period) {
      totalOrders
      totalRevenue
      averageOrderValue
      ordersByStatus {
        status
        count
      }
      ordersByPaymentMethod {
        method
        count
      }
      topCustomers {
        id
        name
        email
        orderCount
        totalSpent
      }
    }
  }
`;

export const GET_USER_ANALYTICS = gql`
  query GetUserAnalytics($period: String) {
    userAnalytics(period: $period) {
      totalUsers
      activeUsers
      newUsers
      usersByRole {
        role
        count
      }
      userGrowth {
        date
        count
      }
      topUsers {
        id
        name
        email
        orderCount
        totalSpent
        lastLoginAt
      }
    }
  }
`;

export const GET_SYSTEM_LOGS = gql`
  query GetSystemLogs($filter: LogFilter, $limit: Int, $offset: Int) {
    systemLogs(filter: $filter, limit: $limit, offset: $offset) {
      id
      level
      message
      timestamp
      userId
      action
      metadata
    }
    totalCount
  }
`;

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($filter: AuditFilter, $limit: Int, $offset: Int) {
    auditLogs(filter: $filter, limit: $limit, offset: $offset) {
      id
      userId
      action
      resource
      resourceId
      timestamp
      ipAddress
      userAgent
      metadata
    }
    totalCount
  }
`;