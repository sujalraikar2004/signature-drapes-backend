import twilio from "twilio";

const client = twilio(
 process.env.TWILIO_ACCOUNT_SID,
process.env.TWILIO_AUTH_TOKEN
);


export const sendOtp = async (phoneNumber, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER, 
      to: phoneNumber,
    });

    console.log("OTP sent successfully");
    return message;
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    throw new Error("Failed to send OTP");
  }
};
