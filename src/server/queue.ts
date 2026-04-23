import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Create a redis connection specifically for BullMQ
// Use external Redis in production, default to localhost for dev
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Create the execution queue
export const executionQueue = new Queue('bot-execution', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: 100 // Keep last 100 failed jobs for debugging
  }
});
