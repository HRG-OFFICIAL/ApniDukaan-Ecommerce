// Simple script to verify Featured and Deals data availability via API
// Usage: node frontend/scripts/check-data.js

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function req(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  try {
    console.log(`Using API: ${API_BASE}`);

    // Featured: published & featured=true
    const featured = await req('/api/catalog/products?limit=8&status=published&featured=true&sortField=rating&sortOrder=desc');
    const featuredProducts = featured?.data?.products || [];
    console.log(`\nFeatured products (published & featured=true): ${featuredProducts.length}`);
    featuredProducts.slice(0, 8).forEach((p, i) => console.log(`${i + 1}. ${p.name} (${p._id})`));

    // Deals: published & isOnSale=true
    const deals = await req('/api/catalog/products?limit=8&status=published&isOnSale=true&sortField=price&sortOrder=asc');
    const dealProducts = deals?.data?.products || [];
    console.log(`\nDeals of the Day (published & isOnSale=true): ${dealProducts.length}`);
    dealProducts.slice(0, 8).forEach((p, i) => console.log(`${i + 1}. ${p.name} (${p._id})`));

    // Fallback if empty: top-rated published
    if (featuredProducts.length === 0) {
      const topRated = await req('/api/catalog/products?limit=8&status=published&sortField=rating&sortOrder=desc');
      const top = topRated?.data?.products || [];
      console.log(`\nFallback top-rated (published): ${top.length}`);
      top.slice(0, 8).forEach((p, i) => console.log(`${i + 1}. ${p.name} (${p._id})`));
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exit(1);
  }
}

main();


