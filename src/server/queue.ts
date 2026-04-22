import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Create a redis connection specifically for BullMQ
export const connection = new IORedis({
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
