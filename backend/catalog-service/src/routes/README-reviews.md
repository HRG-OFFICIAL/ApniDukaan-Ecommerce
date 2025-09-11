# Reviews REST API

The Reviews REST API provides comprehensive functionality for managing product reviews in the ApniDukaan e-commerce platform. This API handles review creation, moderation, voting, and analytics with proper authentication and authorization.

## Overview

The Reviews API is part of the Catalog Service and provides endpoints for:
- Creating and managing product reviews
- Review moderation and status management
- Helpful/unhelpful voting system
- Review replies and interactions
- Review analytics and summaries

## Base URL
```
/api/reviews
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Public Endpoints

#### GET /reviews
Get reviews with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)
- `product` (string, optional): Filter by product ID
- `user` (string, optional): Filter by user ID
- `rating` (number, optional): Filter by rating (1-5)
- `verified` (boolean, optional): Filter by verified purchase status
- `sort` (string, optional): Sort options
  - `newest` (default)
  - `oldest`
  - `rating_desc`
  - `rating_asc`
  - `helpful_desc`

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "product": {
          "_id": "product_id",
          "name": "Product Name",
          "slug": "product-slug",
          "images": ["image_url"]
        },
        "user": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "avatar_url"
        },
        "rating": 5,
        "title": "Great product!",
        "comment": "I love this product...",
        "pros": ["Great quality", "Fast delivery"],
        "cons": [],
        "verified": true,
        "helpfulVotes": 12,
        "replies": [],
        "createdAt": "2023-12-01T10:00:00Z",
        "updatedAt": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /reviews/:id
Get a single review by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "_id": "review_id",
      "product": { ... },
      "user": { ... },
      "rating": 5,
      "title": "Great product!",
      "comment": "I love this product...",
      "replies": [
        {
          "user": {
            "_id": "admin_id",
            "firstName": "Admin",
            "lastName": "User"
          },
          "comment": "Thank you for your feedback!",
          "createdAt": "2023-12-01T11:00:00Z"
        }
      ],
      "createdAt": "2023-12-01T10:00:00Z"
    }
  }
}
```

