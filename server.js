const app = require('./src/app');
const config = require('./src/config');
const { getDb } = require('./database/db');

// Initialize database schema
getDb();

const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 TaskFlow Pro Server running at: http://localhost:${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🗄️  Database: ${config.dbPath}`);
  console.log('====================================================');
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down TaskFlow Pro...');
  server.close(() => {
    console.log('Server closed. Goodbye!');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Closing server...');
  server.close(() => {
    process.exit(0);
  });
});
