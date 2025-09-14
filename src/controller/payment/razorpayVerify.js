// controllers/payments/razorpayVerify.js
import crypto from "crypto";
import mongoose from "mongoose";
import { Order } from "../../models/order.model.js";
import { Product } from "../../models/product.model.js"; // optional: update if you have product model

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // recompute signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // find order by razorpayOrderId
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // idempotency
    if (order.paymentStatus === "PAID") {
      return res.json({ success: true, message: "Already processed", order });
    }

    // OPTIONAL: run critical operations inside a transaction (decrement stock + mark order paid)
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Example: decrement product stock (uncomment if you have Product model & stock)
      // for (const item of order.products) {
      //   const result = await Product.updateOne(
      //     { _id: item.productId, stock: { $gte: item.quantity } },
      //     { $inc: { stock: -item.quantity } },
      //     { session }
      //   );
      //   if (result.matchedCount === 0) {
      //     throw new Error(`Insufficient stock for product ${item.productId}`);
      //   }
      // }

      order.paymentStatus = "PAID";
      order.orderStatus = "CONFIRMED";
      order.razorpayPaymentId = razorpay_payment_id;
      order.paymentMethod = "RAZORPAY";
      await order.save({ session });

      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }

    // enqueue background tasks: send email, create shipment, analytics (recommended)
    return res.json({ success: true, order });
  } catch (err) {
    console.error("verifyRazorpayPayment:", err);
    res.status(500).json({ error: err.message });
  }
};
