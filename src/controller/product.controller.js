import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Review } from "../models/review.model.js";
import { Like } from "../models/like.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { uploadonCloudinary, uploadVideoOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Order } from "../models/order.model.js";

// Get all products with filtering, sorting, and pagination
const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 1000,
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

        const userId = req.user?._id;

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
        let products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .select('-reviews'); // Exclude reviews for performance

        // Add isLiked status for authenticated users
        if (userId) {
            const productsWithLikeStatus = await Promise.all(
                products.map(async (product) => {
                    const isLiked = await Like.hasUserLiked(userId, product._id);
                    return {
                        ...product.toObject(),
                        isLiked
                    };
                })
            );
            products = productsWithLikeStatus;
        } else {
            // For non-authenticated users, add isLiked: false
            products = products.map(product => ({
                ...product.toObject(),
                isLiked: false
            }));
        }

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
        
        console.log('Fetching product with ID:', id);
        console.log('User ID:', userId || 'Not authenticated');
        
        // Validate MongoDB ObjectId format
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('Invalid product ID format:', id);
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }
        
        const product = await Product.findById(id);

        if (!product) {
            console.log('Product not found in database:', id);
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (!product.isActive) {
            console.log('Product is inactive:', id);
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Get product data with virtuals
        const productData = product.toObject({ virtuals: true });
        
        // Add user-specific data if authenticated
        if (userId) {
            try {
                const [isLiked, isInWishlist, likeCount] = await Promise.all([
                    Like.hasUserLiked(userId, id),
                    Wishlist.isInWishlist(userId, id),
                    Like.getLikeCount(id)
                ]);
                
                productData.isLiked = isLiked;
                productData.isInWishlist = isInWishlist;
                productData.likeCount = likeCount;
            } catch (likeError) {
                console.error('Error fetching like/wishlist data:', likeError);
                // Continue without like data rather than failing
                productData.isLiked = false;
                productData.isInWishlist = false;
                productData.likeCount = 0;
            }
        } else {
            // For non-authenticated users, just get like count
            try {
                productData.likeCount = await Like.getLikeCount(id);
            } catch (likeError) {
                console.error('Error fetching like count:', likeError);
                productData.likeCount = 0;
            }
        }

        console.log('Successfully fetched product:', product.name);
        res.status(200).json({
            success: true,
            data: productData
        });
    } catch (error) {
        console.error('Error in getProductById:', error);
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
        const { page = 1, limit = 1000, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

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
        const { q, page = 1, limit = 1000, category, minPrice, maxPrice, inStock, sortBy = 'relevance' } = req.query;
        const userId = req.user?._id;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        console.log('Search query:', q);
        console.log('Search filters:', { category, minPrice, maxPrice, inStock, sortBy });

        // Create search terms array for better matching
        const searchTerms = q.toLowerCase().split(' ').filter(term => term.length > 0);
        
        // Create more flexible search patterns
        const searchPatterns = searchTerms.map(term => new RegExp(term, 'i'));
        const combinedPattern = new RegExp(searchTerms.join('|'), 'i');

        let filter = {
            isActive: true,
            $or: [
                { name: combinedPattern },
                { productCode: { $regex: q, $options: 'i' } },
                { description: combinedPattern },
                { brand: combinedPattern },
                { category: combinedPattern },
                { subcategory: combinedPattern },
                { tags: { $in: searchPatterns } },
                { features: { $in: searchPatterns } },
                { material: combinedPattern },
                { color: { $in: searchPatterns } }
            ]
        };

        console.log('Search filter:', JSON.stringify(filter, null, 2));

        // Add additional filters
        if (category) filter.category = category;
        if (inStock !== undefined) filter.inStock = inStock === 'true';
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Build sort object
        let sort = {};
        switch (sortBy) {
            case 'price_low':
                sort = { price: 1 };
                break;
            case 'price_high':
                sort = { price: -1 };
                break;
            case 'rating':
                sort = { rating: -1, reviewCount: -1 };
                break;
            case 'newest':
                sort = { createdAt: -1 };
                break;
            case 'name':
                sort = { name: 1 };
                break;
            default: // relevance
                sort = { rating: -1, reviewCount: -1, createdAt: -1 };
        }

        const skip = (Number(page) - 1) * Number(limit);
        let products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .select('-reviews');

        console.log('Found products count:', products.length);
        
        // If no products found with complex search, try simpler search
        if (products.length === 0) {
            console.log('No products found with complex search, trying simpler search...');
            const simpleFilter = {
                isActive: true,
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { productCode: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { brand: { $regex: q, $options: 'i' } }
                ]
            };
            
            // Add additional filters to simple search too
            if (category) simpleFilter.category = category;
            if (inStock !== undefined) simpleFilter.inStock = inStock === 'true';
            if (minPrice || maxPrice) {
                simpleFilter.price = {};
                if (minPrice) simpleFilter.price.$gte = Number(minPrice);
                if (maxPrice) simpleFilter.price.$lte = Number(maxPrice);
            }
            
            products = await Product.find(simpleFilter)
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .select('-reviews');
                
            console.log('Simple search found products count:', products.length);
        }

        // Add isLiked status for authenticated users
        if (userId) {
            const productsWithLikeStatus = await Promise.all(
                products.map(async (product) => {
                    const isLiked = await Like.hasUserLiked(userId, product._id);
                    return {
                        ...product.toObject(),
                        isLiked
                    };
                })
            );
            products = productsWithLikeStatus;
        } else {
            // For non-authenticated users, add isLiked: false
            products = products.map(product => ({
                ...product.toObject(),
                isLiked: false
            }));
        }

        const total = await Product.countDocuments(filter);

        console.log('Returning search results:', {
            query: q,
            totalFound: total,
            productsReturned: products.length
        });

        res.status(200).json({
            success: true,
            data: products,
            query: q,
            searchTerms,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalProducts: total
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: "Error searching products",
            error: error.message
        });
    }
};

// Get search suggestions for autocomplete
const getSearchSuggestions = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.status(200).json({
                success: true,
                data: {
                    suggestions: [],
                    categories: [],
                    brands: [],
                    products: []
                }
            });
        }

        const searchRegex = new RegExp(q, 'i');
        const limitNum = Math.min(Number(limit), 20);

        // Get product name suggestions
        const productSuggestions = await Product.find({
            isActive: true,
            name: searchRegex
        })
        .select('name')
        .limit(limitNum)
        .lean();

        // Get category suggestions
        const categorySuggestions = await Product.distinct('category', {
            isActive: true,
            category: searchRegex
        });

        // Get brand suggestions
        const brandSuggestions = await Product.distinct('brand', {
            isActive: true,
            brand: searchRegex
        });

        // Get tag suggestions
        const tagSuggestions = await Product.distinct('tags', {
            isActive: true,
            tags: searchRegex
        });

        // Get feature suggestions
        const featureSuggestions = await Product.aggregate([
            { $match: { isActive: true, features: searchRegex } },
            { $unwind: '$features' },
            { $match: { features: searchRegex } },
            { $group: { _id: '$features', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, suggestion: '$_id' } }
        ]);

        // Get material suggestions
        const materialSuggestions = await Product.distinct('material', {
            isActive: true,
            material: searchRegex
        });

        // Combine and format suggestions
        const suggestions = [
            ...productSuggestions.map(p => ({ text: p.name, type: 'product' })),
            ...categorySuggestions.map(c => ({ text: c, type: 'category' })),
            ...brandSuggestions.map(b => ({ text: b, type: 'brand' })),
            ...tagSuggestions.map(t => ({ text: t, type: 'tag' })),
            ...featureSuggestions.map(f => ({ text: f.suggestion, type: 'feature' })),
            ...materialSuggestions.map(m => ({ text: m, type: 'material' }))
        ]
        .filter(s => s.text && s.text.toLowerCase().includes(q.toLowerCase()))
        .slice(0, limitNum);

        // Remove duplicates
        const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
            index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
        );

        res.status(200).json({
            success: true,
            data: {
                query: q,
                suggestions: uniqueSuggestions,
                categories: categorySuggestions.slice(0, 5),
                brands: brandSuggestions.slice(0, 5),
                products: productSuggestions.slice(0, 5).map(p => p.name)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching search suggestions",
            error: error.message
        });
    }
};

