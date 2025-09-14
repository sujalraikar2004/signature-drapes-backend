
import { Router } from "express";
import { placeOrder,getUserOrders,getOrderById } from "../controller/order.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router =Router();

router.post("/place", verifyJWT, placeOrder);
router.get("/my-orders", verifyJWT, getUserOrders);
router.get("/:id", verifyJWT, getOrderById);

export default router;
