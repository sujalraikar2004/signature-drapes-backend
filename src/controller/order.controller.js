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
    const userId = req.user._id; // set by auth middleware

    const orders = await Order.aggregate([
      { $match: { userId: userId } }, // only this user's orders
      { $sort: { createdAt: -1 } },   // latest first
      {
        $lookup: {
          from: "products", // collection name in MongoDB (plural, lowercase)
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "p",
              in: {
                $mergeObjects: [
                  "$$p",
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$productDetails",
                          as: "pd",
                          cond: { $eq: ["$$pd._id", "$$p.productId"] }
                        }
                      },
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      { $project: { productDetails: 0 } } // remove temporary field
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
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
//Admin controller
const getTotalOrdercount= async(_,res)=>{
   try {
    const  count= await Order.countDocuments();

    return res.status(201).json({messege:"order fetched successfully",totalCount:count});
   } catch (error) {
    
     res.status(500).json({messege:"server error to fetch order count"});
   }
}

const getTotalRevenue = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: null,             
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json({ success: true, totalRevenue: result[0]?.totalRevenue || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching revenue", error: error.message });
  }
};

 const getMonthlySales = async (req, res) => {
  try {
  
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
 
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const salesData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "PAID",             
          createdAt: { $gte: startOfYear, $lte: endOfYear } 
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      {
        $project: {
          month: {
            $arrayElemAt: [
              [
                "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
              ],
              "$_id"
            ]
          },
          sales: 1,
          orders: 1,
          _id: 0
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, year, salesData });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching monthly sales",
      error: error.message
    });
  }
};


const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "username email") 
      .sort({ createdAt: -1 });
      console.log(orders)

    const formatted = orders.map(o => ({
      id: o.orderId,
      customer: o.userId?.username || "Unknown",
      email: o.userId?.email || "N/A",
      items: o.products.length,
      amount: o.totalAmount,
      status: o.orderStatus.toLowerCase(),
      paymentStatus: o.paymentStatus.toLowerCase(),
      date: o.createdAt.toISOString().split("T")[0],
      shippingAddress: o.shippingAddress,
    }));

    res.json({ success: true, total: formatted.length, orders: formatted });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};
const getOrderStatusCount = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["PLACED", "CONFIRMED", "CANCELLED","SHIPPED","COMPLETED"] } 
        }
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

  
    const response = {
      placed:0,
      confirmed:0,
      shipped: 0,
      completed: 0,
      cancelled: 0
    };

    result.forEach(r => {
      if (r._id === "SHIPPED") response.shipped = r.count;
      if (r._id === "PLACED") response.placed = r.count;
      if (r._id === "CONFIRMED") response. confirmed = r.count;
      if (r._id === "COMPLETED") response.completed = r.count;
      if (r._id === "CANCELLED") response.cancelled = r.count;
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order status count", error });
  }
};


export { placeOrder, verifyPayment, getUserOrders, getOrderById,getTotalOrdercount,getTotalRevenue,getMonthlySales,getAllOrders,getOrderStatusCount  };
