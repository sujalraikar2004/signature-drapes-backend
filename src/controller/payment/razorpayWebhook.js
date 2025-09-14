// controllers/payments/razorpayWebhook.js
import crypto from "crypto";
import { Order } from "../../models/order.model.js";

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    // req.body here is a raw buffer if you used express.raw for this route
    const body = req.body.toString();

    const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
    if (expected !== signature) {
      console.warn("Invalid webhook signature");
      return res.status(400).send("invalid signature");
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured" || event.event === "payment.authorized") {
      const rPayment = event.payload.payment.entity;
      const rOrderId = rPayment.order_id;

      await Order.findOneAndUpdate(
        { razorpayOrderId: rOrderId, paymentStatus: { $ne: "PAID" } },
        {
          $set: {
            paymentStatus: "PAID",
            orderStatus: "CONFIRMED",
            razorpayPaymentId: rPayment.id,
            paymentMethod: rPayment.method,
            paymentDetails: {
              bank: rPayment.bank,
              vpa: rPayment.vpa,
              card_last4: rPayment.card?.last4,
            },
          },
        }
      );
    } else if (event.event === "payment.failed") {
      const rPayment = event.payload.payment.entity;
      await Order.findOneAndUpdate(
        { razorpayOrderId: rPayment.order_id },
        { $set: { paymentStatus: "FAILED", orderStatus: "PLACED" } }
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("razorpayWebhook:", err);
    res.status(500).send("error");
  }
};
