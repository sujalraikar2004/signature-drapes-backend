import { JobQueue } from '../models/jobQueue.model.js';
import { sendOrderConfirmationNotification, sendInvoiceEmail } from './nodemailer.js';
import { Cart } from '../models/cart.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';

/**
 * Enqueue one or more jobs for a given order.
 * Jobs are persisted to MongoDB, so they survive serverless cold starts.
 */
export const enqueueOrderJobs = async (order, userDoc, populatedProducts) => {
    const jobs = [];

    // Job 1: Admin order confirmation email
    jobs.push({
        type: 'SEND_ORDER_CONFIRMATION_EMAIL',
        orderId: order.orderId,
        payload: {
            orderId: order.orderId,
            customer: {
                name: userDoc?.username || order.shippingAddress.fullName,
                email: userDoc?.email,
                phone: userDoc?.phoneNo || order.shippingAddress.phone,
            },
            products: populatedProducts,
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
            paymentMode: order.paymentMode,
            paymentStatus: order.paymentStatus,
            transactionId: order.transactionId,
            hasCustomItems: order.hasCustomItems,
        },
    });

    // Job 2: Invoice email to customer + admin
    if (userDoc?.email) {
        jobs.push({
            type: 'SEND_INVOICE_EMAIL',
            orderId: order.orderId,
            payload: {
                userEmail: userDoc.email,
                username: userDoc.username,
                // Store only what's needed to rebuild the order object for the email function
                orderData: {
                    _id: order._id?.toString(),
                    orderId: order.orderId,
                    products: order.products,
                    shippingAddress: order.shippingAddress,
                    totalAmount: order.totalAmount,
                    paymentMode: order.paymentMode,
                    paymentStatus: order.paymentStatus,
                    transactionId: order.transactionId,
                    hasCustomItems: order.hasCustomItems,
                    createdAt: order.createdAt,
                },
            },
        });
    }

    // Job 3: Clear customer cart
    jobs.push({
        type: 'CLEAR_CART',
        orderId: order.orderId,
        payload: {
            userId: order.userId?.toString(),
        },
    });

    // Bulk-insert all jobs atomically
    await JobQueue.insertMany(jobs);
    console.log(`[JobQueue] Enqueued ${jobs.length} jobs for order ${order.orderId}`);
};

/**
 * Execute a single job. Returns true on success, throws on failure.
 */
const executeJob = async (job) => {
    switch (job.type) {
        case 'SEND_ORDER_CONFIRMATION_EMAIL': {
            await sendOrderConfirmationNotification(job.payload);
            console.log(`[JobQueue] Admin confirmation email sent for order ${job.orderId}`);
            break;
        }

        case 'SEND_INVOICE_EMAIL': {
            const { userEmail, username, orderData } = job.payload;
            await sendInvoiceEmail(userEmail, username, orderData);
            console.log(`[JobQueue] Invoice email sent for order ${job.orderId}`);
            break;
        }

        case 'CLEAR_CART': {
            const { userId } = job.payload;
            await Cart.findOneAndUpdate(
                { userId },
                { $set: { products: [], totalPrice: 0, totalDeliveryCharge: 0 } }
            );
            console.log(`[JobQueue] Cart cleared for user ${userId}, order ${job.orderId}`);
            break;
        }

        default:
            throw new Error(`Unknown job type: ${job.type}`);
    }
};

/**
 * Process pending jobs from the queue.
 * - Fetches up to `batchSize` PENDING jobs.
 * - Marks them PROCESSING (prevents duplicate execution).
 * - Executes each job, marks DONE or increments retry count.
 * - Jobs that exceed maxAttempts are marked FAILED.
 *
 * @param {Object} options
 * @param {number} options.batchSize - How many jobs to process per call (default 20)
 * @param {number} options.timeoutMs  - Max ms to spend processing (default 25s for Vercel)
 */
export const processJobQueue = async ({ batchSize = 20, timeoutMs = 25000 } = {}) => {
    const startTime = Date.now();
    const stats = { processed: 0, failed: 0, skipped: 0 };

    // Fetch pending jobs that are ready to run (and haven't exceeded max attempts)
    const jobs = await JobQueue.find({
        status: 'PENDING',
        processAfter: { $lte: new Date() },
        $expr: { $lt: ['$attempts', '$maxAttempts'] },
    })
        .sort({ createdAt: 1 })
        .limit(batchSize);

    for (const job of jobs) {
        // Check remaining time to avoid Vercel timeout
        if (Date.now() - startTime > timeoutMs) {
            console.log('[JobQueue] Approaching timeout, stopping batch');
            break;
        }

        // Atomically claim the job (prevent concurrent duplicate execution)
        const claimed = await JobQueue.findOneAndUpdate(
            { _id: job._id, status: 'PENDING' },
            {
                $set: { status: 'PROCESSING' },
                $inc: { attempts: 1 },
            },
            { new: true }
        );

        if (!claimed) {
            // Another worker grabbed it
            stats.skipped++;
            continue;
        }

        try {
            await executeJob(claimed);

            await JobQueue.findByIdAndUpdate(claimed._id, {
                $set: {
                    status: 'DONE',
                    processedAt: new Date(),
                    lastError: null,
                },
            });

            stats.processed++;
        } catch (err) {
            console.error(`[JobQueue] Job ${claimed._id} (${claimed.type}) failed:`, err.message);

            const newAttempts = claimed.attempts; // already incremented above
            const isDead = newAttempts >= claimed.maxAttempts;

            // Exponential back-off: 1min, 2min, 4min, 8min, 16min
            const backoffMs = Math.min(60000 * Math.pow(2, newAttempts - 1), 16 * 60 * 1000);

            await JobQueue.findByIdAndUpdate(claimed._id, {
                $set: {
                    status: isDead ? 'FAILED' : 'PENDING',
                    lastError: err.message,
                    processAfter: isDead ? new Date() : new Date(Date.now() + backoffMs),
                },
            });

            stats.failed++;
        }
    }

    console.log(`[JobQueue] Batch done - processed:${stats.processed} failed:${stats.failed} skipped:${stats.skipped}`);
    return stats;
};

/**
 * Convenience: enqueue jobs then immediately try to process them.
 * Called right after payment verification in the same request.
 * Even if processing fails/times out, jobs remain in MongoDB for retry.
 */
export const enqueueAndProcess = async (order, userDoc, populatedProducts) => {
    await enqueueOrderJobs(order, userDoc, populatedProducts);

    // Fire-and-forget processing with timeout safety
    // We don't await this so the HTTP response is not blocked
    processJobQueue({ batchSize: 10, timeoutMs: 20000 }).catch((err) => {
        console.error('[JobQueue] Background processing error:', err.message);
    });
};
