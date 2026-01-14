import { ContactQuery } from "../models/contactQuery.model.js";
import { sendCustomerQueryNotification } from "../utils/nodemailer.js";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, resourceType) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                folder: 'signature-drapes/customer-queries',
                public_id: `query-${Date.now()}-${Math.round(Math.random() * 1E9)}`
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(fileBuffer);
    });
};

// Create a new contact query
const createContactQuery = async (req, res) => {
    try {
        const { name, email, phoneNo, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !phoneNo || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Handle media files if uploaded
        let mediaFiles = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    // Determine resource type based on mimetype
                    const isVideo = file.mimetype.startsWith('video/');
                    const resourceType = isVideo ? 'video' : 'image';
                    
                    // Upload to Cloudinary
                    const result = await uploadToCloudinary(file.buffer, resourceType);

                    mediaFiles.push({
                        url: result.secure_url,
                        type: resourceType === 'video' ? 'video' : 'image',
                        publicId: result.public_id
                    });
                } catch (uploadError) {
                    console.error('Error uploading file to Cloudinary:', uploadError);
                }
            }
        }

        // Create new contact query
        const contactQuery = await ContactQuery.create({
            name,
            email,
            phoneNo,
            subject,
            message,
            mediaFiles,
            status: 'pending',
            priority: 'medium',
            isRead: false
        });

        // Send email notification to admin
        try {
            await sendCustomerQueryNotification({
                name,
                email,
                phoneNo,
                subject,
                message,
                mediaFiles,
                queryId: contactQuery._id,
                createdAt: contactQuery.createdAt
            });
        } catch (emailError) {
            console.error('Error sending email notification:', emailError);
            // Don't fail the request if email fails
        }

        return res.status(201).json({
            success: true,
            message: "Your query has been submitted successfully. We will get back to you soon!",
            data: contactQuery
        });

    } catch (error) {
        console.error('Error creating contact query:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit query. Please try again later.",
            error: error.message
        });
    }
};

// Get all contact queries (Admin only)
const getAllContactQueries = async (req, res) => {
    try {
        const { 
            status, 
            priority, 
            isRead, 
            page = 1, 
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        // Calculate pagination
        const skip = (page - 1) * limit;
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Get queries with pagination
        const queries = await ContactQuery.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('assignedTo', 'username email');

        // Get total count
        const totalQueries = await ContactQuery.countDocuments(filter);

        // Get counts by status
        const statusCounts = await ContactQuery.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Get unread count
        const unreadCount = await ContactQuery.countDocuments({ isRead: false });

        return res.status(200).json({
            success: true,
            data: queries,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalQueries / limit),
                totalQueries,
                limit: parseInt(limit)
            },
            stats: {
                statusCounts: statusCounts.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                unreadCount
            }
        });

    } catch (error) {
        console.error('Error fetching contact queries:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch queries",
            error: error.message
        });
    }
};

// Get single contact query by ID (Admin only)
const getContactQueryById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = await ContactQuery.findById(id)
            .populate('assignedTo', 'username email');

        if (!query) {
            return res.status(404).json({
                success: false,
                message: "Query not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: query
        });

    } catch (error) {
        console.error('Error fetching contact query:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch query",
            error: error.message
        });
    }
};

// Update contact query status (Admin only)
const updateContactQueryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, notes, assignedTo } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (notes) updateData.notes = notes;
        if (assignedTo) updateData.assignedTo = assignedTo;

        // If status is resolved, set resolvedAt
        if (status === 'resolved' || status === 'closed') {
            updateData.resolvedAt = new Date();
        }

        const query = await ContactQuery.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('assignedTo', 'username email');

        if (!query) {
            return res.status(404).json({
                success: false,
                message: "Query not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Query updated successfully",
            data: query
        });

    } catch (error) {
        console.error('Error updating contact query:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update query",
            error: error.message
        });
    }
};

// Mark query as read (Admin only)
const markQueryAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const query = await ContactQuery.findByIdAndUpdate(
            id,
            { 
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        if (!query) {
            return res.status(404).json({
                success: false,
                message: "Query not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Query marked as read",
            data: query
        });

    } catch (error) {
        console.error('Error marking query as read:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark query as read",
            error: error.message
        });
    }
};

// Delete contact query (Admin only)
const deleteContactQuery = async (req, res) => {
    try {
        const { id } = req.params;

        const query = await ContactQuery.findById(id);

        if (!query) {
            return res.status(404).json({
                success: false,
                message: "Query not found"
            });
        }

        // Delete associated media files from Cloudinary
        if (query.mediaFiles && query.mediaFiles.length > 0) {
            for (const file of query.mediaFiles) {
                try {
                    if (file.publicId) {
                        await cloudinary.uploader.destroy(file.publicId, {
                            resource_type: file.type === 'video' ? 'video' : 'image'
                        });
                    }
                } catch (deleteError) {
                    console.error('Error deleting file from Cloudinary:', deleteError);
                }
            }
        }

        await ContactQuery.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Query deleted successfully"
        });

    } catch (error) {
        console.error('Error deleting contact query:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete query",
            error: error.message
        });
    }
};

// Get unread queries count (Admin only)
const getUnreadQueriesCount = async (req, res) => {
    try {
        const unreadCount = await ContactQuery.countDocuments({ isRead: false });

        return res.status(200).json({
            success: true,
            unreadCount
        });

    } catch (error) {
        console.error('Error fetching unread count:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch unread count",
            error: error.message
        });
    }
};

// Get dashboard stats (Admin only)
const getQueryStats = async (req, res) => {
    try {
        const totalQueries = await ContactQuery.countDocuments();
        const pendingQueries = await ContactQuery.countDocuments({ status: 'pending' });
        const inProgressQueries = await ContactQuery.countDocuments({ status: 'in-progress' });
        const resolvedQueries = await ContactQuery.countDocuments({ status: 'resolved' });
        const unreadQueries = await ContactQuery.countDocuments({ isRead: false });

        // Get queries from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentQueries = await ContactQuery.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        return res.status(200).json({
            success: true,
            stats: {
                total: totalQueries,
                pending: pendingQueries,
                inProgress: inProgressQueries,
                resolved: resolvedQueries,
                unread: unreadQueries,
                recentQueries
            }
        });

    } catch (error) {
        console.error('Error fetching query stats:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch stats",
            error: error.message
        });
    }
};

export {
    createContactQuery,
    getAllContactQueries,
    getContactQueryById,
    updateContactQueryStatus,
    markQueryAsRead,
    deleteContactQuery,
    getUnreadQueriesCount,
    getQueryStats
};
