const { queryAll, queryOne, execute } = require('../../database/db');
const { generateId } = require('../utils/security');

function listTags(req, res, next) {
  try {
    const userId = req.user.id;
    const tags = queryAll(
      `SELECT t.id, t.name, t.created_at,
              COUNT(tt.todo_id) as task_count
       FROM tags t
       LEFT JOIN todo_tags tt ON tt.tag_id = t.id
       LEFT JOIN todos td ON td.id = tt.todo_id AND td.user_id = ?
       WHERE t.user_id = ?
       GROUP BY t.id
       ORDER BY t.name ASC`,
      [userId, userId]
    );

    res.json({ success: true, tags });
  } catch (err) {
    next(err);
  }
}

function createTag(req, res, next) {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const existing = queryOne('SELECT id, name FROM tags WHERE user_id = ? AND name = ? COLLATE NOCASE', [userId, name]);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'A tag with this name already exists.'
      });
    }

    const tagId = generateId('tag');
    const now = Date.now();

    execute(
      'INSERT INTO tags (id, user_id, name, created_at) VALUES (?, ?, ?, ?)',
      [tagId, userId, name, now]
    );

    const tag = queryOne('SELECT id, name, created_at FROM tags WHERE id = ?', [tagId]);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully.',
      tag: { ...tag, task_count: 0 }
    });
  } catch (err) {
    next(err);
  }
}

function deleteTag(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const tag = queryOne('SELECT id, name FROM tags WHERE id = ? AND user_id = ?', [id, userId]);
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found or unauthorized.'
      });
    }

    // ON DELETE CASCADE automatically clears relationships in todo_tags
    execute('DELETE FROM tags WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: `Tag "${tag.name}" deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTags,
  createTag,
  deleteTag
};
