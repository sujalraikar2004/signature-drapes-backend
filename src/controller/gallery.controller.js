import { Gallery } from "../models/gallery.model.js";
import { uploadonCloudinary, uploadVideoOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// Get all gallery items with filtering and pagination
const getAllGalleryItems = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 100,
            category,
            mediaType,
            isActive
        } = req.query;

        console.log('Gallery API called with params:', req.query);

        // Build filter object
        const filter = {};
        
        // Only filter by isActive if explicitly set
        if (isActive !== undefined && isActive !== null && isActive !== '') {
            filter.isActive = isActive === 'true' || isActive === true;
        }
        
        if (category && category !== 'All') {
            filter.category = category;
        }
        
        if (mediaType && mediaType !== 'All') {
            filter.mediaType = mediaType;
        }

        console.log('Gallery filter:', filter);

        // Execute query with pagination and sorting
        const skip = (Number(page) - 1) * Number(limit);
        const galleryItems = await Gallery.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Gallery.countDocuments(filter);

        console.log(`Found ${galleryItems.length} gallery items (total: ${total})`);

        res.status(200).json({
            success: true,
            data: galleryItems,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching gallery items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gallery items',
            error: error.message
        });
    }
};

// Get single gallery item by ID
const getGalleryItemById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const galleryItem = await Gallery.findById(id);
        
        if (!galleryItem) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: galleryItem
        });
    } catch (error) {
        console.error('Error fetching gallery item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gallery item',
            error: error.message
        });
    }
};

// Create new gallery item (image)
const createGalleryImage = async (req, res) => {
    try {
        const { title, description, category, tags, order } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image file is required'
            });
        }

        // Upload to Cloudinary
        const cloudinaryResponse = await uploadonCloudinary(req.file.buffer, req.file.originalname);

        if (!cloudinaryResponse) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload image to cloud storage'
            });
        }

        // Create gallery item
        const galleryItem = await Gallery.create({
            title,
            description,
            category,
            mediaType: 'image',
            mediaUrl: cloudinaryResponse.url,
            publicId: cloudinaryResponse.public_id,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
            order: order || 0
        });

        res.status(201).json({
            success: true,
            message: 'Gallery image created successfully',
            data: galleryItem
        });
    } catch (error) {
        console.error('Error creating gallery image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create gallery image',
            error: error.message
        });
    }
};

// Create new gallery item (video)
const createGalleryVideo = async (req, res) => {
    try {
        const { title, description, category, tags, order } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Video file is required'
            });
        }

        // Upload video to Cloudinary
        const cloudinaryResponse = await uploadVideoOnCloudinary(req.file.buffer, req.file.originalname);

        if (!cloudinaryResponse) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload video to cloud storage'
            });
        }

        // Create gallery item with thumbnail
        const galleryItem = await Gallery.create({
            title,
            description,
            category,
            mediaType: 'video',
            mediaUrl: cloudinaryResponse.url,
            publicId: cloudinaryResponse.public_id,
            thumbnailUrl: cloudinaryResponse.thumbnail_url || cloudinaryResponse.url.replace(/\.[^/.]+$/, ".jpg"),
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
            order: order || 0
        });

        res.status(201).json({
            success: true,
            message: 'Gallery video created successfully',
            data: galleryItem
        });
    } catch (error) {
        console.error('Error creating gallery video:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create gallery video',
            error: error.message
        });
    }
};

// Create multiple gallery items at once
const createMultipleGalleryItems = async (req, res) => {
    try {
        const { items } = req.body; // Array of items with { title, description, category, mediaType, mediaUrl, publicId }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items array is required'
            });
        }

        const galleryItems = await Gallery.insertMany(items);

        res.status(201).json({
            success: true,
            message: `${galleryItems.length} gallery items created successfully`,
            data: galleryItems
        });
    } catch (error) {
        console.error('Error creating multiple gallery items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create gallery items',
            error: error.message
        });
    }
};

// Update gallery item
const updateGalleryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, tags, order, isActive } = req.body;

        const galleryItem = await Gallery.findById(id);

        if (!galleryItem) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found'
            });
        }

        // Update fields
        if (title !== undefined) galleryItem.title = title;
        if (description !== undefined) galleryItem.description = description;
        if (category !== undefined) galleryItem.category = category;
        if (tags !== undefined) {
            galleryItem.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
        }
        if (order !== undefined) galleryItem.order = order;
        if (isActive !== undefined) galleryItem.isActive = isActive;

        // If new media file is uploaded
        if (req.file) {
            // Delete old media from Cloudinary
            await deleteFromCloudinary(galleryItem.publicId);

            // Upload new media
            let cloudinaryResponse;
            if (galleryItem.mediaType === 'image') {
                cloudinaryResponse = await uploadonCloudinary(req.file.buffer, req.file.originalname);
            } else {
                cloudinaryResponse = await uploadVideoOnCloudinary(req.file.buffer, req.file.originalname);
                galleryItem.thumbnailUrl = cloudinaryResponse.thumbnail_url || cloudinaryResponse.url.replace(/\.[^/.]+$/, ".jpg");
            }

            if (cloudinaryResponse) {
                galleryItem.mediaUrl = cloudinaryResponse.url;
                galleryItem.publicId = cloudinaryResponse.public_id;
            }
        }

        await galleryItem.save();

        res.status(200).json({
            success: true,
            message: 'Gallery item updated successfully',
            data: galleryItem
        });
    } catch (error) {
        console.error('Error updating gallery item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update gallery item',
            error: error.message
        });
    }
};

// Delete gallery item
const deleteGalleryItem = async (req, res) => {
    try {
        const { id } = req.params;

        const galleryItem = await Gallery.findById(id);

        if (!galleryItem) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found'
            });
        }

        // Delete from Cloudinary
        await deleteFromCloudinary(galleryItem.publicId);

        // Delete from database
        await Gallery.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Gallery item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete gallery item',
            error: error.message
        });
    }
};

// Delete multiple gallery items
const deleteMultipleGalleryItems = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'IDs array is required'
            });
        }

        const galleryItems = await Gallery.find({ _id: { $in: ids } });

        // Delete from Cloudinary
        for (const item of galleryItems) {
            await deleteFromCloudinary(item.publicId);
        }

        // Delete from database
        await Gallery.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            success: true,
            message: `${galleryItems.length} gallery items deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting gallery items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete gallery items',
            error: error.message
        });
    }
};

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Gallery.distinct('category');
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};

// Update gallery items order
const updateGalleryOrder = async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, order }

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Items array is required'
            });
        }

        // Update order for each item
        const updatePromises = items.map(item => 
            Gallery.findByIdAndUpdate(item.id, { order: item.order })
        );

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: 'Gallery order updated successfully'
        });
    } catch (error) {
        console.error('Error updating gallery order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update gallery order',
            error: error.message
        });
    }
};

export {
    getAllGalleryItems,
    getGalleryItemById,
    createGalleryImage,
    createGalleryVideo,
    createMultipleGalleryItems,
    updateGalleryItem,
    deleteGalleryItem,
    deleteMultipleGalleryItems,
    getCategories,
    updateGalleryOrder
};
