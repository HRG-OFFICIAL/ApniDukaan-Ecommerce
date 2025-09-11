#!/usr/bin/env node

const { createClient } = require('redis');

// Test Redis connection
async function testRedisConnection() {
  console.log('🔴 Testing Redis Connection...\n');

  // Try local Redis first
  const localRedisUrl = 'redis://localhost:6379';
  const client = createClient({ url: localRedisUrl });

  try {
    console.log('1️⃣ Attempting to connect to local Redis...');
    await client.connect();
    console.log('✅ Successfully connected to local Redis\n');

    // Test basic operations
    console.log('2️⃣ Testing Redis operations...');
    
    // Test ping
    const pong = await client.ping();
    console.log(`✅ Ping response: ${pong}`);

    // Test set/get
    await client.set('test:key', 'Hello Redis!');
    const value = await client.get('test:key');
    console.log(`✅ Set/Get test: ${value}`);

    // Test JSON operations
    const testData = { name: 'ApniDukaan', version: '1.0.0', features: ['ecommerce', 'microservices'] };
    await client.set('test:json', JSON.stringify(testData));
    const jsonValue = await client.get('test:json');
    const parsedData = JSON.parse(jsonValue);
    console.log(`✅ JSON operations: ${parsedData.name} v${parsedData.version}`);

    // Test expiration
    await client.setEx('test:expire', 5, 'This will expire in 5 seconds');
    console.log('✅ Set expiration test');

    // Test list operations
    await client.lPush('test:list', 'item1', 'item2', 'item3');
    const listLength = await client.lLen('test:list');
    console.log(`✅ List operations: ${listLength} items`);

    // Test hash operations
    await client.hSet('test:hash', { field1: 'value1', field2: 'value2' });
    const hashValue = await client.hGet('test:hash', 'field1');
    console.log(`✅ Hash operations: ${hashValue}`);

    // Cleanup
    await client.del('test:key', 'test:json', 'test:expire', 'test:list', 'test:hash');
    console.log('✅ Cleanup completed\n');

    console.log('🎉 Redis is fully functional!');
    console.log('✅ All operations working correctly');
    console.log('✅ Ready for ApniDukaan integration\n');

    return true;

  } catch (error) {
    console.log('❌ Local Redis not available');
    console.log('💡 Redis options:');
    console.log('   1. Install Redis locally: choco install redis-64');
    console.log('   2. Use Redis Cloud: https://redis.com/try-free/');
    console.log('   3. Continue without Redis (caching disabled)\n');
    
    return false;
  } finally {
    try {
      await client.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

// Test Redis Cloud connection
async function testRedisCloud() {
  console.log('☁️ Testing Redis Cloud connection...');
  
  // You would need to provide your Redis Cloud URL here
  const redisCloudUrl = process.env.REDIS_CLOUD_URL || 'redis://localhost:6379';
  
  if (redisCloudUrl === 'redis://localhost:6379') {
    console.log('💡 To test Redis Cloud, set REDIS_CLOUD_URL environment variable');
    return false;
  }

  const client = createClient({ url: redisCloudUrl });

  try {
    await client.connect();
    console.log('✅ Redis Cloud connected successfully');
    await client.ping();
    console.log('✅ Redis Cloud ping successful');
    await client.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Redis Cloud connection failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 ApniDukaan Redis Connection Test\n');
  
  const localRedis = await testRedisConnection();
  
  if (!localRedis) {
    await testRedisCloud();
  }

  console.log('📊 Test Summary:');
  console.log(`   - Local Redis: ${localRedis ? '✅ Working' : '❌ Not available'}`);
  console.log('   - Redis Cloud: Set REDIS_CLOUD_URL to test');
  console.log('   - Recommendation: Install Redis locally or use Redis Cloud\n');

  if (localRedis) {
    console.log('🎯 Next Steps:');
    console.log('   1. Redis is ready for ApniDukaan');
    console.log('   2. Caching will be enabled');
    console.log('   3. Session management will work');
    console.log('   4. Performance will be improved');
  } else {
    console.log('⚠️  ApniDukaan will work without Redis, but with limited features:');
    console.log('   - No caching (slower performance)');
    console.log('   - No session persistence');
    console.log('   - No real-time features');
  }

  process.exit(0);
}

runTests();
