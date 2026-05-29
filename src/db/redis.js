import { createClient } from 'redis';
import ApiError from '../utils/ApiError.js';

let redisClient;

export const connectRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            disableOfflineQueue: true,
            socket: {
                connectTimeout: 10000
            }
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('Redis Client Connected');
        });

        await redisClient.connect();
    } catch (error) {
        console.error('Redis Connection Failed:', error);
        throw new ApiError(500, "Could not connect to Redis");
    }
};

export { redisClient };
