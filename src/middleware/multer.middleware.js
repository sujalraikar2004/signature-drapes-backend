import multer from "multer";

// Use memory storage for deployment compatibility
const storage = multer.memoryStorage();

// Multer configuration for images only
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 5MB limit for images
    files: 10 // Maximum 10 files
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Multer configuration for videos only
export const uploadVideo = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 50MB limit for videos
    files: 5 // Maximum 5 video files
  },
  fileFilter: function (req, file, cb) {
    // Accept only video files
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MPEG, MOV, AVI, WEBM) are allowed!'), false);
    }
  }
});

// Multer configuration for both images and videos
export const uploadMedia = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (max for videos)
    files: 15 // Maximum 15 files total (10 images + 5 videos)
  },
  fileFilter: function (req, file, cb) {
    // Accept both image and video files
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});