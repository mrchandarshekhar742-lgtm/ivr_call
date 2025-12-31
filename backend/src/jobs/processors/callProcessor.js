const Campaign = require('../../models/Campaign');
const Contact = require('../../models/Contact');
const CallLog = require('../../models/CallLog');
const { logger } = require('../../config/logger');
const { getTelephonyService } = require('../../services/telephonyService');
const androidDeviceService = require('../../services/androidDeviceService');

const makeCall = async (job) => {
  const { campaignId, contactId } = job.data;
  
  try {
    logger.info(`Processing call job for campaign ${campaignId}, contact ${contactId}`);
    
    // Get campaign and contact details
    const campaign = await Campaign.findOne({
      where: { id: campaignId }
    });
    const contact = await Contact.findOne({
      where: { id: contactId }
    });
    
    if (!campaign || !contact) {
      throw new Error('Campaign or contact not found');
    }
    
    // Check if campaign is still active
    if (campaign.status !== 'running') {
      throw new Error('Campaign is not running');
    }
    
    // Check if contact is eligible for calling
    if (contact.status !== 'pending' && contact.status !== 'active') {
      throw new Error('Contact is not eligible for calling');
    }
    
    // Update contact status to calling
    await Contact.update(
      { status: 'calling', updatedAt: new Date() },
      { where: { id: contactId } }
    );
    
    // Determine which telephony service to use
    const telephonyProvider = process.env.TELEPHONY_PROVIDER || 'mock';
    let callResult;
    
    if (telephonyProvider === 'android_device') {
      // Use Android device for calling
      try {
        const device = await androidDeviceService.assignCall(campaignId, contact);
        
        callResult = {
          success: true,
          callSid: device.currentCall.callId,
          status: 'initiated',
          provider: 'android_device',
          fromNumber: device.phoneNumber,
          toNumber: contact.phone,
          deviceId: device.id
        };
      } catch (error) {
        if (error.message.includes('queued')) {
          // Call was queued, return success but with queued status
          callResult = {
            success: true,
            callSid: `queued_${Date.now()}`,
            status: 'queued',
            provider: 'android_device',
            fromNumber: 'queued',
            toNumber: contact.phone,
            message: 'Call queued - no devices available'
          };
        } else {
          throw error;
        }
      }
    } else {
      // Use traditional telephony service (Twilio/Plivo)
      const telephonyService = getTelephonyService();
      callResult = await telephonyService.makeCall(campaignId, contact, campaign.ivrFlow);
    }
    
    // Create call log
    const callLog = await CallLog.create({
      campaignId,
      contactId,
      callSid: callResult.callSid,
      sessionId: `session_${Date.now()}`,
      call: {
        fromNumber: callResult.fromNumber || campaign.config?.fromNumber || process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        toNumber: callResult.toNumber || contact.phone,
        direction: 'outbound',
        status: callResult.status,
        startTime: new Date(),
        cost: 0, // Will be updated by webhooks or device reports
        currency: telephonyProvider === 'android_device' ? 'INR' : 'USD'
      },
      flow: {
        audioPlayed: [],
        dtmfReceived: [],
        completedSteps: []
      },
      provider: {
        name: callResult.provider,
        callSid: callResult.callSid,
        accountSid: process.env.TWILIO_ACCOUNT_SID || 'android_device',
        deviceId: callResult.deviceId || null
      }
    });
    
    // Update contact status based on call result
    let newStatus;
    if (callResult.status === 'queued') {
      newStatus = 'pending'; // Keep as pending if queued
    } else {
      newStatus = callResult.success ? 'called' : 'failed';
    }
    
    const callHistory = contact.callHistory || [];
    callHistory.push({
      callId: callLog.id,
      attemptNumber: callHistory.length + 1,
      status: callResult.status,
      timestamp: new Date(),
      error: callResult.error,
      provider: callResult.provider,
      deviceId: callResult.deviceId
    });
    
    await Contact.update(
      { 
        status: newStatus,
        callHistory: callHistory,
        updatedAt: new Date()
      },
      { where: { id: contactId } }
    );
    
    // Update campaign stats
    const currentStats = campaign.stats || {
      totalCalls: 0,
      completedCalls: 0,
      failedCalls: 0,
      answeredCalls: 0,
      busyCalls: 0,
      noAnswerCalls: 0,
      queuedCalls: 0,
      dtmfResponses: {},
      averageCallDuration: 0,
      totalCost: 0,
      successRate: 0
    };
    
    currentStats.totalCalls += 1;
    if (callResult.status === 'queued') {
      currentStats.queuedCalls = (currentStats.queuedCalls || 0) + 1;
    } else if (callResult.success) {
      currentStats.completedCalls += 1;
    } else {
      currentStats.failedCalls += 1;
    }
    
    // Calculate success rate
    currentStats.successRate = currentStats.totalCalls > 0 
      ? (currentStats.completedCalls / currentStats.totalCalls) * 100 
      : 0;
    
    await Campaign.update(
      { stats: currentStats, updatedAt: new Date() },
      { where: { id: campaignId } }
    );
    
    logger.info(`Call job completed successfully:`, {
      campaignId,
      contactId,
      callSid: callResult.callSid,
      success: callResult.success,
      provider: callResult.provider,
      status: callResult.status,
      deviceId: callResult.deviceId
    });
    
    return {
      success: true,
      callSid: callResult.callSid,
      status: callResult.status,
      provider: callResult.provider,
      deviceId: callResult.deviceId,
      message: callResult.message
    };
    
  } catch (error) {
    logger.error(`Call job failed:`, {
      campaignId,
      contactId,
      error: error.message
    });
    
    // Update contact status to failed
    try {
      const contact = await Contact.findOne({ where: { id: contactId } });
      if (contact) {
        const callHistory = contact.callHistory || [];
        callHistory.push({
          attemptNumber: callHistory.length + 1,
          status: 'failed',
          timestamp: new Date(),
          error: error.message
        });
        
        await Contact.update(
          { 
            status: 'failed',
            callHistory: callHistory,
            updatedAt: new Date()
          },
          { where: { id: contactId } }
        );
      }
    } catch (updateError) {
      logger.error('Failed to update contact status:', updateError);
    }
    
    throw error;
  }
};

const retryCall = async (job) => {
  const { callLogId } = job.data;
  
  try {
    logger.info(`Processing retry call job for call ${callLogId}`);
    
    const callLog = await CallLog.findById(callLogId);
    if (!callLog) {
      throw new Error('Call log not found');
    }
    
    // Process retry logic here
    return await makeCall({
      data: {
        campaignId: callLog.campaignId,
        contactId: callLog.contactId
      }
    });
    
  } catch (error) {
    logger.error(`Retry call job failed:`, {
      callLogId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  makeCall,
  retryCall
};