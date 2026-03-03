import { v2 as cloudinary } from 'cloudinary';


// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dfoybcsqz',
  api_key: '123167425185542',
  api_secret: 'a3TCygIC3JHWepjmyBKTq8YUafw'
});

// Upload the image
const uploadImage = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath);
    console.log(result.secure_url); // The resulting image URL
    return result.secure_url;
  } catch (error) {
    console.error(error);
  }
};

// Use the function
uploadImage('sofa.jpg');
