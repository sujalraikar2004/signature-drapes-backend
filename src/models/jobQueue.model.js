import mongoose from 'mongoose';

const jobQueueSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['SEND_ORDER_CONFIRMATION_EMAIL', 'SEND_INVOICE_EMAIL', 'CLEAR_CART', 'SYNC_STOCK'],
    },
    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'],
        default: 'PENDING',
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    orderId: {
        type: String, // Human-readable orderId
        index: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    maxAttempts: {
        type: Number,
        default: 5,
    },
    lastError: {
        type: String,
    },
    processAfter: {
        type: Date,
        default: Date.now,
        index: true,
    },
    processedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Index to efficiently find jobs that are ready to be processed
jobQueueSchema.index({ status: 1, processAfter: 1 });

export const JobQueue = mongoose.model('JobQueue', jobQueueSchema);
