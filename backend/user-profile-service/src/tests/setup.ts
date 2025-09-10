import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  ping: jest.fn().mockResolvedValue('PONG'),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  hget: jest.fn(),
  hset: jest.fn(),
  hdel: jest.fn(),
  hgetall: jest.fn(),
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
  isReady: true,
  on: jest.fn(),
  off: jest.fn()
};

// Mock Redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

// Mock shared logger
jest.mock('@apnidukaan/shared', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  errorHandler: jest.fn((err, req, res, next) => {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }),
  notFoundHandler: jest.fn((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Resource not found',
      code: 'NOT_FOUND'
    });
  }),
  requestLogger: jest.fn((req, res, next) => next())
}));

// Mock external services
// jest.mock('../services/ExternalServices', () => ({
//   catalogService: {
//     getProduct: jest.fn(),
//     validateProduct: jest.fn()
//   },
//   notificationService: {
//     sendNotification: jest.fn()
//   },
//   eventBus: {
//     emit: jest.fn(),
//     on: jest.fn()
//   }
// }));

// Mock file upload utilities
jest.mock('multer', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => {
      req.file = {
        buffer: Buffer.from('mock-image-data'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        size: 1024
      };
      next();
    })
  }))
}));

jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image-data'))
  }))
}));

// Global test database setup
beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGODB_URI || global.__MONGO_URI__;
  if (mongoUri && !mongoose.connection.readyState) {
    await mongoose.connect(mongoUri);
  }
});

afterAll(async () => {
  // Clean up database connection
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  
  // Reset all mocks
  jest.clearAllMocks();
});

afterEach(async () => {
  // Additional cleanup if needed
  jest.restoreAllMocks();
});

// Export mock Redis client for tests
export { mockRedisClient };
