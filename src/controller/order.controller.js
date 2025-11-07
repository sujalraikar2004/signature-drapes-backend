import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Counter } from "../models/counter.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { razorpayInstance } from "../utils/razorpay.js";
import mongoose from "mongoose";
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
    console.log('Place order request:', { userId, shippingAddress, paymentMode });

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "Shipping address is required" });
    }

    const cart = await Cart.findOne({ userId }).populate('products.productId');
    console.log('Cart found:', cart ? `${cart.products.length} items` : 'null');
    
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Filter out null products (deleted from database)
    cart.products = cart.products.filter(item => item.productId !== null);
    
    if (cart.products.length === 0) {
      return res.status(400).json({ success: false, message: "Cart has no valid products" });
    }

    const orderId = await getNextOrderId();

    // Check if any products have custom sizes
    const hasCustomItems = cart.products.some(p => 
      p.customSize?.isCustom || p.selectedSizeVariant
    );

    const order = new Order({
      userId,
      orderId,
      products: cart.products.map((p) => ({
        productId: p.productId._id,
        productCode: p.productId.productCode,
        productName: p.productId.name,
        productImage: p.productId.images && p.productId.images.length > 0 ? p.productId.images[0].url : '',
        quantity: p.quantity,
        priceAtPurchase: p.priceAtAddition,
        selectedSizeVariant: p.selectedSizeVariant || undefined,
        customSize: p.customSize || undefined
      })),
      shippingAddress,
      paymentMode,
      totalAmount: cart.totalPrice,
      paymentStatus: "PENDING", 
      orderStatus: "PLACED",
      hasCustomItems
    });

    await order.save();
    console.log('Order saved successfully:', orderId);

    if (paymentMode === "ONLINE") {
      try {
        const razorpayOrder = await razorpayInstance.orders.create({
          amount: order.totalAmount * 100, 
          currency: "INR",
          receipt: orderId,
        });
        console.log('Razorpay order created:', razorpayOrder.id);

        return res.status(201).json({
          success: true,
          message: "Razorpay order created",
          order,
          razorpayOrder,
          key: process.env.RAZORPAY_KEY_ID,
        });
      } catch (razorpayError) {
        console.error('Razorpay order creation failed:', razorpayError);
        // Delete the order if Razorpay fails
        await Order.findByIdAndDelete(order._id);
        throw new Error(`Razorpay error: ${razorpayError.message}`);
      }
    } else if (paymentMode === "COD") {
      // Clear cart after successful COD order
      await Cart.findOneAndUpdate(
        { userId },
        { products: [], totalPrice: 0 }
      );

      return res.status(201).json({
        success: true,
        message: "Order placed successfully with Cash on Delivery",
        order
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment mode" });
    }
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ success: false, message: "Failed to place order", error: err.message });
  }
};


