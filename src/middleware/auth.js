const jwt = require('../utils/jwt');
const { queryOne } = require('../../database/db');

function authenticate(req, res, next) {
  let token = null;

  // Check Authorization Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }

  const result = jwt.verify(token);
  if (!result.valid) {
    return res.status(401).json({
      success: false,
      error: result.error === 'Token expired' ? 'Session expired. Please log in again.' : 'Invalid authentication token.'
    });
  }

  // Fetch user from database to ensure account still exists
  const user = queryOne('SELECT id, name, email, created_at FROM users WHERE id = ?', [result.payload.userId]);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User account not found.'
    });
  }

  req.user = user;
  next();
}

module.exports = {
  authenticate
};
