import { Router } from "express";
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
    getSubcategories,
    getBestSellers,
    getNewProducts,
    getProductCount,
    getProductsWithSales
} from "../controller/product.controller.js";
import { verifyJWT, verifyAdmin, optionalVerifyJWT } from "../middleware/auth.middleware.js";
import { upload, uploadMedia } from "../middleware/multer.middleware.js";

const router = Router();

// Middleware to verify JWT token and admin permissions
// Removed local placeholder for verifyAdmin middleware

//Admin Route
router.get("/count", getProductCount);
router.route("/admin/getOrdersSales").get(getProductsWithSales);
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

// GET /api/products/categories/:category/subcategories - Get subcategories for a specific category
router.get("/categories/:category/subcategories", getSubcategories);

// GET /api/products/category/:category - Get products by category
router.get("/category/:category", getProductsByCategory);

// Protected routes (authentication required) - Must come before /:id route

// GET /api/products/:id/reviews - Get all reviews for a product
router.get("/:id/reviews", getProductReviews);

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

// GET /api/products/:id - Get single product by ID (MUST BE LAST to avoid conflicts)
// Use optional JWT to get user-specific data if logged in, but allow access for all users
router.get("/:id", optionalVerifyJWT, getProductById);


// Admin routes (admin authentication required)

// POST /api/products - Create new product (supports both images and videos)
router.post("/", verifyJWT, verifyAdmin, uploadMedia.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 5 }]), createProduct);

// PUT /api/products/:id - Update product (supports both images and videos)
router.put("/:id", verifyJWT, verifyAdmin, uploadMedia.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 5 }]), updateProduct);

// DELETE /api/products/:id - Delete product (soft delete)
router.delete("/:id", verifyJWT, verifyAdmin, deleteProduct);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof Error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: "File size too large. Maximum size is 5MB for images and 50MB for videos."
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: "Too many files. Maximum 10 images and 5 videos allowed."
            });
        }
        if (error.message.includes('Only image') || error.message.includes('Only video')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
});

export default router;