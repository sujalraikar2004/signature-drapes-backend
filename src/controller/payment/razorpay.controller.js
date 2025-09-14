// controllers/payments/razorpay.controller.js
import Razorpay from "razorpay";
import { Order } from "../../models/order.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId required" });

    const order = await Order.findOne({ orderId, userId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Idempotent: if already created, return stored razorpayOrderId
    if (order.razorpayOrderId) {
      return res.json({
        razorpayOrderId: order.razorpayOrderId,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: order.totalAmount,
        currency: "INR",
      });
    }

    const options = {
      amount: Math.round(order.totalAmount * 100), // paise
      currency: "INR",
      receipt: order.orderId,
      payment_capture: 1 // auto-capture
    };

    const rOrder = await razorpay.orders.create(options);
    order.razorpayOrderId = rOrder.id;
    await order.save();

    res.json({
      razorpayOrderId: rOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: order.totalAmount,
      currency: "INR",
    });
  } catch (err) {
    console.error("createRazorpayOrder:", err);
    res.status(500).json({ error: err.message });
  }
};
