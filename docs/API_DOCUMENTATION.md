# ApniDukaan API Documentation

## Overview

The ApniDukaan platform provides both REST and GraphQL APIs for comprehensive e-commerce functionality. All APIs are accessible through the API Gateway at `http://localhost:4000`.

## Base URLs

- **API Gateway**: `http://localhost:4000`
- **Frontend**: `http://localhost:3000`
- **GraphQL Endpoint**: `http://localhost:4000/graphql`

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## REST API Endpoints

### Authentication Service

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+1234567890"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "password": "newpassword"
}
```

### Product Catalog Service

#### Get All Products
```http
GET /api/products?page=1&limit=10&category=electronics&sort=price&order=asc
```

#### Get Product by ID
```http
GET /api/products/:id
```

#### Get Product by Slug
```http
GET /api/products/slug/:slug
```

#### Get Featured Products
```http
GET /api/products/featured
```

#### Get Related Products
```http
GET /api/products/:id/related
```

#### Create Product (Admin)
```http
POST /api/products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with advanced features",
  "price": 999,
  "category": "electronics",
  "images": ["image1.jpg", "image2.jpg"],
  "inventory": 100,
  "specifications": {
    "color": "Space Black",
    "storage": "256GB"
  }
}
```

#### Update Product (Admin)
```http
PUT /api/products/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro Max",
  "price": 1099
}
```

#### Delete Product (Admin)
```http
DELETE /api/products/:id
Authorization: Bearer <admin-token>
```

### Shopping Cart Service

#### Get Cart
```http
GET /api/cart
Authorization: Bearer <user-token>
```

#### Add Item to Cart
```http
POST /api/cart/items
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "productId": "product-id",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/items/:itemId
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Cart Item
```http
DELETE /api/cart/items/:itemId
Authorization: Bearer <user-token>
```

#### Clear Cart
```http
DELETE /api/cart
Authorization: Bearer <user-token>
```

### Order Service

#### Create Order
```http
POST /api/orders
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-id",
      "quantity": 2,
      "price": 199.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}
```

#### Get User Orders
```http
GET /api/orders
Authorization: Bearer <user-token>
```

#### Get Order by ID
```http
GET /api/orders/:id
Authorization: Bearer <user-token>
```

#### Update Order Status (Admin)
```http
PUT /api/orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRK123456789"
}
```

### Payment Service

#### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "amount": 199.99,
  "currency": "USD",
  "orderId": "order-id"
}
```

#### Process Payment
```http
POST /api/payments/process
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890",
  "orderId": "order-id"
}
```

#### Get Payment Methods
```http
GET /api/payments/methods/:customerId
Authorization: Bearer <user-token>
```

### Search Service

#### Search Products
```http
GET /api/search?q=iphone&category=electronics&minPrice=100&maxPrice=1000&sort=price&order=asc
```

#### Get Popular Searches
```http
GET /api/search/popular
```

#### Get Search Suggestions
```http
GET /api/search/suggestions?q=iph
```

### Notification Service

#### Send Welcome Email
```http
POST /api/notifications/welcome
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### Send Order Confirmation
```http
POST /api/notifications/order-confirmation
Content-Type: application/json

{
  "email": "user@example.com",
  "orderId": "order-id",
  "orderDetails": {
    "total": 199.99,
    "items": ["iPhone 15 Pro"]
  }
}
```

#### Send SMS
```http
POST /api/notifications/sms
Content-Type: application/json

{
  "phone": "+1234567890",
  "message": "Your order has been shipped!",
  "type": "shipping_update"
}
```

## GraphQL API

### Schema Overview

```graphql
type Query {
  products(filter: ProductFilter, pagination: PaginationInput): ProductConnection
  product(id: ID!): Product
  productBySlug(slug: String!): Product
  categories: [Category!]!
  cart: Cart
  orders(filter: OrderFilter): [Order!]!
  order(id: ID!): Order
  search(query: String!, filters: SearchFilters): SearchResult
}

type Mutation {
  # Authentication
  register(input: RegisterInput!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!
  forgotPassword(email: String!): Boolean!
  resetPassword(token: String!, password: String!): Boolean!
  
  # Cart
  addToCart(productId: ID!, quantity: Int!): Cart!
  updateCartItem(itemId: ID!, quantity: Int!): Cart!
  removeFromCart(itemId: ID!): Cart!
  clearCart: Cart!
  
  # Orders
  createOrder(input: CreateOrderInput!): Order!
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!
  
  # Products (Admin)
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
  deleteProduct(id: ID!): Boolean!
}

type Subscription {
  orderStatusUpdated(orderId: ID!): Order!
  newProductAdded: Product!
}
```

### Example Queries

#### Get Products with Filtering
```graphql
query GetProducts($filter: ProductFilter, $pagination: PaginationInput) {
  products(filter: $filter, pagination: $pagination) {
    edges {
      node {
        id
        name
        price
        description
        images
        category {
          id
          name
        }
        inventory
        averageRating
        reviewCount
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

#### Get User Cart
```graphql
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
      }
      quantity
      totalPrice
    }
    totalItems
    totalPrice
  }
}
```

#### Create Order
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    status
    total
    items {
      product {
        name
        price
      }
      quantity
    }
    shippingAddress {
      street
      city
      state
      zipCode
    }
    createdAt
  }
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **Search endpoints**: 50 requests per minute per user
- **Admin endpoints**: 200 requests per minute per admin

## Pagination

Most list endpoints support pagination:

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field
- `order`: Sort direction (`asc` or `desc`)

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhooks

The platform supports webhooks for real-time updates:

### Available Webhooks
- `order.created`: When a new order is created
- `order.updated`: When an order status changes
- `payment.completed`: When a payment is successful
- `product.updated`: When a product is updated

### Webhook Payload Example
```json
{
  "event": "order.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "orderId": "order_123456789",
    "customerId": "customer_123456789",
    "total": 199.99,
    "status": "pending"
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @apnidukaan/sdk
```

```javascript
import { ApniDukaanClient } from '@apnidukaan/sdk';

const client = new ApniDukaanClient({
  apiUrl: 'http://localhost:4000',
  apiKey: 'your-api-key'
});

// Get products
const products = await client.products.list({
  category: 'electronics',
  limit: 10
});

// Create order
const order = await client.orders.create({
  items: [{ productId: 'prod_123', quantity: 2 }],
  shippingAddress: { /* address */ }
});
```

## Testing

### API Testing with Postman
Import the Postman collection: [Download Collection](./postman/ApniDukaan-API.postman_collection.json)

### API Testing with cURL
```bash
# Get products
curl -X GET "http://localhost:4000/api/products?limit=5" \
  -H "Authorization: Bearer your-token"

# Create order
curl -X POST "http://localhost:4000/api/orders" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"prod_123","quantity":2}]}'
```

## Support

For API support and questions:
- **Email**: api-support@apnidukaan.com
- **Documentation**: [API Docs](https://docs.apnidukaan.com)
- **Status Page**: [API Status](https://status.apnidukaan.com)

---

*Last updated: January 2024*
