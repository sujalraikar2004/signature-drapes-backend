import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Counter } from "../models/counter.model.js";
import { razorpayInstance } from "../utils/razorpay.js";
import crypto from "crypto";

const getNextOrderId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "order" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return "ORD-" + counter.seq;
};


const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMode } = req.body;
    console.log( userId,req.body)

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderId = await getNextOrderId();

    const order = new Order({
      userId,
      orderId,
      products: cart.products.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        priceAtPurchase: p.priceAtAddition,
      })),
      shippingAddress,
      paymentMode,
      totalAmount: cart.totalPrice,
      paymentStatus: "PENDING", 
      orderStatus: "PLACED",
    });

    await order.save();

   
    if (paymentMode === "ONLINE") {
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: order.totalAmount * 100, 
        currency: "INR",
        receipt: orderId,
      });
      console.log( order,
        razorpayOrder,
        )

      return res.status(201).json({
        success: true,
        message: "Razorpay order created",
        order,
        razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }


    await Cart.findOneAndUpdate(
      { userId },
      { $set: { products: [], totalPrice: 0 } }
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully (COD)",
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, receipt } =
      req.body;
      console.log(razorpay_order_id, razorpay_payment_id, razorpay_signature, receipt )

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const order = await Order.findOne({ orderId: receipt });
      if (!order) return res.status(404).json({ message: "Order not found" });

      order.paymentStatus = "PAID";
      order.orderStatus = "CONFIRMED";
      await order.save();


      await Cart.findOneAndUpdate(
        { userId: order.userId },
        { $set: { products: [], totalPrice: 0 } }
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified & order confirmed",
        order,
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(500).json({ messege:" this is payment varification error", error: err.message });
  }
};


const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: id }, { orderId: id }],
      userId,
    }).populate("products.productId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { placeOrder, verifyPayment, getUserOrders, getOrderById };
