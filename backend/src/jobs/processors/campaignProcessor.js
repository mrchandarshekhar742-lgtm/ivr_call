const Campaign = require('../../models/Campaign');
const Contact = require('../../models/Contact');
const Queue = require('bull');
const { logger } = require('../../config/logger');

const callQueue = new Queue('call processing', process.env.REDIS_URL || 'redis://localhost:6379');

const startCampaign = async (job) => {
  const { campaignId } = job.data;
  
  try {
    logger.info(`Starting campaign ${campaignId}`);
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    // Update campaign status
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'running',
      startedAt: new Date(),
      updatedAt: new Date()
    });
    
    // Get pending contacts
    const contacts = await Contact.find({
      campaignId,
      status: 'pending'
    }).limit(campaign.config.maxConcurrentCalls || 10);
    
    // Schedule call jobs
    const callJobs = contacts.map(contact => ({
      name: 'make_call',
      data: {
        campaignId,
        contactId: contact._id
      },
      opts: {
        attempts: campaign.config.retryAttempts || 3,
        backoff: {
          type: 'exponential',
          delay: (campaign.config.retryInterval || 5) * 60 * 1000
        }
      }
    }));
    
    if (callJobs.length > 0) {
      await callQueue.addBulk(callJobs);
      logger.info(`Scheduled ${callJobs.length} call jobs for campaign ${campaignId}`);
    }
    
    return {
      success: true,
      callsScheduled: callJobs.length
    };
    
  } catch (error) {
    logger.error(`Failed to start campaign ${campaignId}:`, error);
    
    // Update campaign status to failed
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'failed',
      updatedAt: new Date()
    });
    
    throw error;
  }
};

const pauseCampaign = async (job) => {
  const { campaignId } = job.data;
  
  try {
    logger.info(`Pausing campaign ${campaignId}`);
    
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'paused',
      pausedAt: new Date(),
      updatedAt: new Date()
    });
    
    // TODO: Cancel pending call jobs for this campaign
    
    return { success: true };
    
  } catch (error) {
    logger.error(`Failed to pause campaign ${campaignId}:`, error);
    throw error;
  }
};

const resumeCampaign = async (job) => {
  const { campaignId } = job.data;
  
  try {
    logger.info(`Resuming campaign ${campaignId}`);
    
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'running',
      updatedAt: new Date()
    });
    
    // Reschedule pending calls
    return await startCampaign(job);
    
  } catch (error) {
    logger.error(`Failed to resume campaign ${campaignId}:`, error);
    throw error;
  }
};

module.exports = {
  startCampaign,
  pauseCampaign,
  resumeCampaign
};