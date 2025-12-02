import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';

// Configure dotenv to load environment variables
dotenv.config({
  path: './.env'
});

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadLogo = async () => {
  // Corrected path relative to the backend script location
  const logoPath = path.resolve(
    __dirname,
    './WhatsApp Image 2025-11-30 at 2_imgupscaler.ai_General_8K.jpg'
  );

  console.log(`Attempting to upload logo from: ${logoPath}`);

  if (!fs.existsSync(logoPath)) {
    console.error('Error: Logo file not found. Please check the path.');
    process.exit(1);
  }

  try {
    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(logoPath, {
      public_id: 'site_assets/signature_drapes_logo',
      folder: 'site_assets',
      overwrite: true,
      resource_type: 'image'
    });

    console.log('\n✅ Logo uploaded successfully!');
    console.log('================================');
    console.log('Your new Cloudinary URL is:');
    console.log(result.secure_url);
    console.log('================================');
    console.log('Please copy the URL above and provide it back to me.');

  } catch (error) {
    console.error('\n❌ Error uploading to Cloudinary:');
    console.error(error.message);
    console.error('Please ensure your .env file in the backend has the correct Cloudinary credentials.');
  }
};

uploadLogo();