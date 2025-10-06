// Check database for Featured and Deals-of-the-Day products directly in MongoDB
// Usage: node scripts/check-db-featured-deals.js "mongodb://localhost:27017/apnidukaan"

const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.argv[2] || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/apnidukaan';
  const dbNameFromUri = (() => {
    try {
      const path = new URL(uri).pathname.replace(/^\//, '');
      return path || 'apnidukaan';
    } catch {
      return 'apnidukaan';
    }
  })();

  let client;
  try {
    console.log(`Connecting to MongoDB: ${uri}`);
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(dbNameFromUri);
    const products = db.collection('products');

    // Featured (published & featured=true)
    const featuredQuery = { status: 'published', featured: true };
    const featuredCount = await products.countDocuments(featuredQuery);
    const featuredSample = await products
      .find(featuredQuery, { projection: { name: 1, _id: 1 } })
      .limit(16)
      .toArray();

    // Deals (published & isOnSale=true)
    const dealsQuery = { status: 'published', isOnSale: true };
    const dealsCount = await products.countDocuments(dealsQuery);
    const dealsSample = await products
      .find(dealsQuery, { projection: { name: 1, _id: 1, price: 1, originalPrice: 1 } })
      .limit(16)
      .toArray();

    console.log(`\nFeatured (published & featured=true): ${featuredCount}`);
    featuredSample.forEach((p, i) => console.log(`${i + 1}. ${p.name} (${p._id})`));

    console.log(`\nDeals (published & isOnSale=true): ${dealsCount}`);
    dealsSample.forEach((p, i) => {
      const discount = p.originalPrice && p.originalPrice > p.price ? ` (-${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%)` : '';
      console.log(`${i + 1}. ${p.name} (${p._id})${discount}`);
    });

    // If either missing, show top-rated published as fallback signal
    if (featuredCount === 0 || dealsCount === 0) {
      const fallback = await products
        .find({ status: 'published' }, { projection: { name: 1, _id: 1, 'rating.average': 1 } })
        .sort({ 'rating.average': -1 })
        .limit(16)
        .toArray();
      console.log(`\nTop-rated published (fallback preview): ${fallback.length}`);
      fallback.forEach((p, i) => console.log(`${i + 1}. ${p.name} (${p._id})`));
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('DB check failed:', err.message);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

main();


