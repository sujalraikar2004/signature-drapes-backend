import { User } from "../models/user.model.js";
import { sendOtp } from "../utils/twilio.js"; 
import otpGenerator from "otp-generator";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

import jwt from "jsonwebtoken";
import ApiResponse from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { Like } from "../models/like.model.js";

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

const resendOtp = async (req, res) => {
  try {
    const { phoneNo } = req.body;
    console.log("Resend OTP request for:", phoneNo);

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

    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Store OTP with expiration (5 minutes)
    otpStore.set(phoneNo, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // Send OTP
    await sendOtp(phoneNo, otp);
    console.log("New OTP stored:", otpStore.get(phoneNo));

    res.status(200).json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
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

// Add product to wishlist
const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

       
        const isInWishlist = await Wishlist.isInWishlist(userId, productId);
        if (isInWishlist) {
            return res.status(400).json({
                success: false,
                message: "Product already in wishlist"
            });
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
        res.status(500).json({
            success: false,
            message: "Error adding to wishlist",
            error: error.message
        });
    }
});

// Remove product from wishlist
const removeFromWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        // Check if product is in wishlist
        const isInWishlist = await Wishlist.isInWishlist(userId, productId);
        if (!isInWishlist) {
            return res.status(400).json({
                success: false,
                message: "Product not in wishlist"
            });
        }

        // Remove from wishlist
        await Wishlist.removeFromWishlist(userId, productId);

        // Also remove like (maintaining the sync behavior)
        const likeResult = await Like.toggleLike(userId, productId);
        
        // Get updated wishlist count
        const wishlistCount = await Wishlist.getWishlistCount(userId);

        res.status(200).json({
            success: true,
            message: "Product removed from wishlist",
            data: { wishlistCount }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error removing from wishlist",
            error: error.message
        });
    }
});

// Get user's wishlist
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
        res.status(500).json({
            success: false,
            message: "Error fetching wishlist",
            error: error.message
        });
    }
});

// Clear entire wishlist
const clearWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        // Get all wishlist items first
        const wishlistItems = await Wishlist.find({ userId, isActive: true });
        
        // Remove likes for all wishlist products (maintaining sync behavior)
        for (const item of wishlistItems) {
            const hasLiked = await Like.hasUserLiked(userId, item.productId);
            if (hasLiked) {
                await Like.toggleLike(userId, item.productId);
            }
        }

        // Clear wishlist by updating isActive to false
        await Wishlist.updateMany(
            { userId, isActive: true },
            { isActive: false }
        );

        res.status(200).json({
            success: true,
            message: "Wishlist cleared successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error clearing wishlist",
            error: error.message
        });
    }
});

export{
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
    clearWishlist
}
