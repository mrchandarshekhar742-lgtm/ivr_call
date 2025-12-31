const redis = require('redis');
const { logger } = require('./logger');

let client;
let isConnected = false;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis reconnection failed after 3 attempts');
            return new Error('Max retries exceeded');
          }
          return retries * 100;
        }
      }
    });

    client.on('error', (err) => {
      isConnected = false;
      logger.warn('Redis Client Error:', err.message);
    });

    client.on('connect', () => {
      isConnected = true;
      logger.info('Redis Client Connected');
    });

    client.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    client.on('end', () => {
      isConnected = false;
      logger.warn('Redis Client Disconnected');
    });

    await client.connect();
    isConnected = true;
    return client;
  } catch (error) {
    isConnected = false;
    logger.warn('Redis connection failed, continuing without Redis:', error.message);
    // Don't throw - allow app to continue without Redis
    return null;
  }
};

const getRedisClient = () => {
  if (!client || !isConnected) {
    return null;
  }
  return client;
};

const isRedisConnected = () => isConnected;

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisConnected
};