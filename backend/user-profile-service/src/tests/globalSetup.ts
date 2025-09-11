import { MongoMemoryServer } from 'mongodb-memory-server';
import { createClient } from 'redis';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

let mongod: MongoMemoryServer;

export default async function globalSetup() {
  console.log('Setting up test environment...');

  // Start in-memory MongoDB
  mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'ApniDukaan_profiles_test',
      port: 27018 // Use different port for tests
    }
  });

  const mongoUri = mongod.getUri();
  process.env.MONGODB_URI = mongoUri;
  console.log(`Test MongoDB started at: ${mongoUri}`);

  // Mock Redis client for tests
  global.__MONGOD__ = mongod;
  global.__MONGO_URI__ = mongoUri;

  console.log('Test environment setup complete');
}
