import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
        console.log("checking for token",token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  // Check if user is authenticated (verifyJWT should have set req.user)
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  // For now, allow all authenticated users to perform admin operations
  // In a real application, you would check for specific admin role/permissions
  // Example: if (req.user.role !== 'admin') { throw new ApiError(403, "Admin access required"); }
  
  next();
});

// Optional JWT verification - doesn't throw error if token is missing
// Allows endpoints to work for both authenticated and non-authenticated users
export const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      // No token provided, continue without user
      return next();
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Token is invalid, but we don't throw error - just continue without user
    console.log("Optional JWT verification failed:", error.message);
    next();
  }
});