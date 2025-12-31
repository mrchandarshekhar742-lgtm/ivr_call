const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DTMFLog = sequelize.define('DTMFLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  callLogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'call_logs',
      key: 'id'
    }
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'campaigns',
      key: 'id'
    }
  },
  dtmf: {
    type: DataTypes.JSON,
    defaultValue: {
      digit: '',
      timestamp: new Date(),
      duration: 0,
      confidence: 1.0
    }
  },
  context: {
    type: DataTypes.JSON,
    defaultValue: {
      timeFromCallStart: 0,
      promptCount: 0
    }
  },
  processing: {
    type: DataTypes.JSON,
    defaultValue: {
      isValid: false,
      processingTime: 0
    }
  },
  provider: {
    type: DataTypes.JSON,
    defaultValue: {
      name: 'mock',
      rawEvent: {}
    }
  },
  analytics: {
    type: DataTypes.JSON,
    defaultValue: {
      isFirstAttempt: true,
      sequenceNumber: 1
    }
  },
  quality: {
    type: DataTypes.JSON,
    defaultValue: {
      clarity: 1.0
    }
  }
}, {
  tableName: 'dtmf_logs',
  indexes: [
    {
      fields: ['callLogId']
    },
    {
      fields: ['campaignId']
    },
    {
      fields: ['dtmf.digit']
    },
    {
      fields: ['dtmf.timestamp']
    }
  ]
});

module.exports = DTMFLog;