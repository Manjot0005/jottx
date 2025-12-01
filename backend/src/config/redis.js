const redis = require('redis');
require('dotenv').config();

// Redis Client Configuration - v4+ compatible
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD;

const redisUrl = redisPassword 
  ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
  : `redis://${redisHost}:${redisPort}`;

console.log(`🔧 Redis connecting to: ${redisHost}:${redisPort}`);

const redisClient = redis.createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Too many reconnection attempts');
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Error handling
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Connected Successfully');
});

redisClient.on('ready', () => {
  console.log('✅ Redis Client Ready');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis Connection Error:', error.message);
  }
};

// Cache helper functions
const cacheHelper = {
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  set: async (key, value, expirationInSeconds = 300) => {
    try {
      await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  },

  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  },

  delPattern: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis DEL PATTERN error:', error);
      return false;
    }
  }
};

module.exports = {
  redisClient,
  connectRedis,
  cacheHelper
};
