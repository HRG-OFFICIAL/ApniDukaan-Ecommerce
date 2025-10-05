# Backend Services Configuration

## Service Architecture

### 1. API Gateway (Port 4000)
- **Purpose**: Central entry point for all API requests
- **Features**: Request routing, authentication, rate limiting, logging
- **Dependencies**: Express, http-proxy-middleware, helmet, cors

### 2. Catalog Service (Port 4001)
- **Purpose**: Product catalog management
- **Features**: CRUD operations for products, categories, reviews
- **Dependencies**: Express, Mongoose, GraphQL, Redis

Note on dataset compatibility:
- Products may store `category` as an ObjectId referencing `categories._id` or as a plain string (category name) when no mapping exists.
- The API Gateway enriches responses with `categoryName` by joining on `categories` when possible.

### 3. User Service (Port 4002)
- **Purpose**: User authentication and profile management
- **Features**: Registration, login, profile management, JWT tokens
- **Dependencies**: Express, bcrypt, JWT, Mongoose

### 4. Order Service (Port 4003)
- **Purpose**: Order processing and management
- **Features**: Order creation, status tracking, inventory management
- **Dependencies**: Express, Mongoose, Redis

### 5. Payment Service (Port 4004)
- **Purpose**: Payment processing
- **Features**: Stripe integration, PayPal integration, payment tracking
- **Dependencies**: Express, Stripe SDK, PayPal SDK

## Configuration Files

### API Gateway Configuration
```typescript
// backend/api-gateway/src/config/index.ts
export const config = {
  port: process.env.PORT || 4000,
  services: {
    catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:4001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:4002',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:4003',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
}
```

Set `MONGODB_URI` to your Atlas URI. The gateway endpoints `/api/catalog/products` and `/api/catalog/categories` will query your MongoDB directly.

### Catalog Service Configuration
```typescript
// backend/catalog-service/src/config/index.ts
export const config = {
  port: process.env.PORT || 4001,
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_catalog?retryWrites=true&w=majority&appName=Cluster0',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png'],
  },
}
```

### User Service Configuration
```typescript
// backend/user-service/src/config/index.ts
export const config = {
  port: process.env.PORT || 4002,
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb+srv://userservice-dev:OELp6t3K63rHhKgJ@cluster0.0ezsixh.mongodb.net/apnidukaan_users?retryWrites=true&w=majority&appName=Cluster0',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}
```

## Middleware Configuration

### Authentication Middleware
```typescript
// backend/shared/src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};
```

### Rate Limiting Middleware
```typescript
// backend/shared/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};
```

### CORS Middleware
```typescript
// backend/shared/src/middleware/cors.ts
import cors from 'cors';

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
```

## Database Models

### User Model
```typescript
// backend/user-service/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String },
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const User = mongoose.model<IUser>('User', UserSchema);
```

### Product Model
```typescript
// backend/catalog-service/src/models/Product.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: mongoose.Types.ObjectId;
  images: string[];
  stock: number;
  ratings: {
    average: number;
    count: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
```

## Service Communication

### Inter-Service Communication
```typescript
// backend/shared/src/utils/serviceClient.ts
import axios from 'axios';

export class ServiceClient {
  private baseURL: string;
  
  constructor(serviceURL: string) {
    this.baseURL = serviceURL;
  }
  
  async get(endpoint: string, headers?: Record<string, string>) {
    return axios.get(`${this.baseURL}${endpoint}`, { headers });
  }
  
  async post(endpoint: string, data: any, headers?: Record<string, string>) {
    return axios.post(`${this.baseURL}${endpoint}`, data, { headers });
  }
  
  async put(endpoint: string, data: any, headers?: Record<string, string>) {
    return axios.put(`${this.baseURL}${endpoint}`, data, { headers });
  }
  
  async delete(endpoint: string, headers?: Record<string, string>) {
    return axios.delete(`${this.baseURL}${endpoint}`, { headers });
  }
}
```

## Health Checks

### Health Check Endpoint
```typescript
// backend/shared/src/routes/health.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  };
  
  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = 'ERROR';
    res.status(503).json(healthCheck);
  }
});

export default router;
```
