// Campaign Model - Currently using in-memory storage in server.js
// This file is kept for future database integration

class Campaign {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.status = data.status;
    this.type = data.type;
    this.createdBy = data.createdBy;
    this.audioFileId = data.audioFileId;
    this.contactListId = data.contactListId;
    this.ivrFlow = data.ivrFlow;
    this.schedule = data.schedule;
    this.config = data.config;
    this.stats = data.stats;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

module.exports = Campaign;