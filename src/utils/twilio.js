import twilio from "twilio";

const client = twilio(
 "ACaaa9f924d5e849d720e95c26b36c001e",
"832a6e134dc5c27105d7362bf321754b"
);


export const sendOtp = async (phoneNumber, otp) => {
  try {
    const message = await client.messages.create({
      body:`Your verification code is ${otp}`,
      from:"+13014507259", 
      to:`+91${phoneNumber}`,
    });

    console.log("OTP sent successfully");
    return message;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};
