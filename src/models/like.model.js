import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
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
    likedAt: {
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

// Compound index to ensure one like per user per product
likeSchema.index({ userId: 1, productId: 1 }, { unique: true });
likeSchema.index({ productId: 1, likedAt: -1 });

// Static method to check if user has liked a product
likeSchema.statics.hasUserLiked = async function(userId, productId) {
    const like = await this.findOne({ userId, productId, isActive: true });
    return !!like;
};

// Static method to get like count for a product
likeSchema.statics.getLikeCount = async function(productId) {
    return await this.countDocuments({ productId, isActive: true });
};

// Static method to get products liked by a user
likeSchema.statics.getUserLikes = async function(userId, options = {}) {
    const { page = 1, limit = 10, sortBy = 'likedAt', sortOrder = -1 } = options;
    
    const skip = (page - 1) * limit;
    
    const likes = await this.find({ userId, isActive: true })
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
    return likes.filter(like => like.productId);
};

// Static method to toggle like (like/unlike)
likeSchema.statics.toggleLike = async function(userId, productId) {
    const existingLike = await this.findOne({ userId, productId });
    
    if (existingLike) {
        // Unlike: remove the like
        await this.findOneAndDelete({ userId, productId });
        return { liked: false, action: 'unliked' };
    } else {
        // Like: create new like
        await this.create({ userId, productId });
        return { liked: true, action: 'liked' };
    }
};

// Static method to get most liked products
likeSchema.statics.getMostLikedProducts = async function(options = {}) {
    const { limit = 10, timeframe = null } = options;
    
    let matchStage = { isActive: true };
    
    // Add time filter if specified
    if (timeframe) {
        const timeframeDays = {
            'week': 7,
            'month': 30,
            'year': 365
        };
        
        if (timeframeDays[timeframe]) {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - timeframeDays[timeframe]);
            matchStage.likedAt = { $gte: dateThreshold };
        }
    }
    
    const result = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: "$productId",
                likeCount: { $sum: 1 },
                latestLike: { $max: "$likedAt" }
            }
        },
        { $sort: { likeCount: -1, latestLike: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        { $match: { "product.isActive": true } },
        {
            $project: {
                productId: "$_id",
                likeCount: 1,
                product: {
                    _id: "$product._id",
                    name: "$product.name",
                    price: "$product.price",
                    originalPrice: "$product.originalPrice",
                    images: "$product.images",
                    category: "$product.category",
                    brand: "$product.brand",
                    rating: "$product.rating",
                    reviewCount: "$product.reviewCount"
                }
            }
        }
    ]);
    
    return result;
};

export const Like = mongoose.model("Like", likeSchema);
