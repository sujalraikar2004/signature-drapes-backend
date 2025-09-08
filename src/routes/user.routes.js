import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { changeCurrentPassword, loginUser, logoutUser, refreshAccessToken, registerUser,getCurrentUser } from "../controller/user.controller";


const router = Router()

router.route("/register").post(  registerUser  )

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)


export default router;