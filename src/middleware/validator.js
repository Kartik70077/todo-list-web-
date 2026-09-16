function validateRegister(req, res, next) {
  const { name, email, password, confirmPassword } = req.body || {};

  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (password !== confirmPassword) {
    errors.push('Password confirmation does not match.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: errors[0],
      errors
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required.'
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

function validateTodo(req, res, next) {
  const { title, priority, status, dueDate } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Todo title is required.'
    });
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid priority level. Must be low, medium, or high.'
    });
  }

  const validStatuses = ['pending', 'in_progress', 'completed'];
  if (status && !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be pending, in_progress, or completed.'
    });
  }

  if (dueDate) {
    // Check YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dueDate) || isNaN(Date.parse(dueDate))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid due date format. Expected YYYY-MM-DD.'
      });
    }
  }

  req.body.title = title.trim();
  if (req.body.description && typeof req.body.description === 'string') {
    req.body.description = req.body.description.trim();
  } else {
    req.body.description = '';
  }

  next();
}

function validateCategory(req, res, next) {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Category name is required.'
    });
  }
  req.body.name = name.trim();
  next();
}

function validateTag(req, res, next) {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Tag name is required.'
    });
  }
  req.body.name = name.trim().toLowerCase();
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateTodo,
  validateCategory,
  validateTag
};
