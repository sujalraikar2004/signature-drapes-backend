import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DB_NAME } from '../src/constants.js';
import { Product } from '../src/models/product.model.js';

dotenv.config({ path: './.env' });

if (!process.env.MONGODB_URL) {
    throw new Error('MONGODB_URL is required to run this migration');
}

try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    const result = await Product.updateMany(
        {
            category: 'artificial-grass-plant-vertical-garden',
            subcategory: 'artificial-grass'
        },
        {
            $set: { subcategory: 'lawn-grass' },
            $addToSet: {
                searchKeywords: {
                    $each: [
                        'artificial lawn grass',
                        'artificial grass',
                        'synthetic grass',
                        'synthetic turf',
                        'balcony grass',
                        'garden grass'
                    ]
                }
            }
        }
    );

    console.log(`Migration complete: ${result.modifiedCount} product(s) updated.`);
} finally {
    await mongoose.disconnect();
}
