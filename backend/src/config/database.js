const { Sequelize } = require('sequelize');
const { logger } = require('./logger');

// Create Sequelize instance
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'ivr_system',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Test database connection
const connectDB = async () => {
  try {
    // Add timeout to prevent hanging
    const connectionPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 10000);
    });
    
    await Promise.race([connectionPromise, timeoutPromise]);
    logger.info('MySQL database connected successfully');
    
    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }
  } catch (error) {
    logger.error('Unable to connect to MySQL database:', error.message);
    
    if (error.original?.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error('Database connection failed: Access denied');
      logger.error('Please check your MySQL credentials in backend/.env file');
      logger.error('Make sure MySQL is running and the user/password are correct');
    } else if (error.original?.code === 'ECONNREFUSED') {
      logger.error('Database connection failed: Connection refused');
      logger.error('Please make sure MySQL is running on localhost:3306');
    } else if (error.message === 'Database connection timeout') {
      logger.error('Database connection timed out - MySQL may not be running');
    }
    
    // Don't exit in development, just log the error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      logger.warn('Continuing without database connection in development mode');
    }
  }
};

module.exports = { sequelize, connectDB };