const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
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
      const order = await Order.findOne({ orderId: receipt }).session(session);
      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if payment already processed (idempotency)
      if (order.paymentStatus === "PAID") {
        await session.abortTransaction();
        session.endSession();
        return res.status(200).json({
          success: true,
          message: "Payment already verified",
          order,
        });
      }

      // Advanced Inventory Management: Decrement stock for each product
      const stockUpdateErrors = [];
      
      for (const item of order.products) {
        const product = await Product.findById(item.productId).session(session);
        
        if (!product) {
          stockUpdateErrors.push(`Product ${item.productName} not found`);
          continue;
        }

        // Handle size variant stock decrement
        if (item.selectedSizeVariant && item.selectedSizeVariant.variantId) {
          const variantIndex = product.sizeVariants.findIndex(
            v => v._id.toString() === item.selectedSizeVariant.variantId
          );
          
          if (variantIndex !== -1) {
            const variant = product.sizeVariants[variantIndex];
            
            // Check if sufficient stock available
            if (variant.stockQuantity < item.quantity) {
              stockUpdateErrors.push(
                `Insufficient stock for ${item.productName} - ${variant.name}. Available: ${variant.stockQuantity}, Required: ${item.quantity}`
              );
              continue;
            }
            
            // Decrement variant stock
            product.sizeVariants[variantIndex].stockQuantity -= item.quantity;
            
            // Update variant inStock status
            if (product.sizeVariants[variantIndex].stockQuantity === 0) {
              product.sizeVariants[variantIndex].inStock = false;
            }
            
            console.log(`Stock decremented for variant: ${item.productName} - ${variant.name}, Quantity: ${item.quantity}, Remaining: ${product.sizeVariants[variantIndex].stockQuantity}`);
          } else {
            stockUpdateErrors.push(`Size variant not found for ${item.productName}`);
            continue;
          }
        } 
        // Handle regular product stock decrement (no size variant or custom size)
        else {
          // Check if sufficient stock available
          if (product.stockQuantity < item.quantity) {
            stockUpdateErrors.push(
              `Insufficient stock for ${item.productName}. Available: ${product.stockQuantity}, Required: ${item.quantity}`
            );
            continue;
          }
          
          // Decrement product stock
          product.stockQuantity -= item.quantity;
          
          // Update product inStock status
          if (product.stockQuantity === 0) {
            product.inStock = false;
          }
          
          console.log(`Stock decremented for product: ${item.productName}, Quantity: ${item.quantity}, Remaining: ${product.stockQuantity}`);
        }
        
        // Save product with updated stock
        await product.save({ session });
      }

      // If there were stock errors, abort transaction
      if (stockUpdateErrors.length > 0) {
        await session.abortTransaction();
        session.endSession();
        console.error('Stock update errors:', stockUpdateErrors);
        return res.status(400).json({
          success: false,
          message: "Stock update failed",
          errors: stockUpdateErrors
        });
      }

      // Update order status
      order.paymentStatus = "PAID";
      order.orderStatus = "CONFIRMED";
      order.transactionId = razorpay_payment_id;
      await order.save({ session });

      // Commit transaction before sending emails
      await session.commitTransaction();
      session.endSession();

      // Send email notification to owner with custom order details (after transaction)
      try {
        const user = await User.findById(order.userId);
        const populatedProducts = await Promise.all(
          order.products.map(async (item) => {
            const productDetails = await Product.findById(item.productId);
            return {
              name: productDetails?.name || 'Unknown Product',
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
            };
          })
        );

        // Extract custom items for email notification
        const customItems = order.products
          .filter(item => item.customSize?.isCustom || item.selectedSizeVariant)
          .map(item => {
            const product = populatedProducts.find(p => p.productId === item.productId);
            return {
              productName: product?.name || 'Unknown Product',
              quantity: item.quantity,
              selectedSizeVariant: item.selectedSizeVariant,
              customSize: item.customSize
            };
          });

        // Note: Uncomment when email service is configured
        // await sendCustomOrderNotification({
        //   orderId: order.orderId,
        //   customer: {
        //     name: user?.username || order.shippingAddress.fullName,
        //     email: user?.email,
        //     phone: user?.phoneNo || order.shippingAddress.phone
        //   },
        //   products: populatedProducts,
        //   shippingAddress: order.shippingAddress,
        //   totalAmount: order.totalAmount,
        //   paymentMode: order.paymentMode,
        //   customItems: customItems.length > 0 ? customItems : null
        // });
        
        console.log('Order confirmed with inventory updated:', order.orderId);
      } catch (emailError) {
        console.error('Failed to send order notification email:', emailError);
        // Don't fail the order if email fails
      }

      // Clear cart after successful payment
      await Cart.findOneAndUpdate(
        { userId: order.userId },
        { $set: { products: [], totalPrice: 0 } }
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified, order confirmed & inventory updated",
        order,
      });
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    // Rollback transaction on error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Payment verification error:', err);
    res.status(500).json({ 
      success: false,
      message: "Payment verification error", 
      error: err.message 
    });
  }
};







 const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id; // set by auth middleware

     const userOrders = await Order.aggregate([
      {
        $match: { userId: new ObjectId(userId) },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$_id",
          orderId: { $first: "$orderId" },
          orderStatus: { $first: "$orderStatus" },
          paymentMode: { $first: "$paymentMode" },
          paymentStatus: { $first: "$paymentStatus" },
          refundedAmount: { $first: "$refundedAmount" },
          totalAmount: { $first: "$totalAmount" },
          createdAt: { $first: "$createdAt" },
          shippingAddress: { $first: "$shippingAddress" },
          products: {
            $push: {
              productId: "$products.productId",
              quantity: "$products.quantity",
              priceAtPurchase: "$products.priceAtPurchase",
              selectedSizeVariant: "$products.selectedSizeVariant",
              customSize: "$products.customSize",
              name: "$productDetails.name",
              images: "$productDetails.images",
              description: "$productDetails.description",
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    // ✅ Optional: format response for frontend
    const formattedOrders = userOrders.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      refundedAmount: order.refundedAmount,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress,
      products: order.products.map((p) => ({
        productId: p.productId,
        name: p.name,
        image: p.images && p.images.length > 0 ? p.images[0].url : null,
        description: p.description,
        quantity: p.quantity,
        priceAtPurchase: p.priceAtPurchase,
        selectedSizeVariant: p.selectedSizeVariant,
        customSize: p.customSize,
      })),
    }));

    return res.status(200).json({
      success: true,
      totalOrders: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }}


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


const getCustomOrders = async (req, res) => {
  try {
    const customOrders = await Order.find({ hasCustomItems: true })
      .populate("userId", "username email phoneNo")
      .populate("products.productId", "name productCode description price originalPrice images category subcategory brand material color tags features dimensions weight inStock stockQuantity isNew isBestSeller rating reviewCount")
      .sort({ createdAt: -1 });

    const formattedOrders = customOrders.map(order => {
      const customProducts = order.products.filter(p => 
        p.customSize?.isCustom || p.selectedSizeVariant
      );

      return {
        orderId: order.orderId,
        orderDate: order.createdAt,
        customer: {
          name: order.userId?.username || order.shippingAddress.fullName,
          email: order.userId?.email || "N/A",
          phone: order.userId?.phoneNo || order.shippingAddress.phone
        },
        shippingAddress: order.shippingAddress,
        paymentMode: order.paymentMode,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        orderStatus: order.orderStatus,
        totalAmount: order.totalAmount,
        customProducts: customProducts.map(p => ({
          productId: p.productId?._id,
          productCode: p.productCode,
          productName: p.productName,
          productDescription: p.productId?.description,
          productImage: p.productImage,
          productImages: p.productId?.images || [],
          category: p.productId?.category,
          subcategory: p.productId?.subcategory,
          brand: p.productId?.brand,
          material: p.productId?.material,
          color: p.productId?.color || [],
          tags: p.productId?.tags || [],
          features: p.productId?.features || [],
          dimensions: p.productId?.dimensions,
          weight: p.productId?.weight,
          currentPrice: p.productId?.price,
          currentOriginalPrice: p.productId?.originalPrice,
          inStock: p.productId?.inStock,
          stockQuantity: p.productId?.stockQuantity,
          isNew: p.productId?.isNew,
          isBestSeller: p.productId?.isBestSeller,
          rating: p.productId?.rating,
          reviewCount: p.productId?.reviewCount,
          quantity: p.quantity,
          priceAtPurchase: p.priceAtPurchase,
          selectedSizeVariant: p.selectedSizeVariant || null,
          customSize: p.customSize || null
        })),
        allProducts: order.products.map(p => ({
          productId: p.productId?._id,
          productCode: p.productCode,
          productName: p.productName,
          productImage: p.productImage,
          quantity: p.quantity,
          priceAtPurchase: p.priceAtPurchase,
          selectedSizeVariant: p.selectedSizeVariant || null,
          customSize: p.customSize || null
        }))
      };
    });

    res.status(200).json({
      success: true,
      total: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching custom orders",
      error: error.message
    });
  }
};

export { placeOrder, verifyPayment, getUserOrders, getOrderById, getTotalOrdercount, getTotalRevenue, getMonthlySales, getAllOrders, getOrderStatusCount, getCustomOrders };
