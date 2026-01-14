import express from 'express';
import {
    getAllGalleryItems,
    getGalleryItemById,
    createGalleryImage,
    createGalleryVideo,
    createMultipleGalleryItems,
    updateGalleryItem,
    deleteGalleryItem,
    deleteMultipleGalleryItems,
    getCategories,
    updateGalleryOrder
} from '../controller/gallery.controller.js';
import { verifyJWT, verifyAdmin } from '../middleware/auth.middleware.js';
import { upload, uploadVideo } from '../middleware/multer.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllGalleryItems);
router.get('/categories', getCategories);
router.get('/:id', getGalleryItemById);

// Protected routes (Admin only)
router.post('/image', verifyJWT, verifyAdmin, upload.single('image'), createGalleryImage);
router.post('/video', verifyJWT, verifyAdmin, uploadVideo.single('video'), createGalleryVideo);
router.post('/bulk', verifyJWT, verifyAdmin, createMultipleGalleryItems);
router.put('/:id', verifyJWT, verifyAdmin, upload.single('media'), updateGalleryItem);
router.delete('/:id', verifyJWT, verifyAdmin, deleteGalleryItem);
router.post('/bulk-delete', verifyJWT, verifyAdmin, deleteMultipleGalleryItems);
router.put('/reorder/items', verifyJWT, verifyAdmin, updateGalleryOrder);

export default router;
