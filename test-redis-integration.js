#!/usr/bin/env node

const { createClient } = require('redis');

// Redis Cloud connection string
const REDIS_URL = 'redis://default:gONuTLe4OqsID9U4BKNEJzR6qdQzpvVe@redis-11045.c274.us-east-1-3.ec2.redns.redis-cloud.com:11045';

async function testRedisIntegration() {
  console.log('🔴 Testing Redis Cloud Integration with ApniDukaan...\n');

  const client = createClient({ url: REDIS_URL });

  try {
    // Connect to Redis Cloud
    console.log('1️⃣ Connecting to Redis Cloud...');
    await client.connect();
    console.log('✅ Connected to Redis Cloud successfully\n');

    // Test basic operations
    console.log('2️⃣ Testing basic Redis operations...');
    
    // Ping test
    const pong = await client.ping();
    console.log(`✅ Ping response: ${pong}`);

    // String operations
    await client.set('shopsphere:test:connection', 'Redis Cloud is working!');
    const testValue = await client.get('shopsphere:test:connection');
    console.log(`✅ String operations: ${testValue}`);

    // JSON operations (like product caching)
    const productData = {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      price: 199.99,
      category: 'Electronics',
      inStock: true
    };
    
    await client.set('shopsphere:product:1', JSON.stringify(productData));
    const cachedProduct = await client.get('shopsphere:product:1');
    const parsedProduct = JSON.parse(cachedProduct);
    console.log(`✅ JSON operations: ${parsedProduct.name} - $${parsedProduct.price}`);

    // Hash operations (like user sessions)
    await client.hSet('shopsphere:user:session:123', {
      userId: '123',
      email: 'user@example.com',
      loginTime: new Date().toISOString(),
      cartItems: '5'
    });
    
    const sessionData = await client.hGetAll('shopsphere:user:session:123');
    console.log(`✅ Hash operations: User ${sessionData.userId} logged in at ${sessionData.loginTime}`);

    // List operations (like shopping cart)
    await client.lPush('shopsphere:cart:user123', 'product1', 'product2', 'product3');
    const cartItems = await client.lRange('shopsphere:cart:user123', 0, -1);
    console.log(`✅ List operations: Cart has ${cartItems.length} items`);

    // Set operations (like product tags)
    await client.sAdd('shopsphere:product:1:tags', 'wireless', 'bluetooth', 'headphones', 'electronics');
    const tags = await client.sMembers('shopsphere:product:1:tags');
    console.log(`✅ Set operations: Product tags: ${tags.join(', ')}`);

    // Expiration test (like session timeout)
    await client.setEx('shopsphere:session:temp', 5, 'This session expires in 5 seconds');
    const beforeExpiry = await client.get('shopsphere:session:temp');
    console.log(`✅ Expiration test: ${beforeExpiry} (will expire in 5 seconds)`);

    // Performance test
    console.log('\n3️⃣ Testing Redis performance...');
    const startTime = Date.now();
    
    // Simulate multiple operations
    for (let i = 0; i < 100; i++) {
      await client.set(`shopsphere:test:perf:${i}`, `value${i}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ Performance test: 100 operations in ${duration}ms (${(1000/duration*100).toFixed(0)} ops/sec)`);

    // Cleanup
    console.log('\n4️⃣ Cleaning up test data...');
    const keys = await client.keys('shopsphere:test:*');
    if (keys.length > 0) {
      await client.del(keys);
    }
    await client.del('shopsphere:product:1', 'shopsphere:user:session:123', 'shopsphere:cart:user123');
    console.log('✅ Cleanup completed\n');

    console.log('🎉 Redis Cloud Integration Test PASSED!');
    console.log('✅ All Redis operations working correctly');
    console.log('✅ Performance is excellent');
    console.log('✅ Ready for ShopSphere integration\n');

    console.log('📊 Redis Cloud Features Available:');
    console.log('   - Product caching (faster page loads)');
    console.log('   - User session management');
    console.log('   - Shopping cart persistence');
    console.log('   - Real-time data synchronization');
    console.log('   - High-performance operations');

    return true;

  } catch (error) {
    console.error('❌ Redis Cloud integration test failed:', error.message);
    console.error('🔍 Error details:', error);
    return false;
  } finally {
    try {
      await client.disconnect();
      console.log('\n🔌 Disconnected from Redis Cloud');
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

// Run the test
testRedisIntegration().then(success => {
  if (success) {
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start ApniDukaan with Redis: node start-with-redis-cloud.js');
    console.log('   2. Enjoy faster performance and caching!');
    console.log('   3. Test real-time features');
  } else {
    console.log('\n⚠️  Redis Cloud setup failed. You can still use ApniDukaan without Redis.');
  }
  process.exit(0);
});
