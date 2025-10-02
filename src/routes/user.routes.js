import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { 
    changeCurrentPassword, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser,
    getCurrentUser,
    verifyOtp,
    resendOtp,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    clearWishlist,
    getUsersWithStats
} from "../controller/user.controller.js";


const router = Router()

router.route("/register").post(registerUser)
router.route("/verify").post(verifyOtp)
router.route("/resend-otp").post(resendOtp)


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