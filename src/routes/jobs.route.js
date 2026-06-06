import express from 'express';
import { processJobQueue } from '../utils/jobQueue.js';
import { JobQueue } from '../models/jobQueue.model.js';

const router = express.Router();

/**
 * POST /api/v1/jobs/process
 * Trigger job queue processing. Should be called by:
 *  1. Vercel Cron (set up in vercel.json)
 *  2. Automatically after payment verification
 *
 * Secured with a secret header to prevent unauthorized triggers.
 */
router.post('/process', async (req, res) => {
    try {
        // Validate cron/internal secret
        const secret = req.headers['x-cron-secret'] || req.query.secret;
        if (secret !== process.env.CRON_SECRET) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const stats = await processJobQueue({ batchSize: 50, timeoutMs: 25000 });

        return res.json({
            success: true,
            message: 'Job queue processed',
            stats,
        });
    } catch (err) {
        console.error('[JobRoute] /process error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/v1/jobs/status
 * Returns queue status counts (admin visibility).
 */
router.get('/status', async (req, res) => {
    try {
        const secret = req.headers['x-cron-secret'] || req.query.secret;
        if (secret !== process.env.CRON_SECRET) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const counts = await JobQueue.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const result = { PENDING: 0, PROCESSING: 0, DONE: 0, FAILED: 0 };
        counts.forEach((c) => {
            result[c._id] = c.count;
        });

        // Also get recent failed jobs details
        const recentFailed = await JobQueue.find({ status: 'FAILED' })
            .sort({ updatedAt: -1 })
            .limit(10)
            .select('type orderId lastError attempts updatedAt');

        return res.json({ success: true, counts: result, recentFailed });
    } catch (err) {
        console.error('[JobRoute] /status error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/v1/jobs/retry-failed
 * Reset FAILED jobs back to PENDING so they get retried.
 */
router.post('/retry-failed', async (req, res) => {
    try {
        const secret = req.headers['x-cron-secret'] || req.query.secret;
        if (secret !== process.env.CRON_SECRET) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { orderId } = req.query;
        const filter = { status: 'FAILED' };
        if (orderId) filter.orderId = orderId;

        const result = await JobQueue.updateMany(filter, {
            $set: {
                status: 'PENDING',
                processAfter: new Date(),
                lastError: null,
                attempts: 0,
            },
        });

        return res.json({
            success: true,
            message: `Reset ${result.modifiedCount} failed jobs to PENDING`,
        });
    } catch (err) {
        console.error('[JobRoute] /retry-failed error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
