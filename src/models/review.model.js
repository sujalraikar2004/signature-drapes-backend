import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema({
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
    userName: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    verified: {
        type: Boolean,
        default: false,
        index: true
    },
    helpful: {
        type: Number,
        default: 0,
        min: 0
    },
    helpfulBy: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for better query performance
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

// Static method to get average rating for a product
reviewSchema.statics.getProductRating = async function(productId) {
    const result = await this.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), isActive: true } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    
    return result.length > 0 ? {
        rating: Math.round(result[0].averageRating * 10) / 10,
        reviewCount: result[0].totalReviews
    } : { rating: 0, reviewCount: 0 };
};

// Static method to check if user has reviewed a product
reviewSchema.statics.hasUserReviewed = async function(userId, productId) {
    const review = await this.findOne({ userId, productId, isActive: true });
    return !!review;
};

export const Review = mongoose.model("Review", reviewSchema);
