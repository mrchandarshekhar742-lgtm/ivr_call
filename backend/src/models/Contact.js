// Contact Model - Currently using in-memory storage in server.js
// This file is kept for future database integration

class Contact {
  constructor(data) {
    this.id = data.id;
    this.campaignId = data.campaignId;
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.status = data.status;
    this.leadStatus = data.leadStatus;
    this.priority = data.priority;
    this.callAttempts = data.callAttempts;
    this.lastCallDate = data.lastCallDate;
    this.nextCallTime = data.nextCallTime;
    this.lastResponse = data.lastResponse;
    this.customFields = data.customFields;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

module.exports = Contact;