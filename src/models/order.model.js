// models/order.model.js
import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderId: {
      type: String,
      unique: true,
      required: true,
    },

    // Razorpay mapping
    razorpayOrderId: { type: String, index: true },   // razorpay order id (r_Order_xxx)
    razorpayPaymentId: { type: String },              // razorpay payment id (pay_xxx)

    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
        },
        // Custom size fields for customizable products
        selectedSizeVariant: {
          variantId: String,
          name: String,
          dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: String
          },
          price: Number
        },
        customSize: {
          isCustom: {
            type: Boolean,
            default: false
          },
          measurements: {
            length: Number,
            width: Number,
            height: Number,
            area: Number,
            diameter: Number,
            unit: String
          },
          calculatedPrice: Number,
          notes: String
        }
      },
    ],

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },

    paymentMode: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    transactionId: { type: String },

    paymentMethod: { type: String },   // card, upi, netbanking
    paymentDetails: { type: Object },  // minimal, non-sensitive (last4, bank, vpa)

   
    refundId: { type: String },
    refundedAmount: { type: Number, default: 0 },

    orderStatus: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
    },

    totalAmount: {
      type: Number,
      required: true,
    },
    
    // Flag to identify orders with custom measurements
    hasCustomItems: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true } 
);

export const Order = mongoose.model("Order", orderSchema);
