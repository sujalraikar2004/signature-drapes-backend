import { Router } from "express";
import { placeOrder,getUserOrders,getOrderById,verifyPayment,getTotalOrdercount,getTotalRevenue,getMonthlySales,getAllOrders,getOrderStatusCount, getCustomOrders  } from "../controller/order.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router =Router();
//user Routes
router.post("/place", verifyJWT, placeOrder);
router.post("/verify",verifyJWT,verifyPayment);
router.get("/my-orders", verifyJWT, getUserOrders);
router.get("/:id", verifyJWT, getOrderById);
//Admin Routes
router.get("/count/total",getTotalOrdercount);
router.get("/count/revenue",getTotalRevenue);
router.get("/count/sales",getMonthlySales);
router.get("/admin/totalOrders",getAllOrders);
router.route("/admin/orderStatusCount").get(getOrderStatusCount);
router.get("/admin/customOrders", getCustomOrders);

export default router;
