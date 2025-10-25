
import Razorpay from "razorpay";

export const razorpayInstance = new Razorpay({
  key_id:"rzp_live_RSAUgfW0h8iYpL",   
  key_secret:process.env.RAZORPAY_KEY_SECRET,
});
