const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

class ProductBulkUploader {
    constructor(connectionString, databaseName = 'apnidukaan') {
        this.connectionString = connectionString;
        this.databaseName = databaseName;
        this.client = null;
        this.db = null;
        this.productsCollection = null;
        this.categoriesCollection = null;
        this.categoryMapping = {};
        this.hasCategoryMapping = false;
    }

    async connect() {
        try {
            this.client = new MongoClient(this.connectionString);
            await this.client.connect();
            this.db = this.client.db(this.databaseName);
            this.productsCollection = this.db.collection('products');
            this.categoriesCollection = this.db.collection('categories');
            
            console.log('Connected to MongoDB');
            await this.loadCategoryMapping();
        } catch (error) {
            console.error('Connection failed:', error);
            throw error;
        }
    }

    async loadCategoryMapping() {
        try {
            const categories = await this.categoriesCollection.find({}, { projection: { name: 1, slug: 1, _id: 1 } }).toArray();
            for (const cat of categories) {
                // store actual ObjectId for mapped categories
                this.categoryMapping[cat.name] = cat._id;
            }
            console.log(`Loaded ${Object.keys(this.categoryMapping).length} categories`);
            this.hasCategoryMapping = Object.keys(this.categoryMapping).length > 0;
        } catch (error) {
            console.error('Error loading categories:', error);
            this.hasCategoryMapping = false;
        }
    }

    cleanText(text) {
        if (!text || text === null || text === undefined) return '';
        return String(text).trim();
    }

    generateSlug(title) {
        if (!title) return '';
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s-]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    extractBrand(title) {
        if (!title) return '';
        
        const brands = [
            'Apple', 'Samsung', 'Sony', 'LG', 'HP', 'Dell', 'Lenovo', 'Asus',
            'Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour',
            'Canon', 'Nikon', 'GoPro', 'Bose', 'JBL', 'Sennheiser',
            'Philips', 'Panasonic', 'Toshiba', 'Acer', 'MSI'
        ];
        
        const titleLower = title.toLowerCase();
        for (const brand of brands) {
            if (titleLower.includes(brand.toLowerCase())) {
                return brand;
            }
        }
        return '';
    }

    extractTags(title) {
        if (!title) return [];
        
        const tags = [];
        const titleLower = title.toLowerCase();
        
        const tagKeywords = [
            'wireless', 'bluetooth', 'premium', 'professional', 'portable',
            'rechargeable', 'waterproof', 'durable', 'lightweight', 'compact',
            'high-quality', 'advanced', 'smart', 'digital', 'electronic',
            'stainless steel', 'leather', 'cotton', 'plastic', 'metal'
        ];
        
        for (const keyword of tagKeywords) {
            if (titleLower.includes(keyword)) {
                tags.push(keyword);
            }
        }
        
        return tags;
    }

    mapCategory(categoryName) {
        if (!categoryName) {
            // If there is a known default mapping, use it; else empty string
            return this.hasCategoryMapping ? (this.categoryMapping['Electronics'] || '') : '';
        }

        if (!this.hasCategoryMapping) {
            // No categories collection configured; keep the raw category string
            return categoryName;
        }

        // Direct mapping to category ObjectId
        if (this.categoryMapping[categoryName]) {
            return this.categoryMapping[categoryName];
        }

        // Fuzzy matching
        const categoryLower = categoryName.toLowerCase();
        for (const [dbCategory, categoryId] of Object.entries(this.categoryMapping)) {
            const dbCategoryWords = dbCategory.toLowerCase().split(' ');
            if (dbCategoryWords.some(word => categoryLower.includes(word))) {
                return categoryId;
            }
        }

        // Fallback: keep raw string if mapping not found
        return categoryName;
    }

