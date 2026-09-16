const crypto = require('node:crypto');

const SCRYPT_KEYLEN = 64;

/**
 * Hash a plain text password using scrypt with a unique random salt
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a plain text password against a stored hashed password using constant-time comparison
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

/**
 * Generate a cryptographically secure random ID
 */
function generateId(prefix = '') {
  const randomStr = crypto.randomBytes(12).toString('hex');
  return prefix ? `${prefix}_${randomStr}` : randomStr;
}

/**
 * Generate a cryptographically secure random token (e.g. for password resets)
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a reset token for safe storage in the database
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateId,
  generateRandomToken,
  hashToken
};
