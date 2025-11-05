import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    productCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
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
        enum: [
            'curtains-and-accessories',
            'sofa-recliner-chairs-corner-sofa', 
            'home-decor-wallpaper-stickers',
            'window-blinds',
            'bedsheet-and-comforters',
            'institutional-project-window-blinds',
            'bean-bags-and-beans',
            'carpet-rugs-door-mats',
            'artificial-grass-plant-vertical-garden'
        ],
        index: true
    },
    subcategory: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(value) {
                // Define valid subcategories for each category
                const validSubcategories = {
                    'curtains-and-accessories': [
                        'ready-made-curtains', 'custom-curtains', 'curtain-accessories', 'curtain-tracks'
                    ],
                    'window-blinds': [
                        'zebra-blinds', 'roller-blinds', 'roman-blinds', 'pvc-balcony-blinds'
                    ],
                    'bean-bags-and-beans': [
                        'bean-bags', 'thermacol-beans', 'bean-bag-covers'
                    ],
                    'home-decor-wallpaper-stickers': [
                        '3d-wallpaper', 'self-adhesive-wallpaper', 'wall-stickers', 'pvc-wall-panel'
                    ],
                    'sofa-recliner-chairs-corner-sofa': [
                        'sofas', 'recliners', 'chairs', 'corner-sofas'
                    ],
                    'bedsheet-and-comforters': [
                        'bedsheets', 'comforters', 'pillow-covers'
                    ],
                    'institutional-project-window-blinds': [
                        'office-blinds', 'hospital-blinds', 'school-blinds'
                    ],
                    'carpet-rugs-door-mats': [
                        'carpets', 'rugs', 'door-mats'
                    ],
                    'artificial-grass-plant-vertical-garden': [
                        'artificial-grass', 'artificial-plants', 'vertical-gardens'
                    ]
                };
                
                return validSubcategories[this.category]?.includes(value);
            },
            message: 'Subcategory must be valid for the selected category'
        },
        index: true
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
    videos: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            default: ""
        },
        duration: {
            type: Number,
            default: 0
        },
        format: {
            type: String,
            default: "mp4"
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
    // New fields for customizable products
    isCustomizable: {
        type: Boolean,
        default: false,
        index: true
    },
    sizeVariants: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: {
                type: String,
                enum: ['cm', 'inch', 'ft', 'm'],
                default: 'ft'
            }
        },
        // Additional fields for special products
        area: {
            type: Number,
            min: 0
        },
        diameter: {
            type: Number,
            min: 0
        },
        sizeLabel: {
            type: String,
            trim: true,
            uppercase: true,
            enum: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '']
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
        stockQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        inStock: {
            type: Boolean,
            default: true
        }
    }],
    allowCustomSize: {
        type: Boolean,
        default: false
    },
    customSizeConfig: {
        enabled: {
            type: Boolean,
            default: false
        },
        fields: [{
            type: String,
            enum: ['length', 'width', 'height', 'area', 'diameter']
        }],
        unit: {
            type: String,
            enum: ['cm', 'inch', 'ft', 'm', 'sqft', 'sqm'],
            default: 'ft'
        },
        pricePerUnit: {
            type: Number,
            min: 0
        },
        minimumCharge: {
            type: Number,
            min: 0
        }
    },
    disclaimer: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    // Delivery and Policy fields
    deliveryInfo: {
        cashOnDelivery: {
            type: Boolean,
            default: true,
            index: true
        },
        freeDelivery: {
            type: Boolean,
            default: false,
            index: true
        },
        deliveryCharges: {
            type: Number,
            default: 0,
            min: 0
        },
        estimatedDays: {
            min: {
                type: Number,
                default: 3,
                min: 0
            },
            max: {
                type: Number,
                default: 7,
                min: 0
            }
        },
        deliveryPartner: {
            type: String,
            trim: true,
            default: 'Signature Draps'
        }
    },
    returnPolicy: {
        returnable: {
            type: Boolean,
            default: true,
            index: true
        },
        returnDays: {
            type: Number,
            enum: [0, 7, 10, 15, 30],
            default: 7
        },
        returnConditions: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    secureTransaction: {
        type: Boolean,
        default: true
    },
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

// Static method to get valid subcategories for a category
productSchema.statics.getValidSubcategories = function(category) {
    const validSubcategories = {
        'curtains-and-accessories': [
            'ready-made-curtains', 'custom-curtains', 'curtain-accessories', 'curtain-tracks'
        ],
        'window-blinds': [
            'zebra-blinds', 'roller-blinds', 'roman-blinds', 'pvc-balcony-blinds'
        ],
        'bean-bags-and-beans': [
            'bean-bags', 'thermacol-beans', 'bean-bag-covers'
        ],
        'home-decor-wallpaper-stickers': [
            '3d-wallpaper', 'self-adhesive-wallpaper', 'wall-stickers', 'pvc-wall-panel'
        ],
        'sofa-recliner-chairs-corner-sofa': [
            'sofas', 'recliners', 'chairs', 'corner-sofas'
        ],
        'bedsheet-and-comforters': [
            'bedsheets', 'comforters', 'pillow-covers'
        ],
        'institutional-project-window-blinds': [
            'office-blinds', 'hospital-blinds', 'school-blinds'
        ],
        'carpet-rugs-door-mats': [
            'carpets', 'rugs', 'door-mats'
        ],
        'artificial-grass-plant-vertical-garden': [
            'artificial-grass', 'artificial-plants', 'vertical-gardens'
        ]
    };
    
    return validSubcategories[category] || [];
};

// Static method to get all categories with their subcategories
productSchema.statics.getAllCategoriesWithSubcategories = function() {
    return {
        'curtains-and-accessories': {
            name: 'Curtains & Accessories',
            subcategories: [
                { id: 'ready-made-curtains', name: 'Ready Made Curtains' },
                { id: 'custom-curtains', name: 'Custom Curtains' },
                { id: 'curtain-accessories', name: 'Curtain Accessories' },
                { id: 'curtain-tracks', name: 'Curtain Track & Steel Pipe' }
            ]
        },
        'window-blinds': {
            name: 'Window Blinds',
            subcategories: [
                { id: 'zebra-blinds', name: 'Zebra Blinds' },
                { id: 'roller-blinds', name: 'Roller Blinds' },
                { id: 'roman-blinds', name: 'Roman Blinds' },
                { id: 'pvc-balcony-blinds', name: 'PVC Balcony Blinds' }
            ]
        },
        'bean-bags-and-beans': {
            name: 'Bean Bags and Beans',
            subcategories: [
                { id: 'bean-bags', name: 'Bean Bags' },
                { id: 'thermacol-beans', name: 'Thermacol Beans' },
                { id: 'bean-bag-covers', name: 'Bean Bag Covers' }
            ]
        },
        'home-decor-wallpaper-stickers': {
            name: 'Home Decor Wallpaper and Stickers',
            subcategories: [
                { id: '3d-wallpaper', name: 'Imported 3D Wallpaper' },
                { id: 'self-adhesive-wallpaper', name: 'Self-Adhesive Wallpaper' },
                { id: 'wall-stickers', name: 'Wall Stickers' },
                { id: 'pvc-wall-panel', name: 'PVC Wall Panel' }
            ]
        },
        'sofa-recliner-chairs-corner-sofa': {
            name: 'Sofa, Recliner, Chairs and Corner Sofa',
            subcategories: [
                { id: 'sofas', name: 'Sofas' },
                { id: 'recliners', name: 'Recliners' },
                { id: 'chairs', name: 'Chairs' },
                { id: 'corner-sofas', name: 'Corner Sofas' }
            ]
        },
        'bedsheet-and-comforters': {
            name: 'Bedsheet and Comforters',
            subcategories: [
                { id: 'bedsheets', name: 'Bedsheets' },
                { id: 'comforters', name: 'Comforters' },
                { id: 'pillow-covers', name: 'Pillow Covers' }
            ]
        },
        'institutional-project-window-blinds': {
            name: 'Institutional Project Window Blinds',
            subcategories: [
                { id: 'office-blinds', name: 'Office Blinds' },
                { id: 'hospital-blinds', name: 'Hospital Blinds' },
                { id: 'school-blinds', name: 'School Blinds' }
            ]
        },
        'carpet-rugs-door-mats': {
            name: 'Carpet, Rugs and Door Mats',
            subcategories: [
                { id: 'carpets', name: 'Carpets' },
                { id: 'rugs', name: 'Rugs' },
                { id: 'door-mats', name: 'Door Mats' }
            ]
        },
        'artificial-grass-plant-vertical-garden': {
            name: 'Artificial Grass, Plant and Vertical Garden',
            subcategories: [
                { id: 'artificial-grass', name: 'Artificial Grass' },
                { id: 'artificial-plants', name: 'Artificial Plants' },
                { id: 'vertical-gardens', name: 'Vertical Gardens' }
            ]
        }
    };
};

// Static method to validate category-subcategory combination
productSchema.statics.isValidCategorySubcategory = function(category, subcategory) {
    const validSubcategories = this.getValidSubcategories(category);
    return validSubcategories.includes(subcategory);
};

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model("Product", productSchema);