// Create new product
const createProduct = async (req, res) => {
    try {
        console.log("Create product request body:", req.body);
        console.log("Create product files:", req.files);

        const {
            name,
            productCode,
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
            color,
            disclaimer,
            isCustomizable,
            sizeVariants,
            allowCustomSize,
            customSizeConfig,
            deliveryInfo,
            returnPolicy,
            secureTransaction
        } = req.body;

        // Validate required fields
        if (!name || !productCode || !description || !price || !category || !subcategory) {
            return res.status(400).json({
                success: false,
                message: "Name, product code, description, price, category, and subcategory are required"
            });
        }

        // Handle image uploads (priority: images first)
        const images = [];
        if (req.files && req.files.images && req.files.images.length > 0) {
            for (const file of req.files.images) {
                try {
                    const uploadResult = await uploadonCloudinary(file.buffer, file.originalname);
                    images.push({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id,
                        alt: `${name} image`
                    });
                } catch (uploadError) {
                    console.error("Error uploading image:", uploadError);
                    return res.status(500).json({
                        success: false,
                        message: "Error uploading images to cloud storage"
                    });
                }
            }
        }

        // Handle video uploads (after images)
        const videos = [];
        if (req.files && req.files.videos && req.files.videos.length > 0) {
            for (const file of req.files.videos) {
                try {
                    const uploadResult = await uploadVideoOnCloudinary(file.buffer, file.originalname);
                    videos.push({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id,
                        thumbnail: uploadResult.thumbnail_url || '',
                        duration: uploadResult.duration || 0,
                        format: uploadResult.format || 'mp4',
                        alt: `${name} video`
                    });
                } catch (uploadError) {
                    console.error("Error uploading video:", uploadError);
                    return res.status(500).json({
                        success: false,
                        message: "Error uploading videos to cloud storage"
                    });
                }
            }
        }

        const productData = {
            name,
            productCode: productCode.toUpperCase().trim(),
            description,
            price: Number(price),
            category,
            subcategory,
            images,
            videos,
            inStock: inStock !== undefined ? inStock === 'true' : true,
            createdBy: req.user?._id
        };

        // Add optional fields if provided with safe JSON parsing
        if (originalPrice) productData.originalPrice = Number(originalPrice);
        if (brand) productData.brand = brand;
        
        // Handle arrays - check if it's already parsed JSON or needs parsing
        if (features) {
            try {
                productData.features = typeof features === 'string' ? JSON.parse(features) : features;
            } catch (e) {
                productData.features = Array.isArray(features) ? features : features.split(',').map(f => f.trim());
            }
        }
        
        if (stockQuantity) productData.stockQuantity = Number(stockQuantity);
        if (isNew !== undefined) productData.isNew = isNew === 'true';
        if (isBestSeller !== undefined) productData.isBestSeller = isBestSeller === 'true';
        
        if (tags) {
            try {
                productData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                productData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
            }
        }
        
        if (dimensions) {
            try {
                productData.dimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
            } catch (e) {
                console.error("Error parsing dimensions:", e);
            }
        }
        
        if (weight) {
            try {
                productData.weight = typeof weight === 'string' ? JSON.parse(weight) : weight;
            } catch (e) {
                console.error("Error parsing weight:", e);
            }
        }
        
        if (material) productData.material = material;
        
        if (color) {
            try {
                productData.color = typeof color === 'string' ? JSON.parse(color) : color;
            } catch (e) {
                productData.color = Array.isArray(color) ? color : color.split(',').map(c => c.trim());
            }
        }

        // Handle customizable product fields
        if (disclaimer) productData.disclaimer = disclaimer;
        if (isCustomizable !== undefined) productData.isCustomizable = isCustomizable === 'true';
        
        if (sizeVariants) {
            try {
                productData.sizeVariants = typeof sizeVariants === 'string' ? JSON.parse(sizeVariants) : sizeVariants;
            } catch (e) {
                console.error("Error parsing sizeVariants:", e);
            }
        }
        
        if (allowCustomSize !== undefined) productData.allowCustomSize = allowCustomSize === 'true';
        
        if (customSizeConfig) {
            try {
                productData.customSizeConfig = typeof customSizeConfig === 'string' ? JSON.parse(customSizeConfig) : customSizeConfig;
            } catch (e) {
                console.error("Error parsing customSizeConfig:", e);
            }
        }

        // Handle delivery and policy fields
        if (deliveryInfo) {
            try {
                productData.deliveryInfo = typeof deliveryInfo === 'string' ? JSON.parse(deliveryInfo) : deliveryInfo;
            } catch (e) {
                console.error("Error parsing deliveryInfo:", e);
            }
        }
        
        if (returnPolicy) {
            try {
                productData.returnPolicy = typeof returnPolicy === 'string' ? JSON.parse(returnPolicy) : returnPolicy;
            } catch (e) {
                console.error("Error parsing returnPolicy:", e);
            }
        }
        
        if (secureTransaction !== undefined) {
            productData.secureTransaction = secureTransaction === 'true' || secureTransaction === true;
        }

        console.log("Final product data:", productData);

        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        console.error("Create product error:", error);
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

        console.log("Update product request body:", req.body);
        console.log("Update product files:", req.files);

        // Get existing product first
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Handle image deletion
        let currentImages = [...(existingProduct.images || [])];
        if (updateData.imagesToDelete) {
            try {
                const imagesToDelete = typeof updateData.imagesToDelete === 'string' 
                    ? JSON.parse(updateData.imagesToDelete) 
                    : updateData.imagesToDelete;
                
                if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
                    // Delete from Cloudinary
                    for (const publicId of imagesToDelete) {
                        try {
                            await deleteFromCloudinary(publicId, 'image');
                            console.log(`Deleted image from Cloudinary: ${publicId}`);
                        } catch (error) {
                            console.error(`Error deleting image ${publicId}:`, error);
                        }
                    }
                    // Remove from current images array
                    currentImages = currentImages.filter(img => !imagesToDelete.includes(img.publicId));
                }
            } catch (error) {
                console.error("Error parsing imagesToDelete:", error);
            }
            delete updateData.imagesToDelete;
        }

        // Handle new image uploads
        if (req.files && req.files.images && req.files.images.length > 0) {
            const newImages = [];
            for (const file of req.files.images) {
                try {
                    const uploadResult = await uploadonCloudinary(file.buffer, file.originalname);
                    newImages.push({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id,
                        alt: `${updateData.name || existingProduct.name} image`
                    });
                } catch (uploadError) {
                    console.error("Error uploading image:", uploadError);
                    return res.status(500).json({
                        success: false,
                        message: "Error uploading images to cloud storage"
                    });
                }
            }
            // Append new images to current images
            currentImages = [...currentImages, ...newImages];
        }

        // Set the final images array
        if (currentImages.length > 0) {
            updateData.images = currentImages;
        }

        // Handle video deletion
        let currentVideos = [...(existingProduct.videos || [])];
        if (updateData.videosToDelete) {
            try {
                const videosToDelete = typeof updateData.videosToDelete === 'string' 
                    ? JSON.parse(updateData.videosToDelete) 
                    : updateData.videosToDelete;
                
                if (Array.isArray(videosToDelete) && videosToDelete.length > 0) {
                    // Delete from Cloudinary
                    for (const publicId of videosToDelete) {
                        try {
                            await deleteFromCloudinary(publicId, 'video');
                            console.log(`Deleted video from Cloudinary: ${publicId}`);
                        } catch (error) {
                            console.error(`Error deleting video ${publicId}:`, error);
                        }
                    }
                    // Remove from current videos array
                    currentVideos = currentVideos.filter(vid => !videosToDelete.includes(vid.publicId));
                }
            } catch (error) {
                console.error("Error parsing videosToDelete:", error);
            }
            delete updateData.videosToDelete;
        }

        // Handle new video uploads
        if (req.files && req.files.videos && req.files.videos.length > 0) {
            const newVideos = [];
            for (const file of req.files.videos) {
                try {
                    const uploadResult = await uploadVideoOnCloudinary(file.buffer, file.originalname);
                    newVideos.push({
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id,
                        thumbnail: uploadResult.thumbnail_url || '',
                        duration: uploadResult.duration || 0,
                        format: uploadResult.format || 'mp4',
                        alt: `${updateData.name || existingProduct.name} video`
                    });
                } catch (uploadError) {
                    console.error("Error uploading video:", uploadError);
                    return res.status(500).json({
                        success: false,
                        message: "Error uploading videos to cloud storage"
                    });
                }
            }
            // Append new videos to current videos
            currentVideos = [...currentVideos, ...newVideos];
        }

        // Set the final videos array
        if (currentVideos.length > 0) {
            updateData.videos = currentVideos;
        }

        // Parse arrays and objects from strings if needed
        if (updateData.features && typeof updateData.features === 'string') {
            try {
                updateData.features = JSON.parse(updateData.features);
            } catch (e) {
                updateData.features = updateData.features.split(',').map(f => f.trim());
            }
        }
        if (updateData.tags && typeof updateData.tags === 'string') {
            try {
                updateData.tags = JSON.parse(updateData.tags);
            } catch (e) {
                updateData.tags = updateData.tags.split(',').map(t => t.trim());
            }
        }
        if (updateData.color && typeof updateData.color === 'string') {
            try {
                updateData.color = JSON.parse(updateData.color);
            } catch (e) {
                updateData.color = updateData.color.split(',').map(c => c.trim());
            }
        }
        if (updateData.dimensions && typeof updateData.dimensions === 'string') {
            try {
                updateData.dimensions = JSON.parse(updateData.dimensions);
            } catch (e) {
                console.error("Error parsing dimensions:", e);
            }
        }
        if (updateData.weight && typeof updateData.weight === 'string') {
            try {
                updateData.weight = JSON.parse(updateData.weight);
            } catch (e) {
                console.error("Error parsing weight:", e);
            }
        }

        // Parse customizable product fields
        if (updateData.sizeVariants && typeof updateData.sizeVariants === 'string') {
            try {
                updateData.sizeVariants = JSON.parse(updateData.sizeVariants);
            } catch (e) {
                console.error("Error parsing sizeVariants:", e);
            }
        }
        if (updateData.customSizeConfig && typeof updateData.customSizeConfig === 'string') {
            try {
                updateData.customSizeConfig = JSON.parse(updateData.customSizeConfig);
            } catch (e) {
                console.error("Error parsing customSizeConfig:", e);
            }
        }

        // Convert boolean strings to actual booleans
        if (updateData.inStock !== undefined) {
            updateData.inStock = updateData.inStock === 'true' || updateData.inStock === true;
        }
        if (updateData.isNew !== undefined) {
            updateData.isNew = updateData.isNew === 'true' || updateData.isNew === true;
        }
        if (updateData.isBestSeller !== undefined) {
            updateData.isBestSeller = updateData.isBestSeller === 'true' || updateData.isBestSeller === true;
        }
        if (updateData.isCustomizable !== undefined) {
            updateData.isCustomizable = updateData.isCustomizable === 'true' || updateData.isCustomizable === true;
        }
        if (updateData.allowCustomSize !== undefined) {
            updateData.allowCustomSize = updateData.allowCustomSize === 'true' || updateData.allowCustomSize === true;
        }

        // Parse delivery and policy fields
        if (updateData.deliveryInfo && typeof updateData.deliveryInfo === 'string') {
            try {
                updateData.deliveryInfo = JSON.parse(updateData.deliveryInfo);
            } catch (e) {
                console.error("Error parsing deliveryInfo:", e);
            }
        }
        if (updateData.returnPolicy && typeof updateData.returnPolicy === 'string') {
            try {
                updateData.returnPolicy = JSON.parse(updateData.returnPolicy);
            } catch (e) {
                console.error("Error parsing returnPolicy:", e);
            }
        }
        if (updateData.secureTransaction !== undefined) {
            updateData.secureTransaction = updateData.secureTransaction === 'true' || updateData.secureTransaction === true;
        }

        // Convert numeric strings to numbers
        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price);
        }
        if (updateData.originalPrice !== undefined) {
            updateData.originalPrice = Number(updateData.originalPrice);
        }
        if (updateData.stockQuantity !== undefined) {
            updateData.stockQuantity = Number(updateData.stockQuantity);
        }

        console.log("Final update data:", updateData);

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
        console.error("Update product error:", error);
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
        
        // Debug logging
        console.log('Add Review Request:', {
            productId: id,
            body: req.body,
            user: req.user ? { id: req.user._id, username: req.user.username } : 'No user'
        });
        
        // Validate required fields
        if (!rating || !title || !comment) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: rating, title, and comment are required"
            });
        }
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        
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
        const existingReview = await Review.findOne({ userId, productId: id, isActive: true });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product. You can edit your existing review.",
                data: {
                    existingReview: {
                        _id: existingReview._id,
                        rating: existingReview.rating,
                        title: existingReview.title,
                        comment: existingReview.comment
                    }
                }
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
        console.error('Add Review Error:', error);
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
        
        // Validate required fields
        if (!rating || !title || !comment) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: rating, title, and comment are required"
            });
        }
        
        const userId = req.user._id;

        const review = await Review.findOne({ _id: reviewId, userId, productId: id, isActive: true });
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to update it"
            });
        }

        review.rating = rating;
        review.title = title;
        review.comment = comment;
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
        console.error('Update Review Error:', error);
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
        const userId = req.user?._id;

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

        let products = await Product.find(filter)
            .sort(sort)
            .limit(Number(limit))
            .select('-reviews');

        // Add isLiked status for authenticated users
        if (userId) {
            const productsWithLikeStatus = await Promise.all(
                products.map(async (product) => {
                    const isLiked = await Like.hasUserLiked(userId, product._id);
                    return {
                        ...product.toObject(),
                        isLiked
                    };
                })
            );
            products = productsWithLikeStatus;
        } else {
            // For non-authenticated users, add isLiked: false
            products = products.map(product => ({
                ...product.toObject(),
                isLiked: false
            }));
        }

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

