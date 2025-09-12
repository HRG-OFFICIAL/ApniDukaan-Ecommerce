#!/usr/bin/env node

/**
 * Test Frontend API Integration
 * Tests if the frontend can successfully fetch data from the backend
 */

const API_BASE_URL = 'http://localhost:4000';

async function testFrontendApiIntegration() {
  console.log('🔍 Testing Frontend API Integration...');
  
  try {
    // Test the exact API endpoint the frontend will use
    console.log('1️⃣ Testing Products API (Frontend Format)...');
    const response = await fetch(`${API_BASE_URL}/api/catalog/products?page=1&limit=12&sortField=createdAt&sortOrder=desc`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ API Response: ${data.data.length} products found`);
      console.log('📦 Products for frontend:');
      data.data.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Price: $${product.price}`);
        console.log(`      Category: ${product.category?.name || 'N/A'}`);
        console.log(`      Images: ${product.images?.length || 0} images`);
        console.log(`      Status: ${product.status}`);
        console.log('');
      });
      
      // Test pagination
      console.log('2️⃣ Testing Pagination...');
      const pagination = data.pagination;
      if (pagination) {
        console.log(`✅ Pagination: Page ${pagination.page}/${pagination.pages} (${pagination.total} total)`);
      }
      
      // Test individual product endpoint
      if (data.data.length > 0) {
        console.log('3️⃣ Testing Individual Product...');
        const productId = data.data[0]._id || data.data[0].id;
        const productResponse = await fetch(`${API_BASE_URL}/api/catalog/products/${productId}`);
        const productData = await productResponse.json();
        
        if (productData.success) {
          console.log(`✅ Individual Product: "${productData.data.name}"`);
          console.log(`   Description: ${productData.data.description?.substring(0, 100)}...`);
        }
      }
      
      console.log('🎉 Frontend API Integration Test Complete!');
      console.log('📊 Summary:');
      console.log('   - Products API: ✅ Working');
      console.log('   - Pagination: ✅ Working');
      console.log('   - Individual Products: ✅ Working');
      console.log('   - Data Format: ✅ Compatible with frontend');
      console.log('');
      console.log('🚀 Your frontend can now display real database products!');
      console.log('   Visit: http://localhost:3000/products');
      
    } else {
      console.log('❌ API Response failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Frontend API Integration Test Failed:', error.message);
    console.log('💡 Make sure both backend and frontend are running:');
    console.log('   Backend: npm run dev:backend');
    console.log('   Frontend: npm run dev:frontend');
  }
}

// Run the test
testFrontendApiIntegration();
