'use strict';

const config = require('../config/app');

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  
  if (config.app.env === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      url: req.originalUrl,
      method: req.method,
    });
  }

  
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors ? err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    })) : [];

    return res.status(400).json({
      success: false,
      message: 'Validation error.',
      errors,
    });
  }

  
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Validation error.',
      errors: err.array(),
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.app.env === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
