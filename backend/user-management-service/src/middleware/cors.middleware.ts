import { CorsOptions } from 'cors';
import { logger } from '../utils/logger';

// Environment-based CORS configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Allowed origins configuration
const getAllowedOrigins = (): string[] => {
  const baseOrigins: string[] = [];

  if (isDevelopment) {
    baseOrigins.push(
      'http://localhost:3000',      // Next.js development
      'http://localhost:3001',      // React development
      'http://127.0.0.1:3000',      // Alternative localhost
      'http://127.0.0.1:3001',
      'https://localhost:3000',     // HTTPS local development
      'https://127.0.0.1:3000'
    );
  }

  if (isProduction) {
    baseOrigins.push(
      'https://ApniDukaan.com',
      'https://www.ApniDukaan.com',
      'https://admin.ApniDukaan.com',
      'https://api.ApniDukaan.com'
    );
  }

  // Add origins from environment variable
  if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    baseOrigins.push(...envOrigins);
  }

  return baseOrigins;
};

// Dynamic origin validation
const originValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  const allowedOrigins = getAllowedOrigins();

  // Allow requests with no origin (mobile apps, curl, etc.)
  if (!origin) {
    return callback(null, true);
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    logger.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
  }
};

// CORS options configuration
export const corsOptions: CorsOptions = {
  origin: originValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Session-ID',
    'X-Request-ID',
    'X-API-Version',
    'User-Agent',
    'Referer'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
    'Location',
    'Content-Range'
  ],
  maxAge: isDevelopment ? 300 : 86400, // 5 minutes in dev, 24 hours in prod
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware for handling CORS preflight requests
export const handleCORSPreflight = (req: any, res: any, next: any) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', Array.isArray(corsOptions.allowedHeaders) ? corsOptions.allowedHeaders.join(', ') : corsOptions.allowedHeaders);
    res.header('Access-Control-Expose-Headers', Array.isArray(corsOptions.exposedHeaders) ? corsOptions.exposedHeaders.join(', ') : corsOptions.exposedHeaders);
    res.header('Access-Control-Max-Age', corsOptions.maxAge?.toString());
    
    return res.status(204).end();
  }
  
  next();
};

// Utility function to check if origin is allowed
export const isOriginAllowed = (origin: string): boolean => {
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

// Development helper to log CORS configuration
if (isDevelopment) {
  logger.info('CORS Configuration:', {
    allowedOrigins: getAllowedOrigins(),
    credentials: corsOptions.credentials,
    methods: corsOptions.methods,
    maxAge: corsOptions.maxAge
  });
}
