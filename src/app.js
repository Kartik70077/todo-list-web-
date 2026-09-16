const express = require('express');
const path = require('node:path');
const cors = require('cors');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security and middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static frontend files
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

// API routes
app.use('/api', apiRoutes);

// Fallback to SPA index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// 404 handler for API routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
