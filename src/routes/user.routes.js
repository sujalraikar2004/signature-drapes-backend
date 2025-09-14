import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { changeCurrentPassword, loginUser, logoutUser, refreshAccessToken, registerUser,getCurrentUser,verifyOtp  } from "../controller/user.controller.js";


const router = Router()

router.route("/register").post(registerUser)
router.route("/verify").post(verifyOtp)


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)


export default router;