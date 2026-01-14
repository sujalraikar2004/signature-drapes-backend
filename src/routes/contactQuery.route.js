import { Router } from "express";
import {
    createContactQuery,
    getAllContactQueries,
    getContactQueryById,
    updateContactQueryStatus,
    markQueryAsRead,
    deleteContactQuery,
    getUnreadQueriesCount,
    getQueryStats
} from "../controller/contactQuery.controller.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.middleware.js";
import { uploadMedia } from "../middleware/multer.middleware.js";

const router = Router();

// Public routes (for customers to submit queries)
router.post("/", uploadMedia.array('mediaFiles', 10), createContactQuery);

// Admin routes (protected)
router.get("/", verifyJWT, verifyAdmin, getAllContactQueries);
router.get("/stats", verifyJWT, verifyAdmin, getQueryStats);
router.get("/unread-count", verifyJWT, verifyAdmin, getUnreadQueriesCount);
router.get("/:id", verifyJWT, verifyAdmin, getContactQueryById);
router.patch("/:id", verifyJWT, verifyAdmin, updateContactQueryStatus);
router.patch("/:id/mark-read", verifyJWT, verifyAdmin, markQueryAsRead);
router.delete("/:id", verifyJWT, verifyAdmin, deleteContactQuery);

export default router;
