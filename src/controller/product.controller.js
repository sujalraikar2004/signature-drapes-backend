import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Review } from "../models/review.model.js";
import { Like } from "../models/like.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Get all products with filtering, sorting, and pagination
const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            subcategory,
            brand,
            minPrice,
            maxPrice,
            inStock,
            isNew,
            isBestSeller,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search
        } = req.query;

        // Build filter object
        const filter = { isActive: true };

        if (category) filter.category = category;
        if (subcategory) filter.subcategory = subcategory;
        if (brand) filter.brand = new RegExp(brand, 'i');
        if (inStock !== undefined) filter.inStock = inStock === 'true';
        if (isNew !== undefined) filter.isNew = isNew === 'true';
        if (isBestSeller !== undefined) filter.isBestSeller = isBestSeller === 'true';

        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Search filter
        if (search) {
            filter.$text = { $search: search };
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (Number(page) - 1) * Number(limit);
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .select('-reviews'); // Exclude reviews for performance

        const total = await Product.countDocuments(filter);
        const totalPages = Math.ceil(total / Number(limit));

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalProducts: total,
                hasNext: Number(page) < totalPages,
                hasPrev: Number(page) > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching products",
            error: error.message
        });
    }
};

// Get single product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        
        const product = await Product.findById(id);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Get product data with virtuals
        const productData = product.toObject({ virtuals: true });
        
        // Add user-specific data if authenticated
        if (userId) {
            const [isLiked, isInWishlist, likeCount] = await Promise.all([
                Like.hasUserLiked(userId, id),
                Wishlist.isInWishlist(userId, id),
                Like.getLikeCount(id)
            ]);
            
            productData.isLiked = isLiked;
            productData.isInWishlist = isInWishlist;
            productData.likeCount = likeCount;
        } else {
            // For non-authenticated users, just get like count
            productData.likeCount = await Like.getLikeCount(id);
        }

        res.status(200).json({
            success: true,
            data: productData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching product",
            error: error.message
        });
    }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const filter = { category, isActive: true };
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (Number(page) - 1) * Number(limit);
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .select('-reviews');

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalProducts: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching products by category",
            error: error.message
        });
    }
};

// Search products
const searchProducts = async (req, res) => {
    try {
        const { q, page = 1, limit = 12 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const filter = {
            isActive: true,
            $or: [
                { name: new RegExp(q, 'i') },
                { description: new RegExp(q, 'i') },
                { brand: new RegExp(q, 'i') },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ]
        };

        const skip = (Number(page) - 1) * Number(limit);
        const products = await Product.find(filter)
            .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .select('-reviews');

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalProducts: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error searching products",
            error: error.message
        });
    }
};

// Create new product
const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            category,
            subcategory,
            brand,
            features,
            inStock,
            stockQuantity,
            isNew,
            isBestSeller,
            tags,
            dimensions,
            weight,
            material,
            color
        } = req.body;

        // Validate required fields
        if (!name || !description || !price || !category || !subcategory) {
            return res.status(400).json({
                success: false,
                message: "Name, description, price, category, and subcategory are required"
            });
        }

        // Handle image uploads
        const images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const uploadResult = await uploadonCloudinary(file.path);
                    images.push({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id,
                        alt: `${name} image`
                    });
                    // Clean up local file
                    fs.unlinkSync(file.path);
                } catch (uploadError) {
                    console.error("Error uploading image:", uploadError);
                    // Clean up local file on error
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }
        }

        const productData = {
            name,
            description,
            price: Number(price),
            category,
            subcategory,
            images,
            inStock: inStock !== undefined ? inStock === 'true' : true,
            createdBy: req.user?._id
        };

        // Add optional fields if provided
        if (originalPrice) productData.originalPrice = Number(originalPrice);
        if (brand) productData.brand = brand;
        if (features) productData.features = Array.isArray(features) ? features : features.split(',').map(f => f.trim());
        if (stockQuantity) productData.stockQuantity = Number(stockQuantity);
        if (isNew !== undefined) productData.isNew = isNew === 'true';
        if (isBestSeller !== undefined) productData.isBestSeller = isBestSeller === 'true';
        if (tags) productData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
        if (dimensions) productData.dimensions = JSON.parse(dimensions);
        if (weight) productData.weight = JSON.parse(weight);
        if (material) productData.material = material;
        if (color) productData.color = Array.isArray(color) ? color : color.split(',').map(c => c.trim());

        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating product",
            error: error.message
        });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Handle new image uploads
        if (req.files && req.files.length > 0) {
            const newImages = [];
            for (const file of req.files) {
                try {
                    const uploadResult = await uploadonCloudinary(file.path);
                    newImages.push({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id,
                        alt: `${updateData.name || 'Product'} image`
                    });
                    fs.unlinkSync(file.path);
                } catch (uploadError) {
                    console.error("Error uploading image:", uploadError);
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }
            
            // Add new images to existing ones or replace
            if (updateData.replaceImages === 'true') {
                // Delete old images from cloudinary
                const existingProduct = await Product.findById(id);
                if (existingProduct && existingProduct.images) {
                    for (const image of existingProduct.images) {
                        try {
                            await cloudinary.uploader.destroy(image.publicId);
                        } catch (error) {
                            console.error("Error deleting old image:", error);
                        }
                    }
                }
                updateData.images = newImages;
            } else {
                // Append new images
                const existingProduct = await Product.findById(id);
                updateData.images = [...(existingProduct?.images || []), ...newImages];
            }
        }

        // Parse arrays and objects from strings if needed
        if (updateData.features && typeof updateData.features === 'string') {
            updateData.features = updateData.features.split(',').map(f => f.trim());
        }
        if (updateData.tags && typeof updateData.tags === 'string') {
            updateData.tags = updateData.tags.split(',').map(t => t.trim());
        }
        if (updateData.color && typeof updateData.color === 'string') {
            updateData.color = updateData.color.split(',').map(c => c.trim());
        }
        if (updateData.dimensions && typeof updateData.dimensions === 'string') {
            updateData.dimensions = JSON.parse(updateData.dimensions);
        }
        if (updateData.weight && typeof updateData.weight === 'string') {
            updateData.weight = JSON.parse(updateData.weight);
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating product",
            error: error.message
        });
    }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting product",
            error: error.message
        });
    }
};