    transformProduct(row) {
        try {
            const title = this.cleanText(row.title);
            const price = parseFloat(row.price) || 0;
            const listPrice = parseFloat(row.listPrice) || null;
            const stars = parseFloat(row.stars) || 0;
            const reviews = parseInt(row.reviews) || 0;
            const category = this.cleanText(row.category);
            const imgUrl = this.cleanText(row.imgUrl);
            const asin = this.cleanText(row.asin);
            const isBestSeller = String(row.isBestSeller).toLowerCase() === 'true';
            const boughtLastMonth = parseInt(row.boughtInLastMonth) || 0;

            const product = {
                // Basic Info
                name: title,
                slug: this.generateSlug(title),
                description: title,
                shortDescription: title.length > 200 ? title.substring(0, 200) : title,
                sku: asin,
                brand: this.extractBrand(title),

                // Pricing
                price: price,
                originalPrice: (listPrice && listPrice > price) ? listPrice : null,
                currency: 'USD',

                // Inventory
                stock: 100,
                minStock: 5,
                trackInventory: true,

                // Categories
                category: this.mapCategory(category),
                tags: this.extractTags(title),

                // Media
                images: imgUrl ? [imgUrl] : [],
                thumbnail: imgUrl || null,

                // Status & Visibility
                isActive: true,
                isFeatured: isBestSeller,
                isDigital: false,
                requiresShipping: true,

                // Reviews & Ratings
                rating: {
                    average: stars,
                    count: reviews,
                    breakdown: {
                        5: Math.floor(reviews * 0.4),
                        4: Math.floor(reviews * 0.3),
                        3: Math.floor(reviews * 0.2),
                        2: Math.floor(reviews * 0.1),
                        1: Math.floor(reviews * 0.1)
                    }
                },

                // Analytics
                sales: boughtLastMonth,
                views: 0,
                wishlistCount: 0,

                // Timestamps
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: new Date()
            };

            return product;
        } catch (error) {
            console.error('Error transforming product:', error);
            return null;
        }
    }

    async uploadProducts(csvFilePath, batchSize = 1000) {
        try {
            console.log(`Reading CSV file: ${csvFilePath}`);
            
            const products = [];
            let rowCount = 0;
            let failedTransformations = 0;

            return new Promise((resolve, reject) => {
                fs.createReadStream(csvFilePath)
                    .pipe(csv())
                    .on('data', (row) => {
                        rowCount++;
                        const product = this.transformProduct(row);
                        if (product) {
                            products.push(product);
                        } else {
                            failedTransformations++;
                        }

                        if (rowCount % 10000 === 0) {
                            console.log(`Processed ${rowCount} rows...`);
                        }
                    })
                    .on('end', async () => {
                        console.log(`CSV processing complete. ${products.length} products ready, ${failedTransformations} failed`);
                        
                        // Upload in batches
                        const totalProducts = products.length;
                        const batches = [];
                        for (let i = 0; i < totalProducts; i += batchSize) {
                            batches.push(products.slice(i, i + batchSize));
                        }

                        console.log(`Uploading ${totalProducts} products in ${batches.length} batches of ${batchSize}...`);

                        let successfulUploads = 0;
                        let failedUploads = 0;

                        for (let batchNum = 0; batchNum < batches.length; batchNum++) {
                            const batch = batches[batchNum];
                            try {
                                const result = await this.productsCollection.insertMany(batch, { ordered: false });
                                successfulUploads += result.insertedCount;
                                console.log(`Batch ${batchNum + 1}/${batches.length}: Successfully inserted ${batch.length} products`);
                            } catch (error) {
                                failedUploads += batch.length;
                                console.error(`Batch ${batchNum + 1} failed:`, error.message);
                                
                                // Try individual inserts for this batch
                                for (const product of batch) {
                                    try {
                                        await this.productsCollection.insertOne(product);
                                        successfulUploads++;
                                        failedUploads--;
                                    } catch (individualError) {
                                        console.error('Individual product failed:', individualError.message);
                                    }
                                }
                            }
                        }

                        console.log(`Upload complete! Successfully uploaded: ${successfulUploads}, Failed: ${failedUploads}`);
                        resolve({ successfulUploads, failedUploads });
                    })
                    .on('error', (error) => {
                        console.error('CSV parsing error:', error);
                        reject(error);
                    });
            });
        } catch (error) {
            console.error('Error during upload process:', error);
            throw error;
        }
    }

