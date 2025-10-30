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

export { uploadonCloudinary };
