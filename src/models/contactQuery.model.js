import mongoose, { Schema } from "mongoose";

const contactQuerySchema = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true
    },
    phoneNo: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true
    },
    mediaFiles: [{
        url: {
            type: String
        },
        type: {
            type: String,
            enum: ['image', 'video']
        },
        publicId: {
            type: String
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'closed'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    notes: {
        type: String,
        trim: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
contactQuerySchema.index({ status: 1, createdAt: -1 });
contactQuerySchema.index({ email: 1 });
contactQuerySchema.index({ isRead: 1 });

export const ContactQuery = mongoose.model("ContactQuery", contactQuerySchema);
