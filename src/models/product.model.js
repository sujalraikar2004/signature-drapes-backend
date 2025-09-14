import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['curtains-furnishing', 'blinds', 'bean-bags', 'wallpaper', 'carpets-rugs'],
        index: true
    },
    subcategory: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true,
        index: true
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            default: ""
        }
    }],
    features: [{
        type: String,
        trim: true
    }],
    inStock: {
        type: Boolean,
        default: true,
        index: true
    },
    stockQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    isNew: {
        type: Boolean,
        default: false,
        index: true
    },
    isBestSeller: {
        type: Boolean,
        default: false,
        index: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'inch', 'ft'],
            default: 'cm'
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['kg', 'g', 'lb'],
            default: 'kg'
        }
    },
    material: {
        type: String,
        trim: true
    },
    color: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

// Virtual for main image (first image in array)
productSchema.virtual('image').get(function() {
    return this.images && this.images.length > 0 ? this.images[0].url : null;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Method to update rating and review count from Review model
productSchema.methods.updateRatingFromReviews = async function() {
    const { Review } = await import('./review.model.js');
    const ratingData = await Review.getProductRating(this._id);
    
    this.rating = ratingData.rating;
    this.reviewCount = ratingData.reviewCount;
    
    return this.save();
};

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model("Product", productSchema);