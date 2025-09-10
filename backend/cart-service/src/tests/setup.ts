import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
    isReady: true
  }))
}));

// Mock shared logger
jest.mock('@apnidukaan/shared', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  connectDatabase: jest.fn()
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  // Cleanup
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Global test utilities
export const createMockProduct = () => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Product',
  price: 19.99,
  originalPrice: 24.99,
  sku: 'TEST123',
  images: ['test-image.jpg'],
  inventory: {
    stock: 100,
    inStock: true
  },
  weight: 0.5,
  status: 'active'
});

export const createMockCartItem = (overrides: any = {}) => ({
  productId: '507f1f77bcf86cd799439011',
  quantity: 1,
  price: 19.99,
  originalPrice: 24.99,
  name: 'Test Product',
  image: 'test-image.jpg',
  sku: 'TEST123',
  weight: 0.5,
  ...overrides
});

export const createMockDiscount = (overrides: any = {}) => ({
  code: 'TEST10',
  type: 'percentage',
  value: 10,
  description: '10% off',
  appliedAt: new Date(),
  minimumAmount: 0,
  ...overrides
});
