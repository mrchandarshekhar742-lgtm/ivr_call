const rateLimit = require('express-rate-limit');
const { logger } = require('../config/logger');

// Redis store for rate limiting with fallback
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.client = null;
    this.memoryStore = new Map(); // Fallback to memory store
    
    // Try to get Redis client, but don't fail if not available
    try {
      const { getRedisClient } = require('../config/redis');
      this.client = getRedisClient();
      if (!this.client) {
        logger.warn('Redis not available for rate limiting, using memory store');
      }
    } catch (error) {
      logger.warn('Redis not available for rate limiting, using memory store:', error.message);
    }
  }

  async increment(key) {
    const redisKey = this.prefix + key;
    
    if (this.client) {
      try {
        const current = await this.client.incr(redisKey);
        
        if (current === 1) {
          await this.client.expire(redisKey, 900); // 15 minutes
        }
        
        return {
          totalHits: current,
          resetTime: new Date(Date.now() + 900000) // 15 minutes from now
        };
      } catch (error) {
        logger.warn('Redis error, falling back to memory store:', error.message);
        this.client = null; // Disable Redis for future requests
      }
    }
    
    // Fallback to memory store
    const now = Date.now();
    const windowStart = now - 900000; // 15 minutes ago
    
    if (!this.memoryStore.has(redisKey)) {
      this.memoryStore.set(redisKey, []);
    }
    
    const requests = this.memoryStore.get(redisKey);
    // Remove old requests
    const validRequests = requests.filter(time => time > windowStart);
    validRequests.push(now);
    this.memoryStore.set(redisKey, validRequests);
    
    return {
      totalHits: validRequests.length,
      resetTime: new Date(now + 900000)
    };
  }

  async decrement(key) {
    const redisKey = this.prefix + key;
    
    if (this.client) {
      try {
        const current = await this.client.decr(redisKey);
        return Math.max(0, current);
      } catch (error) {
        logger.warn('Redis error in decrement:', error.message);
        this.client = null;
      }
    }
    
    // Memory store fallback
    if (this.memoryStore.has(redisKey)) {
      const requests = this.memoryStore.get(redisKey);
      if (requests.length > 0) {
        requests.pop();
        this.memoryStore.set(redisKey, requests);
        return requests.length;
      }
    }
    return 0;
  }

  async resetKey(key) {
    const redisKey = this.prefix + key;
    
    if (this.client) {
      try {
        await this.client.del(redisKey);
        return;
      } catch (error) {
        logger.warn('Redis error in resetKey:', error.message);
        this.client = null;
      }
    }
    
    // Memory store fallback
    this.memoryStore.delete(redisKey);
  }
}

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100), // Higher limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'api_limit:' }),
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'auth_limit:' }),
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Campaign creation rate limiter
const campaignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 campaign creations per hour
  message: {
    success: false,
    message: 'Too many campaigns created, please try again later.',
    retryAfter: '1 hour'
  },
  store: new RedisStore({ prefix: 'campaign_limit:' }),
  keyGenerator: (req) => `user:${req.user.id}`,
  skip: (req) => !req.user, // Skip if not authenticated
  handler: (req, res) => {
    logger.warn('Campaign creation rate limit exceeded', {
      userId: req.user.id,
      ip: req.ip
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many campaigns created. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each user to 20 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  store: new RedisStore({ prefix: 'upload_limit:' }),
  keyGenerator: (req) => `user:${req.user.id}`,
  skip: (req) => !req.user,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      userId: req.user.id,
      ip: req.ip
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many file uploads. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Webhook rate limiter (more lenient for external services)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 webhook requests per minute
  message: {
    success: false,
    message: 'Webhook rate limit exceeded'
  },
  store: new RedisStore({ prefix: 'webhook_limit:' }),
  handler: (req, res) => {
    logger.warn('Webhook rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Webhook rate limit exceeded'
    });
  }
});

// Dynamic rate limiter based on user role
const dynamicLimiter = (req, res, next) => {
  if (!req.user) {
    return apiLimiter(req, res, next);
  }

  // Different limits based on user role
  const roleLimits = {
    admin: 1000,
    manager: 500,
    operator: 200
  };

  const userLimit = roleLimits[req.user.role] || 100;

  const dynamicRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: userLimit,
    store: new RedisStore({ prefix: 'dynamic_limit:' }),
    keyGenerator: (req) => `user:${req.user.id}`,
    message: {
      success: false,
      message: `Rate limit exceeded for ${req.user.role} role`,
      limit: userLimit
    }
  });

  return dynamicRateLimit(req, res, next);
};

// Custom rate limiter for specific endpoints
const createCustomLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      success: false,
      message: 'Rate limit exceeded'
    },
    store: new RedisStore({ prefix: options.prefix || 'custom_limit:' }),
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    skip: options.skip,
    handler: options.handler || ((req, res) => {
      res.status(429).json(options.message);
    })
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  campaignLimiter,
  uploadLimiter,
  webhookLimiter,
  dynamicLimiter,
  createCustomLimiter
};