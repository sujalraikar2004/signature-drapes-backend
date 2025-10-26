import { User } from "../models/user.model.js";
import { sendOtp } from "../utils/twilio.js"; 
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from "../utils/nodemailer.js";
import otpGenerator from "otp-generator";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse  from '../utils/ApiResponse.js'
import { Product } from "../models/product.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { Wishlist } from "../models/wishlist.model.js";
import { Like } from "../models/like.model.js";

// Remove in-memory OTP store - use database instead
// const otpStore = new Map();

// ------------------ Helper ------------------
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

// ------------------ Register ------------------
const registerUser = async (req, res) => {
  try {
    const { username, email, password, phoneNo } = req.body;
    console.log("Register body:", req.body);

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const newUser = new User({ 
      username, 
      email, 
      password, 
      phoneNo,
      emailVerificationToken,
      emailVerificationExpires,
      otp: String(otp),
      otpExpires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    await newUser.save();

    // Send email verification link
    try {
      await sendVerificationEmail(email, emailVerificationToken);
      console.log("Verification email sent to:", email);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError.message);
      // Don't fail registration if email fails, just log it
    }

    // Send OTP via SMS
    await sendOtp(phoneNo, otp);
    console.log("OTP sent and stored in database for phone:", phoneNo);

    res.status(201).json({ 
      success: true, 
      message: "User registered. OTP sent for phone verification and verification email sent to your email address." 
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const verifyOtp = async (req, res) => {
  try {
    const { phoneNo, otp } = req.body;

    // Find user by phone number
    const user = await User.findOne({ phoneNo });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (!user.otp) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    if (user.otpExpires < Date.now()) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (user.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Set both isVerified and emailVerified to true on OTP verification
    user.isVerified = true;
    user.emailVerified = true;
    user.otp = undefined; // Clear OTP after successful verification
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "User verified successfully", user });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ Resend OTP ------------------
const resendOtp = async (req, res) => {
  try {
    const { phoneNo } = req.body;

    if (!phoneNo) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const user = await User.findOne({ phoneNo });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User is already verified" });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Store OTP in database
    user.otp = String(otp);
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    await sendOtp(phoneNo, otp);
    console.log("OTP resent and stored in database for phone:", phoneNo);

    res.status(200).json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ Login ------------------
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    // Only check isVerified (phone verification via OTP)
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: "Please verify your phone number via OTP to login" });
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    // Cookie options for production (Vercel) and development
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true for HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
    };

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 30 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({ success: true, message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ Logout ------------------
const logoutUser = asyncHandler(async(req, res) => {
  console.log(req.user._id)
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  )

  const options = { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

// ------------------ Refresh Access Token ------------------
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) throw new ApiError(401, "unauthorized request")

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if (!user) throw new ApiError(401, "Invalid refresh token")
    if (incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Refresh token is expired or used")

    const options = { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"))
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

// ------------------ Change Password ------------------
const changeCurrentPassword = asyncHandler(async(req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password")

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

// ------------------ Current User ------------------
const getCurrentUser = asyncHandler(async(req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"))
})

// ------------------ Wishlist APIs ------------------
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const isInWishlist = await Wishlist.isInWishlist(userId, productId);
    if (isInWishlist) {
      return res.status(400).json({ success: false, message: "Product already in wishlist" });
    }

    await Wishlist.addToWishlist(userId, productId);
    await Like.toggleLike(userId, productId);

    const wishlistCount = await Wishlist.getWishlistCount(userId);

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: { wishlistCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding to wishlist", error: error.message });
  }
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  try {
    const isInWishlist = await Wishlist.isInWishlist(userId, productId);
    if (!isInWishlist) {
      return res.status(400).json({ success: false, message: "Product not in wishlist" });
    }

    await Wishlist.removeFromWishlist(userId, productId);
    await Like.toggleLike(userId, productId);

    const wishlistCount = await Wishlist.getWishlistCount(userId);

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: { wishlistCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error removing from wishlist", error: error.message });
  }
});

const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, sortBy = 'addedAt', sortOrder = 'desc' } = req.query;

  try {
    const sortOrderValue = sortOrder === 'desc' ? -1 : 1;
    const wishlist = await Wishlist.getUserWishlist(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrderValue
    });

    const totalCount = await Wishlist.getWishlistCount(userId);

    res.status(200).json({
      success: true,
      data: wishlist.map(item => item.productId),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      },
      count: wishlist.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching wishlist", error: error.message });
  }
});

const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const wishlistItems = await Wishlist.find({ userId, isActive: true });
    for (const item of wishlistItems) {
      const hasLiked = await Like.hasUserLiked(userId, item.productId);
      if (hasLiked) {
        await Like.toggleLike(userId, item.productId);
      }
    }

    await Wishlist.updateMany({ userId, isActive: true }, { isActive: false });

    res.status(200).json({ success: true, message: "Wishlist cleared successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error clearing wishlist", error: error.message });
  }
});

//  only for admin
const getUsersWithStats = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "orders",        
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },
      {
        $addFields: {
          ordersCount: { $size: "$orders" },
          totalSpent: { $sum: "$orders.totalAmount" },
          lastLogin: { $max: "$orders.createdAt" },
        },
      },
      {
        $project: {
          id: { $concat: ["USR-", { $toString: "$_id" }] },
          name: "$username",
          email: 1,
          phone: "$phoneNo",
          role: { $literal: "customer" },
          status: { $cond: [{ $eq: ["$isVerified", true] }, "active", "inactive"] },
          lastLogin: { $dateToString: { format: "%Y-%m-%d", date: "$lastLogin" } },
          orders: "$ordersCount",
          totalSpent: 1,
          avatar: { $literal: "/api/placeholder/40/40" }
        },
      },
    ]);

    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users with stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ Verify Email ------------------
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is required" });
    }

    // Find user with this token and check if it's not expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired verification link" 
      });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is already verified" 
      });
    }

    // Update user to mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.username);
      console.log("Welcome email sent to:", user.email);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError.message);
      // Don't fail verification if welcome email fails
    }

    res.status(200).json({ 
      success: true, 
      message: "Email verified successfully! Your account is now fully activated." 
    });
  } catch (error) {
    console.error("Verify email error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ Resend Verification Email ------------------
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, emailVerificationToken);
      console.log("Verification email resent to:", email);
    } catch (emailError) {
      console.error("Error resending verification email:", emailError.message);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send verification email" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Verification email sent successfully" 
    });
  } catch (error) {
    console.error("Resend verification email error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ Forgot Password ------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        success: true, 
        message: "If an account exists with this email, a password reset link has been sent." 
      });
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, passwordResetToken);
      console.log("Password reset email sent to:", email);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError.message);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send password reset email" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Password reset link has been sent to your email" 
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ Reset Password ------------------
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is required" });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // Find user with this token and check if it's not expired
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired password reset link" 
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Password has been reset successfully. You can now login with your new password." 
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------ Exports ------------------
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  verifyOtp,
  resendOtp,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist,
  getUsersWithStats,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
}
