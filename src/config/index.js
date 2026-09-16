const path = require('node:path');
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'taskflow_dev_jwt_secret_change_in_production_key_32bytes',
  jwtExpiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  dbPath: process.env.DB_PATH 
    ? path.resolve(process.cwd(), process.env.DB_PATH) 
    : path.resolve(__dirname, '../../database/taskflow.db'),
  isDev: (process.env.NODE_ENV || 'development') === 'development'
};
