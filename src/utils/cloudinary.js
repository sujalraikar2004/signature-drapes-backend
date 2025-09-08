import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

const uploadonCloudinary = async (filepath) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        const response = await cloudinary.uploader.upload(filepath, {
            resource_type:"auto" // Automatically detect the resource type (image, video, etc.)
        })

        console.log("file uploaded to cloudinary",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(filepath);
        throw error;
    }
}
export { uploadonCloudinary };
