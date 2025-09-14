import mongoose, { Schema } from "mongoose";

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },
    addedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound index to ensure one wishlist entry per user per product
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
wishlistSchema.index({ userId: 1, addedAt: -1 });

// Static method to check if product is in user's wishlist
wishlistSchema.statics.isInWishlist = async function(userId, productId) {
    const wishlistItem = await this.findOne({ userId, productId, isActive: true });
    return !!wishlistItem;
};

// Static method to get user's wishlist with product details
wishlistSchema.statics.getUserWishlist = async function(userId, options = {}) {
    const { page = 1, limit = 10, sortBy = 'addedAt', sortOrder = -1 } = options;
    
    const skip = (page - 1) * limit;
    
    const wishlist = await this.find({ userId, isActive: true })
        .populate({
            path: 'productId',
            select: 'name price originalPrice images category brand rating reviewCount inStock isActive',
            match: { isActive: true }
        })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();
    
    // Filter out items where product was deleted
    return wishlist.filter(item => item.productId);
};

// Static method to get wishlist count for a user
wishlistSchema.statics.getWishlistCount = async function(userId) {
    return await this.countDocuments({ userId, isActive: true });
};

// Static method to add to wishlist
wishlistSchema.statics.addToWishlist = async function(userId, productId) {
    try {
        const wishlistItem = await this.create({ userId, productId });
        return wishlistItem;
    } catch (error) {
        if (error.code === 11000) {
            // Item already in wishlist, just return existing
            return await this.findOne({ userId, productId });
        }
        throw error;
    }
};

// Static method to remove from wishlist
wishlistSchema.statics.removeFromWishlist = async function(userId, productId) {
    return await this.findOneAndDelete({ userId, productId });
};

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
