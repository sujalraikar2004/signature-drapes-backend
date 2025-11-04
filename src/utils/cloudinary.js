import {v2 as cloudinary} from "cloudinary"

const uploadonCloudinary = async (fileBuffer, originalName) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    public_id: `products/${Date.now()}-${Math.round(Math.random() * 1E9)}`,
                    folder: "products"
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        reject(error);
                    } else {
                        console.log("File uploaded to cloudinary:", result.secure_url);
                        resolve(result);
                    }
                }
            ).end(fileBuffer);
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}

const uploadVideoOnCloudinary = async (fileBuffer, originalName) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: "video",
                    public_id: `products/videos/${Date.now()}-${Math.round(Math.random() * 1E9)}`,
                    folder: "products/videos",
                    // Video-specific options
                    eager: [
                        { 
                            width: 1280, 
                            height: 720, 
                            crop: "limit",
                            quality: "auto",
                            format: "mp4"
                        }
                    ],
                    // Generate thumbnail from video
                    eager_async: true,
                    // Notification URL for async operations (optional)
                    // notification_url: "your-webhook-url"
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary video upload error:", error);
                        reject(error);
                    } else {
                        console.log("Video uploaded to cloudinary:", result.secure_url);
                        // Generate thumbnail URL from video
                        const thumbnailUrl = cloudinary.url(result.public_id, {
                            resource_type: "video",
                            format: "jpg",
                            transformation: [
                                { width: 640, height: 360, crop: "fill" },
                                { quality: "auto" }
                            ]
                        });
                        
                        resolve({
                            ...result,
                            thumbnail_url: thumbnailUrl
                        });
                    }
                }
            ).end(fileBuffer);
        });
    } catch (error) {
        console.error("Cloudinary video upload error:", error);
        throw error;
    }
}

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        console.log(`Deleted ${resourceType} from cloudinary:`, publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
}

export { uploadonCloudinary, uploadVideoOnCloudinary, deleteFromCloudinary };
