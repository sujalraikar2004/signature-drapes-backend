import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { toggleLike } from "../controller/product.controller.js";

const router = Router();

// Like routes
router.route("/:id/like").post(verifyJWT, toggleLike);

export default router;
