const { queryAll, queryOne, execute, getDb } = require('../../database/db');
const { generateId } = require('../utils/security');

// Helper to fetch tags for a list of todo IDs
function attachTagsToTodos(todos) {
  if (!todos || todos.length === 0) return [];
  const todoIds = todos.map(t => t.id);
  const placeholders = todoIds.map(() => '?').join(',');

  const tagRows = queryAll(
    `SELECT tt.todo_id, t.id, t.name
     FROM todo_tags tt
     JOIN tags t ON t.id = tt.tag_id
     WHERE tt.todo_id IN (${placeholders})
     ORDER BY t.name ASC`,
    todoIds
  );

  const tagsByTodo = {};
  tagRows.forEach(row => {
    if (!tagsByTodo[row.todo_id]) {
      tagsByTodo[row.todo_id] = [];
    }
    tagsByTodo[row.todo_id].push({ id: row.id, name: row.name });
  });

  return todos.map(todo => ({
    ...todo,
    tags: tagsByTodo[todo.id] || []
  }));
}

function listTodos(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      status,
      priority,
      categoryId,
      tagId,
      due,
      search,
      sortBy = 'newest',
      sortOrder = 'desc'
    } = req.query;

    const todayStr = new Date().toISOString().split('T')[0];

    let baseSql = `
      SELECT t.id, t.user_id, t.category_id, t.title, t.description,
             t.status, t.priority, t.due_date, t.completed_at,
             t.created_at, t.updated_at,
             c.name as category_name, c.color as category_color
      FROM todos t
      LEFT JOIN categories c ON c.id = t.category_id
    `;

    const whereClauses = ['t.user_id = ?'];
    const params = [userId];

    // Status filter
    if (status && status !== 'all') {
      whereClauses.push('t.status = ?');
      params.push(status);
    }

    // Priority filter
    if (priority && priority !== 'all') {
      whereClauses.push('t.priority = ?');
      params.push(priority);
    }

    // Category filter
    if (categoryId && categoryId !== 'all') {
      if (categoryId === 'uncategorized') {
        whereClauses.push('t.category_id IS NULL');
      } else {
        whereClauses.push('t.category_id = ?');
        params.push(categoryId);
      }
    }

    // Tag filter
    if (tagId && tagId !== 'all') {
      whereClauses.push(`
        EXISTS (
          SELECT 1 FROM todo_tags tt
          WHERE tt.todo_id = t.id AND tt.tag_id = ?
        )
      `);
      params.push(tagId);
    }

    // Due date filter
    if (due) {
      if (due === 'today') {
        whereClauses.push('t.due_date = ?');
        params.push(todayStr);
      } else if (due === 'upcoming') {
        whereClauses.push('t.due_date > ?');
        params.push(todayStr);
      } else if (due === 'overdue') {
        whereClauses.push('t.due_date < ? AND t.status != "completed"');
        params.push(todayStr);
      }
    }

    // Search filter (searches title, description, and tags)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClauses.push(`(
        t.title LIKE ? OR 
        t.description LIKE ? OR 
        EXISTS (
          SELECT 1 FROM todo_tags tt
          JOIN tags tg ON tg.id = tt.tag_id
          WHERE tt.todo_id = t.id AND tg.name LIKE ?
        )
      )`);
      params.push(searchTerm, searchTerm, searchTerm);
    }

    baseSql += ' WHERE ' + whereClauses.join(' AND ');

    // Sorting
    let orderBySql = ' ORDER BY t.created_at DESC';
    const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    if (sortBy === 'newest') {
      orderBySql = ' ORDER BY t.created_at DESC';
    } else if (sortBy === 'oldest') {
      orderBySql = ' ORDER BY t.created_at ASC';
    } else if (sortBy === 'due_date') {
      orderBySql = ' ORDER BY (t.due_date IS NULL), t.due_date ASC, t.created_at DESC';
    } else if (sortBy === 'priority') {
      orderBySql = `
        ORDER BY 
          CASE t.priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
            ELSE 4 
          END ASC, 
          t.created_at DESC
      `;
    } else if (sortBy === 'recently_updated') {
      orderBySql = ' ORDER BY t.updated_at DESC';
    } else if (sortBy === 'alphabetical') {
      orderBySql = ` ORDER BY t.title ${direction}`;
    }

    baseSql += orderBySql;

    const rawTodos = queryAll(baseSql, params);
    const todos = attachTagsToTodos(rawTodos);

    res.json({
      success: true,
      count: todos.length,
      todos
    });
  } catch (err) {
    next(err);
  }
}

function getTodoById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const todo = queryOne(
      `SELECT t.id, t.user_id, t.category_id, t.title, t.description,
              t.status, t.priority, t.due_date, t.completed_at,
              t.created_at, t.updated_at,
              c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ? AND t.user_id = ?`,
      [id, userId]
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found or unauthorized.'
      });
    }

    const [todoWithTags] = attachTagsToTodos([todo]);

    res.json({
      success: true,
      todo: todoWithTags
    });
  } catch (err) {
    next(err);
  }
}

function createTodo(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, description = '', priority = 'medium', status = 'pending', dueDate = null, categoryId = null, tagIds = [] } = req.body;

    // Validate category ownership if provided
    if (categoryId) {
      const cat = queryOne('SELECT id FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
      if (!cat) {
        return res.status(400).json({
          success: false,
          error: 'Specified category does not exist or does not belong to you.'
        });
      }
    }

    const todoId = generateId('tdo');
    const now = Date.now();
    const completedAt = status === 'completed' ? now : null;

    execute(
      `INSERT INTO todos (id, user_id, category_id, title, description, status, priority, due_date, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [todoId, userId, categoryId || null, title, description, status, priority, dueDate || null, completedAt, now, now]
    );

    // Attach tags if provided
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      tagIds.forEach(tagId => {
        // Ensure tag belongs to user
        const tag = queryOne('SELECT id FROM tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (tag) {
          execute('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)', [todoId, tag.id]);
        }
      });
    }

    const newTodo = queryOne(
      `SELECT t.id, t.user_id, t.category_id, t.title, t.description,
              t.status, t.priority, t.due_date, t.completed_at,
              t.created_at, t.updated_at,
              c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ?`,
      [todoId]
    );

    const [todoWithTags] = attachTagsToTodos([newTodo]);

    res.status(201).json({
      success: true,
      message: 'Todo created successfully.',
      todo: todoWithTags
    });
  } catch (err) {
    next(err);
  }
}

