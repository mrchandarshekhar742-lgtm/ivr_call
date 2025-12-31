require('dotenv').config();
const Queue = require('bull');
const { logger } = require('../config/logger');
const connectDB = require('../config/database');

// Import job processors
const callProcessor = require('./processors/callProcessor');
const campaignProcessor = require('./processors/campaignProcessor');
const analyticsProcessor = require('./processors/analyticsProcessor');

// Connect to database
connectDB();

// Create queues
const callQueue = new Queue('call processing', process.env.REDIS_URL || 'redis://localhost:6379');
const campaignQueue = new Queue('campaign processing', process.env.REDIS_URL || 'redis://localhost:6379');
const analyticsQueue = new Queue('analytics processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Process jobs
callQueue.process('make_call', 10, callProcessor.makeCall);
callQueue.process('retry_call', 5, callProcessor.retryCall);

campaignQueue.process('start_campaign', 1, campaignProcessor.startCampaign);
campaignQueue.process('pause_campaign', 1, campaignProcessor.pauseCampaign);
campaignQueue.process('resume_campaign', 1, campaignProcessor.resumeCampaign);

analyticsQueue.process('generate_report', 2, analyticsProcessor.generateReport);
analyticsQueue.process('update_stats', 5, analyticsProcessor.updateStats);

// Queue event handlers
const setupQueueEvents = (queue, queueName) => {
  queue.on('completed', (job, result) => {
    logger.info(`${queueName} job completed:`, { jobId: job.id, result });
  });

  queue.on('failed', (job, err) => {
    logger.error(`${queueName} job failed:`, { jobId: job.id, error: err.message });
  });

  queue.on('stalled', (job) => {
    logger.warn(`${queueName} job stalled:`, { jobId: job.id });
  });
};

setupQueueEvents(callQueue, 'Call Queue');
setupQueueEvents(campaignQueue, 'Campaign Queue');
setupQueueEvents(analyticsQueue, 'Analytics Queue');

logger.info('Worker started successfully');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker gracefully');
  
  await callQueue.close();
  await campaignQueue.close();
  await analyticsQueue.close();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker gracefully');
  
  await callQueue.close();
  await campaignQueue.close();
  await analyticsQueue.close();
  
  process.exit(0);
});