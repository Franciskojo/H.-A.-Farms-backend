
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import "dotenv/config";


// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// User avatar storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'svg'],
    // public_id: (req, file) => `avatar-${Date.now()}`
  }
});


// Asset icon storage
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "images",
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'svg'],
    public_id: (req, file) => `image-${Date.now()}`
  }
});

export const upload = multer({ storage });
export const imagesUpload = multer({ storage: imageStorage });




export default cloudinary;
