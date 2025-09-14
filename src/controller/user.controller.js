import { User } from "../models/user.model.js";
import { sendOtp } from "../utils/twilio.js"; 
import otpGenerator from "otp-generator";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import ApiResponse from "../utils/ApiResponse.js";






const otpStore = new Map();

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = async (req, res) => {
  try {
    const { username, email, password, phoneNo } = req.body;
    console.log(req.body);
     if(!username || !email || !password ||  !phoneNo){
        return res.status(400).json({success: false,message:"all fields are required"});
     }

  
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

   
    const newUser = new User({ username, email, password, phoneNo });
    await newUser.save();

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });


    otpStore.set(phoneNo, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  
    await sendOtp(phoneNo, otp);
    console.log(otpStore.get(phoneNo));

    res.status(201).json({ success: true, message: "User registered. OTP sent for verification." });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


 const verifyOtp = async (req, res) => {
  try {
    const { phoneNo, otp } = req.body;
    console.log(req.body);

    const record = otpStore.get(phoneNo);
    console.log(record);
    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    if (record.expiresAt < Date.now()) {
      otpStore.delete(phoneNo);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

  
    const user = await User.findOneAndUpdate({ phoneNo }, { isVerified: true }, { new: true });
    otpStore.delete(phoneNo);
     console.log(user);

    res.status(200).json({ success: true, message: "User verified successfully", user });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

 const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: "User not verified" });
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });


    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();


    res.cookie("accessToken", accessToken, { httpOnly: true, maxAge: 30 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({ success: true, message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const logoutUser = asyncHandler(async(req, res) => {
  console.log(req.user._id)
    await User.findByIdAndUpdate(
        req.user._id,
        
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})
export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    verifyOtp 
}

