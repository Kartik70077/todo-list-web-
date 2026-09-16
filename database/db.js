const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../src/config');

let dbInstance = null;

function getDb(customPath = null) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const targetPath = customPath || config.dbPath;
  const dbDir = path.dirname(targetPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(targetPath);

  // Enable foreign keys and WAL mode for better concurrency and integrity
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Run schema initialization
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

// Helper methods for parameterized execution
function queryAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function queryOne(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(...params) || null;
}

function execute(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

module.exports = {
  getDb,
  queryAll,
  queryOne,
  execute
};
