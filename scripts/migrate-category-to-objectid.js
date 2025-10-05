/*
  Usage (PowerShell):
  node scripts/migrate-category-to-objectid.js --conn "<mongodb-uri>" --db apnidukaan
*/

const { MongoClient, ObjectId } = require('mongodb');

function parseArgs(argv) {
    const args = { conn: process.env.MONGO_URI, db: process.env.MONGO_DB || 'apnidukaan' };
    for (let i = 2; i < argv.length; i++) {
        const k = argv[i];
        const v = argv[i + 1];
        if (k === '--conn') { args.conn = v; i++; }
        else if (k === '--db') { args.db = v; i++; }
    }
    return args;
}

async function run() {
    const { conn, db } = parseArgs(process.argv);
    if (!conn) {
        console.error('Missing --conn MONGO_URI');
        process.exit(1);
    }

    const client = new MongoClient(conn);
    try {
        await client.connect();
        const database = client.db(db);
        const products = database.collection('products');

        console.log('Converting string category hex to ObjectId...');
        const res = await products.updateMany(
            { category: { $type: 'string', $regex: /^[a-f0-9]{24}$/ } },
            [ { $set: { category: { $toObjectId: '$category' } } } ]
        );
        console.log('Modified:', res.modifiedCount);

        // Verify sample
        const sample = await products.findOne({ category: { $type: 'objectId' } });
        console.log('Sample with ObjectId category:', sample ? { _id: sample._id, category: sample.category } : null);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    run();
}


