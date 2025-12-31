const { logger } = require('../config/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large', 400, 'FILE_TOO_LARGE');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files', 400, 'TOO_MANY_FILES');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400, 'UNEXPECTED_FILE');
  }
  return new AppError('File upload error', 400, 'UPLOAD_ERROR');
};

const handleTwilioError = (err) => {
  const message = err.message || 'Telephony service error';
  const statusCode = err.status || 500;
  return new AppError(message, statusCode, 'TELEPHONY_ERROR');
};

const handleRedisError = (err) => {
  const message = 'Cache service temporarily unavailable';
  return new AppError(message, 503, 'CACHE_ERROR');
};

// Send error response in development
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  }

  // Rendered website
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code
      });
    }

    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      code: 'INTERNAL_ERROR'
    });
  }

  // Rendered website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);
    if (error.name === 'TwilioError') error = handleTwilioError(error);
    if (error.code === 'ECONNREFUSED' && error.syscall === 'connect') {
      error = handleRedisError(error);
    }

    sendErrorProd(error, req, res);
  }
};

// Catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled routes
const handleNotFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND');
  next(err);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  const formatted = {};
  
  if (errors.array) {
    // express-validator errors
    errors.array().forEach(error => {
      if (!formatted[error.param]) {
        formatted[error.param] = [];
      }
      formatted[error.param].push(error.msg);
    });
  } else if (errors.details) {
    // Joi validation errors
    errors.details.forEach(error => {
      const field = error.path.join('.');
      if (!formatted[field]) {
        formatted[field] = [];
      }
      formatted[field].push(error.message);
    });
  }
  
  return formatted;
};

// Success response helper
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  res.status(statusCode).json(response);
};

// Paginated response helper
const sendPaginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  handleNotFound,
  formatValidationErrors,
  sendSuccess,
  sendPaginatedResponse
};