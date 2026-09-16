const { queryOne, execute, getDb } = require('../../database/db');
const { hashPassword, verifyPassword, generateId, generateRandomToken, hashToken } = require('../utils/security');
const jwt = require('../utils/jwt');

function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Check duplicate email
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.'
      });
    }

    const userId = generateId('usr');
    const passwordHash = hashPassword(password);
    const now = Date.now();

    // Create user
    execute(
      'INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, passwordHash, now, now]
    );

    // Create default categories for the new user
    const defaultCategories = [
      { name: 'General', color: '#4f46e5' },
      { name: 'Work', color: '#0284c7' },
      { name: 'Personal', color: '#16a34a' },
      { name: 'Shopping', color: '#ea580c' }
    ];

    defaultCategories.forEach(cat => {
      const catId = generateId('cat');
      execute(
        'INSERT INTO categories (id, user_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [catId, userId, cat.name, cat.color, now, now]
      );
    });

    const token = jwt.sign({ userId, email, name });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: userId, name, email, created_at: now }
    });
  } catch (err) {
    next(err);
  }
}

function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = queryOne('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?', [email]);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

function getMe(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}

function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const user = queryOne('SELECT id, email FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    
    let resetToken = null;
    if (user) {
      resetToken = generateRandomToken();
      const tokenHash = hashToken(resetToken);
      const tokenId = generateId('rst');
      const now = Date.now();
      const expiresAt = now + 60 * 60 * 1000; // 1 hour validity

      // Invalidate prior unused tokens
      execute('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0', [user.id]);

      execute(
        'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
        [tokenId, user.id, tokenHash, expiresAt, now]
      );
    }

    // Generic safe response to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset token has been generated.',
      // In development/test mode, provide the token in response so user can test the reset flow without real SMTP
      ...(resetToken && { devResetToken: resetToken })
    });
  } catch (err) {
    next(err);
  }
}

function resetPassword(req, res, next) {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match.'
      });
    }

    const tokenHash = hashToken(token);
    const resetRecord = queryOne(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token_hash = ? AND used = 0',
      [tokenHash]
    );

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or already used password reset token.'
      });
    }

    if (Date.now() > resetRecord.expires_at) {
      return res.status(400).json({
        success: false,
        error: 'Password reset token has expired. Please request a new one.'
      });
    }

    // Mark token as used
    execute('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetRecord.id]);

    // Update user password
    const newHash = hashPassword(newPassword);
    execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, Date.now(), resetRecord.user_id]);

    res.json({
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
};
