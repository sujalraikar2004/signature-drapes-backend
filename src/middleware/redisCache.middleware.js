import { redisClient } from '../db/redis.js';

export const cacheRoute = (ttlSeconds) => {
    return async (req, res, next) => {
        if (!redisClient || !redisClient.isReady) {
            return next();
        }

        const key = req.originalUrl;
        
        try {
            const cachedData = await redisClient.get(key);
            
            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }
            
            // Override res.json to cache the response before sending it
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.setEx(key, ttlSeconds, JSON.stringify(body)).catch(err => {
                        console.error('Redis cache error:', err);
                    });
                }
                return originalJson(body);
            };
            
            next();
        } catch (error) {
            console.error('Redis cache middleware error:', error);
            next();
        }
    };
};

export const clearPatternCache = async (pattern) => {
    if (!redisClient || !redisClient.isReady) return;
    
    try {
        let cursor = 0;
        do {
            const result = await redisClient.scan(cursor, {
                MATCH: pattern,
                COUNT: 100
            });
            cursor = result.cursor;
            
            if (result.keys && result.keys.length > 0) {
                await redisClient.del(result.keys);
            }
        } while (cursor !== 0);
    } catch (error) {
        console.error('Redis clear pattern error:', error);
    }
};