#### GET /reviews/product/:productId/summary
Get review summary statistics for a product.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalReviews": 150,
      "averageRating": 4.2,
      "ratingDistribution": {
        "1": 5,
        "2": 10,
        "3": 20,
        "4": 50,
        "5": 65
      },
      "verifiedReviews": 120,
      "recommendationPercentage": 77
    }
  }
}
```

### Authenticated User Endpoints

#### POST /reviews
Create a new review.

**Authentication Required:** Yes  
**Authorization:** User, Admin, Moderator

**Request Body:**
```json
{
  "product": "product_id",
  "rating": 5,
  "title": "Great product!",
  "comment": "I absolutely love this product. The quality is excellent and delivery was fast.",
  "pros": ["Great quality", "Fast delivery"],
  "cons": ["Price could be better"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review created successfully and is pending moderation",
  "data": {
    "review": {
      "_id": "review_id",
      "product": "product_id",
      "user": "user_id",
      "rating": 5,
      "title": "Great product!",
      "comment": "I absolutely love this product...",
      "status": "pending",
      "createdAt": "2023-12-01T10:00:00Z"
    }
  }
}
```

#### PUT /reviews/:id
Update an existing review.

**Authentication Required:** Yes  
**Authorization:** Review Owner, Admin, Moderator

**Request Body:**
```json
{
  "rating": 4,
  "title": "Updated review title",
  "comment": "Updated review comment with more details.",
  "pros": ["Updated pros"],
  "cons": ["Updated cons"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "review": { ... }
  }
}
```

#### DELETE /reviews/:id
Delete a review.

**Authentication Required:** Yes  
**Authorization:** Review Owner, Admin, Moderator

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

#### POST /reviews/:id/helpful
Mark a review as helpful.

**Authentication Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Review marked as helpful",
  "data": {
    "helpfulVotes": 13,
    "userVoted": true
  }
}
```

#### DELETE /reviews/:id/helpful
Remove helpful mark from a review.

**Authentication Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Helpful mark removed",
  "data": {
    "helpfulVotes": 12,
    "userVoted": false
  }
}
```

### Admin/Moderator Endpoints

#### POST /reviews/:id/reply
Add a reply to a review.

**Authentication Required:** Yes  
**Authorization:** Admin, Moderator

**Request Body:**
```json
{
  "comment": "Thank you for your feedback! We're glad you enjoyed the product."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reply added successfully",
  "data": {
    "reply": {
      "user": "admin_id",
      "comment": "Thank you for your feedback!",
      "createdAt": "2023-12-01T11:00:00Z"
    }
  }
}
```

#### PATCH /reviews/:id/status
Update review status (moderation).

**Authentication Required:** Yes  
**Authorization:** Admin, Moderator

**Request Body:**
```json
{
  "status": "approved",
  "moderationNote": "Review approved after verification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review status updated successfully",
  "data": {
    "review": {
      "_id": "review_id",
      "status": "approved",
      "moderatedBy": "admin_id",
      "moderatedAt": "2023-12-01T11:30:00Z",
      "moderationNote": "Review approved after verification"
    }
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate review)
- `500` - Internal Server Error

## Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "rating",
      "message": "Rating must be between 1 and 5"
    }
  ]
}
```

## Review Status Flow

1. **pending** - Initial status when review is created
2. **approved** - Review approved by moderator and visible to public
3. **rejected** - Review rejected by moderator and not visible

## Business Rules

### Review Creation
- Users can only create one review per product
- All reviews start with "pending" status and require moderation
- Rating must be between 1-5
- Title is required (max 200 characters)
- Comment must be 10-2000 characters
- Pros and cons are optional arrays

### Review Updates
- Only review owner or admin/moderator can update
- User updates reset status to "pending" for re-moderation
- Admin/moderator updates don't change status

### Helpful Voting
- Users can only vote once per review
- Users can change/remove their vote
- Vote counts are updated in real-time

### Review Moderation
- Only admin/moderator can change review status
- Moderation actions are logged with timestamp and moderator ID
- Optional moderation notes can be added

## Validation Rules

### Review Content
- **product**: Required, must be valid MongoDB ObjectId
- **rating**: Required, integer between 1-5
- **title**: Required, 1-200 characters
- **comment**: Required, 10-2000 characters
- **pros**: Optional array, each item max 100 characters
- **cons**: Optional array, each item max 100 characters

### Query Parameters
- **page**: Positive integer
- **limit**: 1-50
- **rating**: 1-5
- **sort**: Must be one of predefined options

## Performance Considerations

### Indexing
- Reviews are indexed by product, status, and creation date
- Rating and helpful votes are indexed for sorting
- User ID is indexed for user-specific queries

### Pagination
- Default limit is 10, maximum is 50
- Large result sets are automatically paginated
- Total count is provided for pagination controls

### Caching
- Review summaries can be cached as they change infrequently
- Individual reviews are cached with short TTL

## Integration Points

### Product Service
- Reviews update product rating statistics automatically
- Product validation is performed before review creation

### User Service
- User information is populated in review responses
- Authentication tokens are validated against user service

### Notification Service
- Review status changes trigger notifications
- New reviews notify product owners
- Reply notifications sent to review authors

## Monitoring and Analytics

### Key Metrics
- Review creation rate
- Moderation queue size
- Average review rating per product
- Helpful vote patterns
- Review response time

### Logging
- All review operations are logged
- Moderation actions are audited
- Performance metrics are tracked

## Examples

### Create a Review
```bash
curl -X POST /api/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "64a1b2c3d4e5f6789012345",
    "rating": 5,
    "title": "Excellent quality!",
    "comment": "This product exceeded my expectations. Great build quality and fast shipping.",
    "pros": ["Great quality", "Fast shipping"],
    "cons": ["Price is a bit high"]
  }'
```

### Get Product Reviews
```bash
curl "/api/reviews?product=64a1b2c3d4e5f6789012345&page=1&limit=10&sort=helpful_desc"
```

### Moderate a Review
```bash
curl -X PATCH /api/reviews/64b1c2d3e4f5g6789012346/status \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "moderationNote": "Review contains helpful information"
  }'
```

This API provides a complete solution for review management with proper validation, security, and scalability considerations.
