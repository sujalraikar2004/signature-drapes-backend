import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addToCart,removeFromCart,updateQuantity,getCartTotal,clearCart } from "../controller/cart.controller.js";


const router = Router();

router.post("/add", verifyJWT, addToCart);
router.delete("/remove/:id", verifyJWT, removeFromCart);
router.put("/update", verifyJWT, updateQuantity);
router.get("/total", verifyJWT, getCartTotal);
router.delete("/clear", verifyJWT, clearCart);

export default router;