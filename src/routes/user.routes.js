import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { 
    changeCurrentPassword, 
    forgotPassword,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser,
    resetPassword,
    getCurrentUser,
    verifyOtp,
    resendOtp,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    clearWishlist,
    getUsersWithStats,
    verifyEmail,
    resendVerificationEmail
} from "../controller/user.controller.js";


const router = Router()

router.route("/register").post(registerUser)
router.route("/verify").post(verifyOtp)
router.route("/resend-otp").post(resendOtp)

// Email verification routes
router.route("/verify-email/:token").get(verifyEmail)
router.route("/resend-verification-email").post(resendVerificationEmail)

// Password reset routes
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password/:token").post(resetPassword)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

// Wishlist routes
router.route("/wishlist").get(verifyJWT, getWishlist)
router.route("/wishlist").delete(verifyJWT, clearWishlist)
router.route("/wishlist/:productId").post(verifyJWT, addToWishlist)
router.route("/wishlist/:productId").delete(verifyJWT, removeFromWishlist)

//Admin Route
router.route("/getuserstats").get(getUsersWithStats);

export default router;