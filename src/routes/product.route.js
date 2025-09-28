import { Router } from "express";
import multer from "multer";
import {
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
    getNewProducts
} from "../controller/product.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Middleware to verify JWT token (placeholder - implement based on your auth system)
const verifyAdmin = (req, res, next) => {
    // Implement admin verification logic
    // For now, we'll skip this check
    next();
};

// Public routes (no authentication required)

// GET /api/products - Get all products with filtering, sorting, pagination
router.get("/", getAllProducts);

// GET /api/products/search - Search products
router.get("/search", searchProducts);

// GET /api/products/search/suggestions - Get search suggestions
router.get("/search/suggestions", getSearchSuggestions);

// GET /api/products/featured - Get featured products (bestsellers, new arrivals, etc.)
router.get("/featured", getFeaturedProducts);

// GET /api/products/best-sellers - Get best seller products
router.get("/best-sellers", getBestSellers);

// GET /api/products/new - Get new arrival products
router.get("/new", getNewProducts);

// GET /api/products/categories - Get all categories with product counts
router.get("/categories", getCategories);

// GET /api/products/category/:category - Get products by category
router.get("/category/:category", getProductsByCategory);

// GET /api/products/:id - Get single product by ID
router.get("/:id", getProductById);

// GET /api/products/:id/reviews - Get all reviews for a product
router.get("/:id/reviews", getProductReviews);

// Protected routes (authentication required)

// POST /api/products/:id/reviews - Add review to product
router.post("/:id/reviews", verifyJWT, addReview);

// PUT /api/products/:id/reviews/:reviewId - Update a review
router.put("/:id/reviews/:reviewId", verifyJWT, updateReview);

// DELETE /api/products/:id/reviews/:reviewId - Delete a review
router.delete("/:id/reviews/:reviewId", verifyJWT, deleteReview);

// POST /api/products/:id/reviews/:reviewId/helpful - Mark review as helpful
router.post("/:id/reviews/:reviewId/helpful", markReviewHelpful);

// POST /api/products/:id/like - Toggle like/unlike product
router.post("/:id/like", verifyJWT, toggleLike);

// Admin routes (admin authentication required)

// POST /api/products - Create new product
router.post("/", verifyJWT, verifyAdmin, upload.array('images', 10), createProduct);

// PUT /api/products/:id - Update product
router.put("/:id", verifyJWT, verifyAdmin, upload.array('images', 10), updateProduct);

// DELETE /api/products/:id - Delete product (soft delete)
router.delete("/:id", verifyJWT, verifyAdmin, deleteProduct);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: "File size too large. Maximum size is 5MB per file."
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: "Too many files. Maximum 10 files allowed."
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({
            success: false,
            message: "Only image files are allowed!"
        });
    }
    
    next(error);
});

export default router;