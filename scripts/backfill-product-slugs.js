import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/db/db.js";
import { Product, slugify } from "../src/models/product.model.js";

const getUniqueSlug = async (value, productId) => {
    const baseSlug = slugify(value || String(productId));
    let candidate = baseSlug;
    let suffix = 2;

    while (await Product.exists({ slug: candidate, _id: { $ne: productId } })) {
        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
    }

    return candidate;
};

const run = async () => {
    await connectDB();

    const products = await Product.find({
        isActive: true,
        $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }]
    }).select("name productCode slug images seo");

    let updated = 0;

    for (const product of products) {
        product.slug = await getUniqueSlug(product.name || product.productCode, product._id);

        if (product.images?.length) {
            product.images = product.images.map((image, index) => ({
                ...(image.toObject?.() || image),
                alt: image.alt || product.seo?.imageAlt || `${product.name} ${index === 0 ? "product image" : `image ${index + 1}`}`
            }));
        }

        await product.save();
        updated += 1;
    }

    console.log(`Backfilled slugs for ${updated} products.`);
    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error("Failed to backfill product slugs:", error);
    await mongoose.disconnect();
    process.exit(1);
});
