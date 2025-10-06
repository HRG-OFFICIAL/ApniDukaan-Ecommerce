// Toggle featured=true for preferred SKUs
// Usage:
//   node scripts/feature-preferred-skus.js "<MONGODB_URI>"
// or set env MONGODB_URI

/* eslint-disable no-console */
const { MongoClient } = require('mongodb')

const preferredSkuList = [
  'B0BCL2S1Q7',
  'B095P6KQGY',
  'B0C446WHGM',
  'B0C7RY542H',
  'B0BRQT9GN4',
  'B0C6MPFQT2',
  'B08T1NZMPN',
  'B0CCK4F1TB'
]

function getUri() {
  return process.argv[2] || process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/apnidukaan'
}

function getDbNameFromUri(uri) {
  try {
    const url = new URL(uri)
    const path = (url.pathname || '').replace(/^\//, '')
    return path || 'apnidukaan'
  } catch {
    const m = uri.match(/\/(\w+)(\?|$)/)
    return (m && m[1]) || 'apnidukaan'
  }
}

async function main() {
  const uri = getUri()
  const dbName = getDbNameFromUri(uri)
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
  try {
    console.log(`[feature-preferred-skus] Connecting to: ${uri}`)
    await client.connect()
    const db = client.db(dbName)
    const products = db.collection('products')

    const res = await products.updateMany(
      { sku: { $in: preferredSkuList } },
      { $set: { featured: true, status: 'published' } }
    )
    console.log('Matched:', res.matchedCount, 'Modified:', res.modifiedCount)
    console.log('Done.')
  } catch (err) {
    console.error('[feature-preferred-skus] Failed:', err && err.message ? err.message : err)
    process.exitCode = 1
  } finally {
    try { await client.close() } catch {}
  }
}

main()


