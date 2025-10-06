// Select 32 eye-catching products (16 featured + 16 deals) from the CSV dataset
// Usage: node scripts/select-featured-deals-from-csv.js [csvPath]

const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const INPUT = process.argv[2] || path.join(process.cwd(), 'amazon_products_curated_220k.csv')

// Categories/keywords an intellectual/tech-savvy audience is likely to enjoy
const preferredThemes = [
  { name: 'phones', weight: 1.0, kws: ['iphone', 'samsung galaxy', 'pixel', 'phone', 'smartphone'] },
  { name: 'laptops', weight: 1.0, kws: ['macbook', 'laptop', 'notebook', 'thinkpad', 'rog', 'legion'] },
  { name: 'headphones', weight: 0.9, kws: ['headphone', 'earbuds', 'earphones', 'airpods', 'bose', 'sony wh'] },
  { name: 'smartwatch', weight: 0.75, kws: ['watch', 'smartwatch', 'fitbit', 'garmin', 'oura'] },
  { name: 'tablets', weight: 0.7, kws: ['ipad', 'tablet', 'kindle', 'paperwhite'] },
  { name: 'cameras', weight: 0.7, kws: ['camera', 'gopro', 'canon', 'nikon', 'sony alpha'] },
  { name: 'books', weight: 0.6, kws: ['book', 'paperback', 'hardcover', 'atomic habits', 'deep work'] },
]

function themeBoost(title, categoryName='') {
  const text = `${title} ${categoryName}`.toLowerCase()
  let boost = 0
  for (const t of preferredThemes) {
    if (t.kws.some(k => text.includes(k))) boost = Math.max(boost, t.weight)
  }
  return boost
}

function safeNum(v, d=0) {
  if (v === undefined || v === null || v === '') return d
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

const rows = []
fs.createReadStream(INPUT)
  .pipe(csv())
  .on('data', (row) => {
    // Expected headers include: title, price, listPrice, stars, reviews, category_name, norm_stars, norm_reviews, norm_sales, quality_score
    const title = (row.title || '').trim()
    if (!title) return
    const price = safeNum(row.price)
    const listPrice = safeNum(row.listPrice)
    const stars = safeNum(row.stars)
    const reviews = safeNum(row.reviews)
    const category = (row.category_name || '').trim()
    const normStars = safeNum(row.norm_stars)
    const normReviews = safeNum(row.norm_reviews)
    const normSales = safeNum(row.norm_sales)
    const quality = safeNum(row.quality_score)

    const popularity = 0.4 * normReviews + 0.4 * normSales + 0.2 * normStars
    const ratingSignal = Math.min(1, stars / 5) * (reviews > 50 ? 1 : 0.7)
    const discount = listPrice > price && listPrice > 0 ? Math.max(0, Math.min(1, (listPrice - price) / listPrice)) : 0
    const theme = themeBoost(title, category)

    // Composite scores
    const featuredScore = 0.45 * popularity + 0.25 * ratingSignal + 0.15 * quality + 0.15 * theme
    const dealsScore = 0.35 * popularity + 0.25 * ratingSignal + 0.30 * discount + 0.10 * theme

    rows.push({
      title,
      price,
      listPrice,
      stars,
      reviews,
      category,
      featuredScore,
      dealsScore,
      discountPct: discount,
    })
  })
  .on('end', () => {
    if (!rows.length) {
      console.error('No rows parsed. Make sure the CSV path is correct.')
      process.exit(1)
    }

    const topFeatured = [...rows]
      .sort((a, b) => b.featuredScore - a.featuredScore)
      .slice(0, 40)

    // Keep diverse themes among featured
    const featuredFinal = []
    const seenTitles = new Set()
    for (const r of topFeatured) {
      if (featuredFinal.length >= 16) break
      if (seenTitles.has(r.title)) continue
      featuredFinal.push(r)
      seenTitles.add(r.title)
    }

    const topDeals = [...rows]
      .filter(r => r.discountPct >= 0.05) // at least 5% off
      .sort((a, b) => b.dealsScore - a.dealsScore)
      .slice(0, 64)

    const dealsFinal = []
    for (const r of topDeals) {
      if (dealsFinal.length >= 16) break
      if (seenTitles.has(r.title)) continue
      dealsFinal.push(r)
      seenTitles.add(r.title)
    }

    console.log('\n=== Featured (16) ===')
    featuredFinal.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}  | ${r.category}  | ★${r.stars} (${r.reviews})  | $${r.price}${r.listPrice>r.price?` (was $${r.listPrice})`:''}`)
    })

    console.log('\n=== Deals of the Day (16) ===')
    dealsFinal.forEach((r, i) => {
      const pct = Math.round(r.discountPct * 100)
      console.log(`${i + 1}. ${r.title}  | ${r.category}  | $${r.price}${r.listPrice>r.price?` (was $${r.listPrice}, -${pct}%)`:''}`)
    })

    // Export JSON
    const out = {
      generatedAt: new Date().toISOString(),
      featured: featuredFinal,
      deals: dealsFinal
    }
    const outDir = path.join(process.cwd(), 'frontend', 'public')
    try { fs.mkdirSync(outDir, { recursive: true }) } catch {}
    const outFile = path.join(outDir, 'featured_deals.json')
    fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf-8')
    console.log(`\nJSON exported to ${outFile}`)
    console.log('\nDone.')
  })


