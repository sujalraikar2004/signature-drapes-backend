/**
 * Migration Script: Fix HTTP → HTTPS for existing gallery records in MongoDB
 *
 * Run once with:
 *   node migrateGalleryUrls.js
 *
 * Requires MONGODB_URL in .env (same as the backend).
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const DB_NAME = "signature_draps_db";

async function migrate() {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    console.log("Connected to MongoDB:", DB_NAME);

    const db = mongoose.connection.db;
    const collection = db.collection("galleries");

    // Fix mediaUrl
    const mediaResult = await collection.updateMany(
        { mediaUrl: /^http:\/\// },
        [
            {
                $set: {
                    mediaUrl: {
                        $replaceAll: {
                            input: "$mediaUrl",
                            find: "http://",
                            replacement: "https://"
                        }
                    }
                }
            }
        ]
    );
    console.log(`mediaUrl updated: ${mediaResult.modifiedCount} documents`);

    // Fix thumbnailUrl
    const thumbResult = await collection.updateMany(
        { thumbnailUrl: /^http:\/\// },
        [
            {
                $set: {
                    thumbnailUrl: {
                        $replaceAll: {
                            input: "$thumbnailUrl",
                            find: "http://",
                            replacement: "https://"
                        }
                    }
                }
            }
        ]
    );
    console.log(`thumbnailUrl updated: ${thumbResult.modifiedCount} documents`);

    await mongoose.disconnect();
    console.log("Migration complete. Disconnected from MongoDB.");
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
