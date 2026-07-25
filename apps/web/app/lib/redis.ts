import Redis from 'ioredis';


const redisUrl = process.env.REDIS_URL || 'redis://dev_redis:6379';


const redis = new Redis(redisUrl, {
  connectTimeout: 10000, 
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('ioredis client error:', err);
});

redis.on('connect', () => {
  console.log('ioredis client successfully connected to server.');
});

export default redis;
