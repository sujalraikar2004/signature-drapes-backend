import twilio from "twilio";

const client = twilio(
 "ACaaa9f924d5e849d720e95c26b36c001e",
"b623781a1c57074acc804084f9378492"
);


export const sendOtp = async (phoneNumber, otp) => {
  try {
    const message = await client.messages.create({
      body:`Your verification code is ${otp}`,
      from:"+13014507259", 
      to:phoneNumber,
    });

    console.log("OTP sent successfully");
    return message;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};
