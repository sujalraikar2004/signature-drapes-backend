import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { 
    addReview,
    getProductReviews,
    updateReview,
    deleteReview,
    markReviewHelpful
} from "../controller/product.controller.js";

const router = Router();

// Review routes
router.route("/:id/reviews").get(getProductReviews);
router.route("/:id/reviews").post(verifyJWT, addReview);
router.route("/:id/reviews/:reviewId").put(verifyJWT, updateReview);
router.route("/:id/reviews/:reviewId").delete(verifyJWT, deleteReview);
router.route("/:id/reviews/:reviewId/helpful").post(verifyJWT, markReviewHelpful);

export default router;
