import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    helpful: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

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
    reviews: [reviewSchema],
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
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ likes: 1 });

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

// Virtual for like count
productSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Method to calculate average rating
productSchema.methods.calculateAverageRating = function() {
    if (this.reviews.length === 0) {
        this.rating = 0;
        this.reviewCount = 0;
        return;
    }
    
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = Math.round((totalRating / this.reviews.length) * 10) / 10; // Round to 1 decimal
    this.reviewCount = this.reviews.length;
};

// Pre-save middleware to update rating
productSchema.pre('save', function(next) {
    if (this.isModified('reviews')) {
        this.calculateAverageRating();
    }
    next();
});

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model("Product", productSchema);