function updateTodo(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, priority, status, dueDate, categoryId, tagIds } = req.body;

    const existing = queryOne('SELECT id, status, completed_at FROM todos WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found or unauthorized.'
      });
    }

    // Validate category ownership if updated
    if (categoryId) {
      const cat = queryOne('SELECT id FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
      if (!cat) {
        return res.status(400).json({
          success: false,
          error: 'Specified category does not exist or does not belong to you.'
        });
      }
    }

    const now = Date.now();
    let newCompletedAt = existing.completed_at;

    if (status !== undefined) {
      if (status === 'completed' && existing.status !== 'completed') {
        newCompletedAt = now;
      } else if (status !== 'completed' && existing.status === 'completed') {
        newCompletedAt = null;
      }
    }

    execute(
      `UPDATE todos 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           priority = COALESCE(?, priority),
           status = COALESCE(?, status),
           due_date = ?,
           category_id = ?,
           completed_at = ?,
           updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        title !== undefined ? title : null,
        description !== undefined ? description : null,
        priority !== undefined ? priority : null,
        status !== undefined ? status : null,
        dueDate !== undefined ? (dueDate || null) : existing.due_date,
        categoryId !== undefined ? (categoryId || null) : existing.category_id,
        newCompletedAt,
        now,
        id,
        userId
      ]
    );

    // Update tags if tagIds array was supplied
    if (Array.isArray(tagIds)) {
      execute('DELETE FROM todo_tags WHERE todo_id = ?', [id]);
      tagIds.forEach(tagId => {
        const tag = queryOne('SELECT id FROM tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (tag) {
          execute('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)', [id, tag.id]);
        }
      });
    }

    const updatedTodo = queryOne(
      `SELECT t.id, t.user_id, t.category_id, t.title, t.description,
              t.status, t.priority, t.due_date, t.completed_at,
              t.created_at, t.updated_at,
              c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ?`,
      [id]
    );

    const [todoWithTags] = attachTagsToTodos([updatedTodo]);

    res.json({
      success: true,
      message: 'Todo updated successfully.',
      todo: todoWithTags
    });
  } catch (err) {
    next(err);
  }
}

function toggleComplete(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const todo = queryOne('SELECT id, status FROM todos WHERE id = ? AND user_id = ?', [id, userId]);
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found or unauthorized.'
      });
    }

    const isNowCompleted = todo.status !== 'completed';
    const newStatus = isNowCompleted ? 'completed' : 'pending';
    const completedAt = isNowCompleted ? Date.now() : null;
    const now = Date.now();

    execute(
      'UPDATE todos SET status = ?, completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [newStatus, completedAt, now, id, userId]
    );

    const updated = queryOne(
      `SELECT t.id, t.user_id, t.category_id, t.title, t.description,
              t.status, t.priority, t.due_date, t.completed_at,
              t.created_at, t.updated_at,
              c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ?`,
      [id]
    );

    const [todoWithTags] = attachTagsToTodos([updated]);

    res.json({
      success: true,
      message: isNowCompleted ? 'Task marked as completed.' : 'Task restored to active.',
      todo: todoWithTags
    });
  } catch (err) {
    next(err);
  }
}

function deleteTodo(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const todo = queryOne('SELECT id, title FROM todos WHERE id = ? AND user_id = ?', [id, userId]);
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found or unauthorized.'
      });
    }

    execute('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: `Task "${todo.title}" deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTodos,
  getTodoById,
  createTodo,
  updateTodo,
  toggleComplete,
  deleteTodo
};
