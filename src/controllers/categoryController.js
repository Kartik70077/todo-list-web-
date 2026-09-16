const { queryAll, queryOne, execute } = require('../../database/db');
const { generateId } = require('../utils/security');

function listCategories(req, res, next) {
  try {
    const userId = req.user.id;
    const categories = queryAll(
      `SELECT c.id, c.name, c.color, c.created_at,
              COUNT(t.id) as task_count
       FROM categories c
       LEFT JOIN todos t ON t.category_id = c.id AND t.user_id = ?
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.name ASC`,
      [userId, userId]
    );

    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
}

function createCategory(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, color } = req.body;

    // Check duplicate category name for this user
    const existing = queryOne('SELECT id FROM categories WHERE user_id = ? AND name = ? COLLATE NOCASE', [userId, name]);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'A category with this name already exists.'
      });
    }

    const catId = generateId('cat');
    const now = Date.now();
    const finalColor = color || '#4f46e5';

    execute(
      'INSERT INTO categories (id, user_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [catId, userId, name, finalColor, now, now]
    );

    const category = queryOne('SELECT id, name, color, created_at FROM categories WHERE id = ?', [catId]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: { ...category, task_count: 0 }
    });
  } catch (err) {
    next(err);
  }
}

function updateCategory(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, color } = req.body;

    const existing = queryOne('SELECT id FROM categories WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or unauthorized.'
      });
    }

    // Check duplicate name
    if (name) {
      const duplicate = queryOne(
        'SELECT id FROM categories WHERE user_id = ? AND name = ? COLLATE NOCASE AND id != ?',
        [userId, name, id]
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: 'Another category with this name already exists.'
        });
      }
    }

    const now = Date.now();
    if (name && color) {
      execute('UPDATE categories SET name = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?', [name, color, now, id, userId]);
    } else if (name) {
      execute('UPDATE categories SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?', [name, now, id, userId]);
    } else if (color) {
      execute('UPDATE categories SET color = ?, updated_at = ? WHERE id = ? AND user_id = ?', [color, now, id, userId]);
    }

    const updated = queryOne('SELECT id, name, color, created_at FROM categories WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Category updated successfully.',
      category: updated
    });
  } catch (err) {
    next(err);
  }
}

function deleteCategory(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const category = queryOne('SELECT id, name FROM categories WHERE id = ? AND user_id = ?', [id, userId]);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or unauthorized.'
      });
    }

    // Todos associated will have category_id set to NULL due to ON DELETE SET NULL foreign key
    execute('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
