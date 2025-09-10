import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  var __MONGOD__: MongoMemoryServer;
  var __MONGO_URI__: string;
}

export {};
