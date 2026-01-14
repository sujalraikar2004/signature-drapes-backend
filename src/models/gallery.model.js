import mongoose, { Schema } from "mongoose";

const gallerySchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Curtains',
            'Wallpapers',
            'Blinds',
            'Furniture',
            'Outdoors',
            'Bedding',
            'Rugs',
            'Home Decor',
            'Other'
        ],
        index: true
    },
    mediaType: {
        type: String,
        required: true,
        enum: ['image', 'video']
    },
    mediaUrl: {
        type: String,
        required: true
    },
    publicId: {
        type: String, // Cloudinary public ID for deletion
        required: true
    },
    thumbnailUrl: {
        type: String // For videos, store thumbnail
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0 // For custom ordering in gallery
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Indexes for efficient queries
gallerySchema.index({ category: 1, isActive: 1 });
gallerySchema.index({ createdAt: -1 });
gallerySchema.index({ order: 1 });

export const Gallery = mongoose.model("Gallery", gallerySchema);
