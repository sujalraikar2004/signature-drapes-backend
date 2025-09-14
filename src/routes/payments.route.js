import express from "express";
  import { createRazorpayOrder } from "../controller/payment/razorpay.controller.js";
 import { verifyRazorpayPayment } from "../controller/payment/razorpayVerify.js";
// import { refundPayment } from "../controllers/payments/refund.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
// import adminMiddleware from "../middlewares/admin.middleware.js";

const router = express.Router();

router.post("/razorpay/create-order", verifyJWT, createRazorpayOrder);
router.post("/razorpay/verify", verifyJWT, verifyRazorpayPayment);
// router.post("/refund", authMiddleware, adminMiddleware, refundPayment);

// webhook route is registered directly in app.js (requires raw body)

export default router;
