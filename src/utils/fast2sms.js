import axios from "axios";

export const sendOtp = async (phoneNumber, otp) => {
  try {
    const response = await axios.get("https://www.fast2sms.com/dev/whatsapp", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        message_id: "8692",
        phone_number_id: "1325812851201210",
        numbers: phoneNumber,
        variables_values: otp,
      },
    });

    const data = response.data;

    if (data.return) {
      console.log("OTP sent successfully via Fast2SMS");
      return data;
    } else {
      console.error("Fast2SMS Error:", data.message);
      throw new Error("Failed to send OTP via Fast2SMS");
    }
  } catch (error) {
    console.error("Error sending OTP via Fast2SMS:", error.message);
    if (error.response) {
      console.error("Fast2SMS Response Data:", error.response.data);
    }
    throw new Error("Failed to send OTP");
  }
};