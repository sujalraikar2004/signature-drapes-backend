import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        products: [{ productId, quantity, priceAtAddition: product.price }],
        totalPrice: product.price * quantity,
      });
    } else {
      const itemIndex = cart.products.findIndex(p => p.productId.equals(productId));
      if (itemIndex > -1) {
        cart.products[itemIndex].quantity += quantity;
      } else {
        cart.products.push({ productId, quantity, priceAtAddition: product.price });
      }
      cart.totalPrice = cart.products.reduce(
        (sum, p) => sum + p.quantity * p.priceAtAddition,
        0
      );
    }

    await cart.save();
    res.status(201).json({status:true, messege:"Item added to cart"});
  } catch (err) {
    res.status(500).json({messege:"server error :", error: err.message });
  }
};


 const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Correct ObjectId conversion
    cart.products = cart.products.filter(
      p => !p.productId.equals(new mongoose.Types.ObjectId(productId))
    );

    cart.totalPrice = cart.products.reduce(
      (sum, p) => sum + p.quantity * p.priceAtAddition,
      0
    );

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.log("Error filtering cart:", err);
    res.status(500).json({ error: err.message });
  }
};


 const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    console.log(productId)

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.products.find(p => p.productId.equals(productId));
    if (!item) return res.status(404).json({ message: "Product not in cart" });

    item.quantity = quantity;
    cart.totalPrice = cart.products.reduce(
      (sum, p) => sum + p.quantity * p.priceAtAddition,
      0
    );

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getCartTotal = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.json({ total: cart.totalPrice, items: cart.products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = [];
    cart.totalPrice = 0;

    await cart.save();
    res.json({ message: "Cart cleared successfully", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export{
     addToCart,removeFromCart,updateQuantity,getCartTotal,clearCart
}