// Add review to product
const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user._id;
        const userName = req.user.username;

        // Check if product exists
        const product = await Product.findById(id);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if user has already reviewed this product
        const hasReviewed = await Review.hasUserReviewed(userId, id);
        if (hasReviewed) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product"
            });
        }

        // Create new review
        const review = new Review({
            userId,
            productId: id,
            userName,
            rating,
            title,
            comment
        });

        await review.save();

        // Update product rating and review count
        await product.updateRatingFromReviews();

        res.status(201).json({
            success: true,
            message: "Review added successfully",
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error adding review",
            error: error.message
        });
    }
};

// Get all reviews for a product
const getProductReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Check if product exists
        const product = await Product.findById(id);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        const sort = {};
        sort[sortBy] = sortDirection;

        const reviews = await Review.find({ productId: id, isActive: true })
            .populate('userId', 'username email')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        const totalReviews = await Review.countDocuments({ productId: id, isActive: true });
        const ratingData = await Review.getProductRating(id);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                totalReviews,
                averageRating: ratingData.rating,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalReviews / Number(limit)),
                    hasNext: skip + Number(limit) < totalReviews,
                    hasPrev: Number(page) > 1
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching product reviews",
            error: error.message
        });
    }
};

// Update review
const updateReview = async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: reviewId, userId, productId: id, isActive: true });
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to update it"
            });
        }

        review.rating = rating || review.rating;
        review.title = title || review.title;
        review.comment = comment || review.comment;
        review.updatedAt = new Date();

        await review.save();

        // Update product rating
        const product = await Product.findById(id);
        await product.updateRatingFromReviews();

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating review",
            error: error.message
        });
    }
};

// Delete review
const deleteReview = async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: reviewId, userId, productId: id, isActive: true });
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to delete it"
            });
        }

        review.isActive = false;
        await review.save();

        // Update product rating
        const product = await Product.findById(id);
        await product.updateRatingFromReviews();

        res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting review",
            error: error.message
        });
    }
};

// Mark review as helpful
const markReviewHelpful = async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: reviewId, productId: id, isActive: true });
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user already marked this review as helpful
        if (review.helpfulBy.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "You have already marked this review as helpful"
            });
        }

        review.helpful += 1;
        review.helpfulBy.push(userId);
        await review.save();

        res.status(200).json({
            success: true,
            message: "Review marked as helpful",
            data: { helpful: review.helpful }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error marking review as helpful",
            error: error.message
        });
    }
};

// Toggle like/unlike product
const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Check if product exists
        const product = await Product.findById(id);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Toggle like
        const likeResult = await Like.toggleLike(userId, id);
        
        // Sync with wishlist (maintaining existing behavior)
        if (likeResult.liked) {
            // Add to wishlist when liked
            await Wishlist.addToWishlist(userId, id);
        } else {
            // Remove from wishlist when unliked
            await Wishlist.removeFromWishlist(userId, id);
        }

        // Get updated counts
        const likeCount = await Like.getLikeCount(id);
        const wishlistCount = await Wishlist.getWishlistCount(userId);

        res.status(200).json({
            success: true,
            message: likeResult.liked ? "Product added to wishlist" : "Product removed from wishlist",
            data: {
                isLiked: likeResult.liked,
                likeCount,
                wishlistCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error toggling like",
            error: error.message
        });
    }
};

// Get featured products (best sellers, new arrivals)
const getFeaturedProducts = async (req, res) => {
    try {
        const { type = 'bestseller', limit = 8 } = req.query;

        let filter = { isActive: true };
        let sort = { createdAt: -1 };

        switch (type) {
            case 'bestseller':
                filter.isBestSeller = true;
                sort = { rating: -1, reviewCount: -1 };
                break;
            case 'new':
                filter.isNew = true;
                sort = { createdAt: -1 };
                break;
            case 'toprated':
                sort = { rating: -1, reviewCount: -1 };
                break;
            default:
                filter.isBestSeller = true;
        }

        const products = await Product.find(filter)
            .sort(sort)
            .limit(Number(limit))
            .select('-reviews');

        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching featured products",
            error: error.message
        });
    }
};

// Get product categories with counts
const getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },

      // Group by category
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          firstProductImages: { $first: "$images" } // get the images array of first product
        }
      },

      // Project the fields we want
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          // take the first image's url if exists
          image: { $cond: [{ $gt: [{ $size: "$firstProductImages" }, 0] }, { $arrayElemAt: ["$firstProductImages.url", 0] }, null] }
        }
      },

      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message
    });
  }
};



export {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    addReview,
    getProductReviews,
    updateReview,
    deleteReview,
    markReviewHelpful,
    toggleLike,
    getFeaturedProducts,
    getCategories
};