// Get best seller products (dedicated endpoint)
const getBestSellers = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        const userId = req.user?._id;
        
        let products = await Product.find({ isActive: true, isBestSeller: true })
            .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
            .limit(Number(limit))
            .select('-reviews');

        // Add isLiked status for authenticated users
        if (userId) {
            const productsWithLikeStatus = await Promise.all(
                products.map(async (product) => {
                    const isLiked = await Like.hasUserLiked(userId, product._id);
                    return {
                        ...product.toObject(),
                        isLiked
                    };
                })
            );
            products = productsWithLikeStatus;
        } else {
            // For non-authenticated users, add isLiked: false
            products = products.map(product => ({
                ...product.toObject(),
                isLiked: false
            }));
        }

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching best seller products",
            error: error.message
        });
    }
};

// Get new arrival products (dedicated endpoint)
const getNewProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        const userId = req.user?._id;
        
        let products = await Product.find({ isActive: true, isNew: true })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .select('-reviews');

        // Add isLiked status for authenticated users
        if (userId) {
            const productsWithLikeStatus = await Promise.all(
                products.map(async (product) => {
                    const isLiked = await Like.hasUserLiked(userId, product._id);
                    return {
                        ...product.toObject(),
                        isLiked
                    };
                })
            );
            products = productsWithLikeStatus;
        } else {
            // For non-authenticated users, add isLiked: false
            products = products.map(product => ({
                ...product.toObject(),
                isLiked: false
            }));
        }

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching new products",
            error: error.message
        });
    }
};

