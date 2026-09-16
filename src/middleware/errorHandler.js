const config = require('../config');

function errorHandler(err, req, res, next) {
  // Log internally for debugging
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && !config.isDev 
    ? 'An unexpected error occurred. Please try again later.' 
    : (err.message || 'Internal server error');

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.isDev && { stack: err.stack })
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
