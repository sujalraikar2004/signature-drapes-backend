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
    verifyEmailOtp,
    resendEmailOtp,
    sendLoginOtp,
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
router.route("/verify-phone-otp").post(verifyOtp)
router.route("/resend-phone-otp").post(resendOtp)
router.route("/verify-email-otp").post(verifyEmailOtp)
router.route("/resend-email-otp").post(resendEmailOtp)

// Email verification routes (old token-based, keep for compatibility)
router.route("/verify-email/:token").get(verifyEmail)
router.route("/resend-verification-email").post(resendVerificationEmail)

// Password reset routes
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password/:token").post(resetPassword)

// Login with OTP
router.route("/send-login-otp").post(sendLoginOtp)
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