// Get product categories with counts
const getCategories = async (req, res) => {
  try {
    // Get categories with product counts
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          firstProductImages: { $first: "$images" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          image: { $arrayElemAt: ["$firstProductImages.url", 0] }
        }
      }
    ]);

    // Get structured categories with subcategories
    const structuredCategories = Product.getAllCategoriesWithSubcategories();
    
    // Merge with actual counts
    const categoriesWithCounts = Object.keys(structuredCategories).map(categoryId => {
      const stats = categoryStats.find(stat => stat.category === categoryId);
      return {
        id: categoryId,
        name: structuredCategories[categoryId].name,
        subcategories: structuredCategories[categoryId].subcategories,
        productCount: stats?.count || 0,
        image: stats?.image || null
      };
    });

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message
    });
  }
};

// Get subcategories for a specific category with product counts
const getSubcategories = async (req, res) => {
  try {
    const { category } = req.params;
    
    // Validate category
    const validSubcategories = Product.getValidSubcategories(category);
    if (validSubcategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    // Get subcategory counts
    const subcategoryStats = await Product.aggregate([
      { 
        $match: { 
          isActive: true, 
          category: category 
        } 
      },
      {
        $group: {
          _id: "$subcategory",
          count: { $sum: 1 },
          firstProductImages: { $first: "$images" }
        }
      },
      {
        $project: {
          _id: 0,
          subcategory: "$_id",
          count: 1,
          image: { $arrayElemAt: ["$firstProductImages.url", 0] }
        }
      }
    ]);

    // Get structured subcategories
    const allCategories = Product.getAllCategoriesWithSubcategories();
    const categoryData = allCategories[category];
    
    if (!categoryData) {
      return res.status(400).json({
        success: false,
        message: "Category not found"
      });
    }

    // Merge with actual counts
    const subcategoriesWithCounts = categoryData.subcategories.map(subcategory => {
      const stats = subcategoryStats.find(stat => stat.subcategory === subcategory.id);
      return {
        id: subcategory.id,
        name: subcategory.name,
        productCount: stats?.count || 0,
        image: stats?.image || null
      };
    });

    res.status(200).json({
      success: true,
      message: "Subcategories retrieved successfully",
      data: {
        category: {
          id: category,
          name: categoryData.name
        },
        subcategories: subcategoriesWithCounts
      }
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
      error: error.message
    });
  }
};

//admin controller
const getProductCount=async(req,res)=>{
    try {
        const count=await Product.countDocuments();
        return res.status(201).json({messege:"successfull",count})
    } catch (error) {
        res.status(501).json({messege:"server error  while fetching  produc count"})
    }
}
const getProductsWithSales = async (req, res) => {
  try {
   
    const products = await Product.find().lean();


    const salesData = await Order.aggregate([
      { $unwind: "$products" }, 
      {
        $group: {
          _id: "$products.productId",
          totalSales: { $sum: "$products.quantity" },
        },
      },
    ]);

   
    const salesMap = {};
    salesData.forEach((s) => {
      salesMap[s._id.toString()] = s.totalSales;
    });

  
    const formatted = products.map((p, idx) => ({
      id: `PRD-${String(idx + 1).padStart(3, "0")}`, 
      name: p.name,
      category: p.category || "Unknown",
      price: p.price,
      stock: p.stockQuantity,
      status: p.inStock ? "active" : "out_of_stock",
      image: p.images?.[0] || "/api/placeholder/60/60",
      sales: salesMap[p._id.toString()] || 0, 
    }));

    res.status(200).json({
      success: true,
      products: formatted,
    });
  } catch (error) {
    console.error("Error fetching products with sales:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products with sales",
    });
  }
};


export {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getSearchSuggestions,
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
    getCategories,
    getBestSellers,
    getNewProducts,
    getProductCount,
    getProductsWithSales,
    getSubcategories
};