    async createIndexes() {
        try {
            console.log('Creating indexes...');

            // Text search index
            await this.productsCollection.createIndex({ name: 'text', description: 'text', tags: 'text' });

            // Category index
            await this.productsCollection.createIndex({ category: 1, isActive: 1 });

            // Price index
            await this.productsCollection.createIndex({ price: 1 });

            // Stock index
            await this.productsCollection.createIndex({ stock: 1 });

            // Featured products index
            await this.productsCollection.createIndex({ isFeatured: 1, isActive: 1 });

            // Rating index
            await this.productsCollection.createIndex({ 'rating.average': -1 });

            // Sales index
            await this.productsCollection.createIndex({ sales: -1 });

            // Created date index
            await this.productsCollection.createIndex({ createdAt: -1 });

            // SKU index (unique where sku exists and not empty)
            try {
                await this.productsCollection.createIndex(
                    { sku: 1 },
                    { unique: true, partialFilterExpression: { sku: { $type: 'string', $ne: '' } } }
                );
            } catch (e) {
                console.warn('SKU unique index creation warning:', e.message);
            }

            // Slug index (unique where slug exists and not empty)
            try {
                await this.productsCollection.createIndex(
                    { slug: 1 },
                    { unique: true, partialFilterExpression: { slug: { $type: 'string', $ne: '' } } }
                );
            } catch (e) {
                console.warn('Slug unique index creation warning:', e.message);
            }

            console.log('Indexes created successfully!');
        } catch (error) {
            console.error('Error creating indexes:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const totalProducts = await this.productsCollection.countDocuments({});
            const activeProducts = await this.productsCollection.countDocuments({ isActive: true });
            const featuredProducts = await this.productsCollection.countDocuments({ isFeatured: true });

            console.log('Database Statistics:');
            console.log(`Total Products: ${totalProducts}`);
            console.log(`Active Products: ${activeProducts}`);
            console.log(`Featured Products: ${featuredProducts}`);
        } catch (error) {
            console.error('Error getting stats:', error);
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('Connection closed');
        }
    }
}

// Simple CLI arg parser: --conn, --db, --file, --batch
function parseArgs(argv) {
    const args = { conn: undefined, db: 'apnidukaan', file: undefined, batch: 1000 };
    for (let i = 2; i < argv.length; i++) {
        const key = argv[i];
        const val = argv[i + 1];
        if (key === '--conn') { args.conn = val; i++; }
        else if (key === '--db') { args.db = val; i++; }
        else if (key === '--file') { args.file = val; i++; }
        else if (key === '--batch') { args.batch = parseInt(val, 10) || 1000; i++; }
    }
    return args;
}

// Main execution
async function main() {
    const { conn, db, file, batch } = parseArgs(process.argv);
    const CONNECTION_STRING = conn || process.env.MONGO_URI || "mongodb+srv://userservice-dev:eKtnLTAnmTlPVM9H@cluster0.0ezsixh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    const DATABASE_NAME = db || process.env.MONGO_DB || "apnidukaan";
    const CSV_FILE_PATH = file || process.env.DATASET_FILE || "your_dataset.csv";
    const BATCH_SIZE = batch || 1000;

    if (!CONNECTION_STRING) {
        console.error('Missing connection string. Provide via --conn or MONGO_URI.');
        process.exit(1);
    }
    if (!CSV_FILE_PATH || !fs.existsSync(CSV_FILE_PATH)) {
        console.error(`CSV file not found: ${CSV_FILE_PATH}`);
        process.exit(1);
    }

    const uploader = new ProductBulkUploader(CONNECTION_STRING, DATABASE_NAME);

    try {
        await uploader.connect();
        await uploader.uploadProducts(CSV_FILE_PATH, BATCH_SIZE);
        await uploader.createIndexes();
        await uploader.getStats();
        console.log('Bulk upload process completed successfully!');
    } catch (error) {
        console.error('Bulk upload failed:', error);
        process.exit(1);
    } finally {
        await uploader.close();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = ProductBulkUploader;
