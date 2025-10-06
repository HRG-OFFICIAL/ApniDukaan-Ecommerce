// Verify availability of preferred ASIN SKUs in MongoDB (case-insensitive)
// Usage:
//   node scripts/check-preferred-skus.js "<MONGODB_URI>"
// Or set env var MONGODB_URI

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

function getUriFromArgsOrEnv() {
  const arg = process.argv[2]
  const env = process.env.MONGODB_URI || process.env.MONGO_URI
  return arg || env || 'mongodb://localhost:27017/apnidukaan'
}

function getDbNameFromUri(uri) {
  try {
    const url = new URL(uri)
    const path = (url.pathname || '').replace(/^\//, '')
    return path || 'apnidukaan'
  } catch {
    // Fallback for non-URL style connection strings
    const m = uri.match(/\/(\w+)(\?|$)/)
    return (m && m[1]) || 'apnidukaan'
  }
}

async function main() {
  const uri = getUriFromArgsOrEnv()
  const dbName = getDbNameFromUri(uri)
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })

  // Build case-insensitive exact-match regex list for $in
  const skuRegexes = preferredSkuList.map((sku) => new RegExp(`^${sku}$`, 'i'))

  try {
    console.log(`[check-preferred-skus] Connecting to: ${uri}`)
    await client.connect()
    const db = client.db(dbName)
    const products = db.collection('products')

    // Fetch any product matching preferred SKUs (regardless of status/featured)
    const found = await products
      .find(
        { sku: { $in: skuRegexes } },
        {
          projection: {
            _id: 1,
            name: 1,
            sku: 1,
            status: 1,
            featured: 1,
            price: 1,
            originalPrice: 1,
          },
        }
      )
      .toArray()

    const bySkuLower = new Map()
    for (const p of found) {
      if (!p || !p.sku) continue
      bySkuLower.set(String(p.sku).toLowerCase(), p)
    }

    console.log('\nPreferred SKU availability:')
    console.log('-----------------------------------------------')
    let publishedFeaturedCount = 0
    let publishedCount = 0
    for (const sku of preferredSkuList) {
      const key = sku.toLowerCase()
      const p = bySkuLower.get(key)
      if (!p) {
        console.log(`${sku}: MISSING`)
        continue
      }
      const isPublished = p.status === 'published'
      const isFeatured = !!p.featured
      if (isPublished) publishedCount += 1
      if (isPublished && isFeatured) publishedFeaturedCount += 1
      const priceInfo = p.originalPrice && p.originalPrice > p.price
        ? `$${p.price} (on sale, was $${p.originalPrice})`
        : `$${p.price ?? 'N/A'}`
      console.log(
        `${sku}: FOUND  | status=${p.status} | featured=${isFeatured} | ${p.name || 'Unnamed'} | ${priceInfo}`
      )
    }

    console.log('\nSummary:')
    console.log(`  Found: ${found.length}/${preferredSkuList.length}`)
    console.log(`  Published: ${publishedCount}/${preferredSkuList.length}`)
    console.log(`  Published & Featured: ${publishedFeaturedCount}/${preferredSkuList.length}`)

    // Also show a sample of extra published+featured items not in the preferred list
    const extra = await products
      .find(
        {
          status: 'published',
          featured: true,
          sku: { $nin: preferredSkuList.map((s) => new RegExp(`^${s}$`, 'i')) },
        },
        { projection: { _id: 1, name: 1, sku: 1, price: 1 } }
      )
      .limit(10)
      .toArray()

    if (extra.length > 0) {
      console.log('\nAdditional published+featured (not in preferred list), sample:')
      extra.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} [${p.sku}] $${p.price ?? 'N/A'}`)
      })
    }

    console.log('\nDone.')
  } catch (err) {
    console.error('[check-preferred-skus] Failed:', err && err.message ? err.message : err)
    process.exitCode = 1
  } finally {
    try { await client.close() } catch {}
  }
}

main()


