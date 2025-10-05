/*
  Script: Drop the `products` collection (removes all documents and indexes)
  Usage:
    1) npm i mongodb
    2) node scripts/clear-products.js
*/

const { MongoClient } = require("mongodb");

// Prefer using an environment variable for secrets in real usage.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://userservice-dev:eKtnLTAnmTlPVM9H@cluster0.0ezsixh.mongodb.net/apnidukaan?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = process.env.MONGODB_DB || "apnidukaan";
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || "products";

function redactConnectionString(uri) {
  try {
    const u = new URL(uri);
    const [user] = (u.username || "").split(":");
    const host = u.host;
    const db = (u.pathname || "/").replace(/^\//, "") || "(none)";
    return `mongodb+srv://${user ? user + "@" : ""}${host}/${db}`;
  } catch {
    return "(unable to parse URI)";
  }
}

async function dropProductsCollection() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);

    console.log("Connecting to:");
    console.log("  URI:", redactConnectionString(MONGODB_URI));
    console.log("  Database:", DATABASE_NAME);
    console.log("  Collection:", COLLECTION_NAME);

    const existingCollections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (existingCollections.length === 0) {
      console.log(`Collection \`${COLLECTION_NAME}\` does not exist in \`${DATABASE_NAME}\`. Nothing to drop.`);
      return;
    }

    const beforeCount = await db.collection(COLLECTION_NAME).estimatedDocumentCount();
    console.log(`Before: documents=${beforeCount}`);

    let dropped = false;
    try {
      // Prefer db-level drop for clarity
      dropped = await db.dropCollection(COLLECTION_NAME);
    } catch (e) {
      console.warn("dropCollection threw:", e.message);
      console.warn("Attempting collection.drop() as fallback...");
      try {
        dropped = await db.collection(COLLECTION_NAME).drop();
      } catch (e2) {
        console.warn("collection.drop() also failed:", e2.message);
      }
    }

    if (dropped) {
      console.log(`Dropped collection \`${COLLECTION_NAME}\` from database \`${DATABASE_NAME}\`.`);
      console.log("All documents and indexes associated with the collection have been removed.");
    } else {
      console.log(`Drop did not complete for \`${COLLECTION_NAME}\`. Running hard cleanup (deleteMany + dropIndexes) as fallback...`);
      const coll = db.collection(COLLECTION_NAME);
      const delRes = await coll.deleteMany({});
      try {
        await coll.dropIndexes();
      } catch (e3) {
        if (e3 && /ns not found|index not found/i.test(e3.message || "")) {
          // ignore
        } else {
          console.warn("dropIndexes warning:", e3.message);
        }
      }
      console.log(`Fallback deleteMany removed ${delRes.deletedCount} documents.`);
    }

    const existsAfter = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (existsAfter.length === 0) {
      console.log("Verified: collection no longer exists.");
    } else {
      const afterCount = await db.collection(COLLECTION_NAME).estimatedDocumentCount();
      console.log(`After: documents=${afterCount}`);
    }
  } catch (error) {
    console.error("Failed to drop collection:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

dropProductsCollection();


