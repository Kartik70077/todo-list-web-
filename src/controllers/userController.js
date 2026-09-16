const { queryOne, execute } = require('../../database/db');
const { hashPassword, verifyPassword } = require('../utils/security');

function getProfile(req, res, next) {
  try {
    const user = queryOne('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters long.'
      });
    }

    const trimmedName = name.trim();
    const now = Date.now();
    execute('UPDATE users SET name = ?, updated_at = ? WHERE id = ?', [trimmedName, now, req.user.id]);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: req.user.id,
        name: trimmedName,
        email: req.user.email
      }
    });
  } catch (err) {
    next(err);
  }
}

function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password confirmation does not match.'
      });
    }

    const user = queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect.'
      });
    }

    const newHash = hashPassword(newPassword);
    execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, Date.now(), req.user.id]);

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
