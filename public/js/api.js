/**
 * TaskFlow Pro - Client-Side Storage & API Service (Pure Frontend / Vercel Ready)
 * Provides real multi-user authentication, validation, session management, and per-user data persistence in localStorage.
 */

const API = (function () {
  // Purge any legacy sessions across all devices
  const LEGACY_KEYS = [
    'taskflow_auth_token',
    'taskflow_pro_token_v2',
    'taskflow_pro_user_v2',
    'taskflow_session_token_v3',
    'taskflow_current_user_v3',
    'taskflow_todos_v1'
  ];
  try {
    LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
  } catch (e) {}

  const STORAGE_KEY_USERS = 'taskflow_users_db_v4';
  const STORAGE_KEY_CURRENT_USER = 'taskflow_current_user_v4';
  const STORAGE_KEY_TOKEN = 'taskflow_session_token_v4';
  const STORAGE_KEY_TASKS = 'taskflow_tasks_v4';
  const STORAGE_KEY_CATEGORIES = 'taskflow_categories_v4';
  const STORAGE_KEY_TAGS = 'taskflow_tags_v4';
  const STORAGE_KEY_RESET_TOKENS = 'taskflow_reset_tokens_v4';

  function getFormatYMD(d) {
    return d.toISOString().split('T')[0];
  }

  // Storage Helpers
  function load(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // Initialize empty users store if not existing
  if (!localStorage.getItem(STORAGE_KEY_USERS)) {
    save(STORAGE_KEY_USERS, []);
  }

  // Session Token management (Starts empty - NO auto login!)
  function getToken() {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }

  function getCurrentUser() {
    return load(STORAGE_KEY_CURRENT_USER, null);
  }

  function requireAuth() {
    const user = getCurrentUser();
    const token = getToken();
    if (!token || !user) {
      setToken(null);
      const err = new Error('Authentication required. Please sign in.');
      err.status = 401;
      throw err;
    }
    return user;
  }

  // In-Memory operations simulating REST API endpoints with full validation
  function handleGet(endpoint, params) {
    // /auth/me
    if (endpoint === '/auth/me') {
      const user = requireAuth();
      return { success: true, user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at } };
    }

    const user = requireAuth();
    const categories = load(STORAGE_KEY_CATEGORIES, []).filter(c => c.user_id === user.id);
    const tags = load(STORAGE_KEY_TAGS, []).filter(tg => tg.user_id === user.id);
    const allTasks = load(STORAGE_KEY_TASKS, []);
    const tasks = allTasks.filter(t => t.user_id === user.id);

    // /users/profile
    if (endpoint === '/users/profile') {
      return { success: true, user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at } };
    }

    // /categories
    if (endpoint === '/categories') {
      const catsWithCount = categories.map(c => ({
        ...c,
        task_count: tasks.filter(t => t.category_id === c.id).length
      }));
      return { success: true, categories: catsWithCount };
    }

    // /tags
    if (endpoint === '/tags') {
      const tagsWithCount = tags.map(tg => ({
        ...tg,
        task_count: tasks.filter(t => (t.tags || []).some(item => item.id === tg.id)).length
      }));
      return { success: true, tags: tagsWithCount };
    }

    // /stats
    if (endpoint === '/stats') {
      const todayStr = getFormatYMD(new Date());
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const pending = tasks.filter(t => t.status === 'pending').length;
      const in_progress = tasks.filter(t => t.status === 'in_progress').length;
      const due_today = tasks.filter(t => t.due_date === todayStr && t.status !== 'completed').length;
      const overdue = tasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'completed').length;
      const upcoming = tasks.filter(t => t.due_date && t.due_date > todayStr && t.status !== 'completed').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const priorityCounts = {
        high: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
        medium: tasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length,
        low: tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length
      };

      const catStats = categories.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        total_tasks: tasks.filter(t => t.category_id === c.id).length,
        completed_tasks: tasks.filter(t => t.category_id === c.id && t.status === 'completed').length
      }));

      return {
        success: true,
        stats: {
          total,
          pending,
          in_progress,
          completed,
          due_today,
          overdue,
          upcoming,
          completionRate,
          priorities: priorityCounts,
          categories: catStats
        }
      };
    }

    // /todos
    if (endpoint.startsWith('/todos')) {
      let filtered = [...tasks];
      const todayStr = getFormatYMD(new Date());

      if (params) {
        if (params.status && params.status !== 'all') {
          filtered = filtered.filter(t => t.status === params.status);
        }
        if (params.priority && params.priority !== 'all') {
          filtered = filtered.filter(t => t.priority === params.priority);
        }
        if (params.categoryId && params.categoryId !== 'all') {
          filtered = filtered.filter(t => t.category_id === params.categoryId);
        }
        if (params.tagId && params.tagId !== 'all') {
          filtered = filtered.filter(t => (t.tags || []).some(tg => tg.id === params.tagId));
        }
        if (params.due) {
          if (params.due === 'today') filtered = filtered.filter(t => t.due_date === todayStr);
          if (params.due === 'upcoming') filtered = filtered.filter(t => t.due_date && t.due_date > todayStr);
          if (params.due === 'overdue') filtered = filtered.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'completed');
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.tags || []).some(tg => tg.name.toLowerCase().includes(q))
          );
        }

        // Sorting
        const sortBy = params.sortBy || 'newest';
        if (sortBy === 'newest') {
          filtered.sort((a, b) => b.created_at - a.created_at);
        } else if (sortBy === 'oldest') {
          filtered.sort((a, b) => a.created_at - b.created_at);
        } else if (sortBy === 'due_date') {
          filtered.sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return a.due_date.localeCompare(b.due_date);
          });
        } else if (sortBy === 'priority') {
          const rank = { high: 1, medium: 2, low: 3 };
          filtered.sort((a, b) => (rank[a.priority] || 4) - (rank[b.priority] || 4));
        } else if (sortBy === 'alphabetical') {
          filtered.sort((a, b) => a.title.localeCompare(b.title));
        }
      }

      return { success: true, count: filtered.length, todos: filtered };
    }

    return { success: true };
  }

  function handlePost(endpoint, body = {}) {
    const users = load(STORAGE_KEY_USERS, []);

    // 1. /auth/login with strict validation
    if (endpoint === '/auth/login') {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';

      if (!email || !password) {
        const err = new Error('Email and password are required.');
        err.status = 400;
        throw err;
      }

      const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
      if (!user) {
        const err = new Error('Invalid email or password.');
        err.status = 401;
        throw err;
      }

      const safeUser = { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
      const token = 'jwt_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      
      save(STORAGE_KEY_CURRENT_USER, safeUser);
      setToken(token);

      return { success: true, message: 'Login successful!', token, user: safeUser };
    }

    // 2. /auth/register with strict validation
    if (endpoint === '/auth/register') {
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const confirmPassword = body.confirmPassword || '';

      if (!name || name.length < 2) {
        const err = new Error('Name must be at least 2 characters long.');
        err.status = 400;
        throw err;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        const err = new Error('Please enter a valid email address.');
        err.status = 400;
        throw err;
      }

      if (!password || password.length < 8) {
        const err = new Error('Password must be at least 8 characters long.');
        err.status = 400;
        throw err;
      }

      if (password !== confirmPassword) {
        const err = new Error('Password confirmation does not match.');
        err.status = 400;
        throw err;
      }

      // Check duplicate email
      if (users.some(u => u.email.toLowerCase() === email)) {
        const err = new Error('An account with this email already exists.');
        err.status = 409;
        throw err;
      }

      const newUserId = 'usr_' + Date.now();
      const newUser = {
        id: newUserId,
        name,
        email,
        password,
        created_at: Date.now()
      };

      users.push(newUser);
      save(STORAGE_KEY_USERS, users);

      // Create default categories for the new user
      const categories = load(STORAGE_KEY_CATEGORIES, []);
      const userCategories = [
        { id: 'cat_' + Date.now() + '_1', user_id: newUserId, name: 'Work', color: '#0284c7', created_at: Date.now() },
        { id: 'cat_' + Date.now() + '_2', user_id: newUserId, name: 'Personal', color: '#16a34a', created_at: Date.now() },
        { id: 'cat_' + Date.now() + '_3', user_id: newUserId, name: 'General', color: '#4f46e5', created_at: Date.now() }
      ];
      categories.push(...userCategories);
      save(STORAGE_KEY_CATEGORIES, categories);

      const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email, created_at: newUser.created_at };
      const token = 'jwt_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      save(STORAGE_KEY_CURRENT_USER, safeUser);
      setToken(token);

      return { success: true, message: 'Account created successfully!', token, user: safeUser };
    }

    // 3. /auth/forgot-password
    if (endpoint === '/auth/forgot-password') {
      const email = (body.email || '').trim().toLowerCase();
      if (!email) {
        const err = new Error('Email is required.');
        err.status = 400;
        throw err;
      }

      const user = users.find(u => u.email.toLowerCase() === email);
      const resetTokens = load(STORAGE_KEY_RESET_TOKENS, []);
      let devResetToken = null;

      if (user) {
        devResetToken = 'rst_' + Math.random().toString(36).substring(2, 10);
        resetTokens.push({
          token: devResetToken,
          userId: user.id,
          expiresAt: Date.now() + 60 * 60 * 1000
        });
        save(STORAGE_KEY_RESET_TOKENS, resetTokens);
      }

      return {
        success: true,
        message: 'If an account with that email exists, a password reset token has been generated.',
        devResetToken
      };
    }

    // 4. /auth/reset-password
    if (endpoint === '/auth/reset-password') {
      const token = (body.token || '').trim();
      const newPassword = body.newPassword || '';
      const confirmPassword = body.confirmPassword || '';

      if (!token || !newPassword) {
        const err = new Error('Reset token and new password are required.');
        err.status = 400;
        throw err;
      }

      if (newPassword.length < 8) {
        const err = new Error('Password must be at least 8 characters long.');
        err.status = 400;
        throw err;
      }

      if (newPassword !== confirmPassword) {
        const err = new Error('Passwords do not match.');
        err.status = 400;
        throw err;
      }

      const resetTokens = load(STORAGE_KEY_RESET_TOKENS, []);
      const tokenRecord = resetTokens.find(r => r.token === token && Date.now() <= r.expiresAt);

      if (!tokenRecord) {
        const err = new Error('Invalid or expired password reset token.');
        err.status = 400;
        throw err;
      }

      const userIndex = users.findIndex(u => u.id === tokenRecord.userId);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        save(STORAGE_KEY_USERS, users);
      }

      // Remove used token
      save(STORAGE_KEY_RESET_TOKENS, resetTokens.filter(r => r.token !== token));

      return { success: true, message: 'Password has been successfully reset. You can now sign in.' };
    }

    // Authenticated actions below
    const user = requireAuth();
    const categories = load(STORAGE_KEY_CATEGORIES, []);
    const tags = load(STORAGE_KEY_TAGS, []);
    const tasks = load(STORAGE_KEY_TASKS, []);

    // 5. /users/change-password
    if (endpoint === '/users/change-password') {
      const currentPassword = body.currentPassword || '';
      const newPassword = body.newPassword || '';
      const confirmPassword = body.confirmPassword || '';

      const u = users.find(item => item.id === user.id);
      if (!u || u.password !== currentPassword) {
        const err = new Error('Current password is incorrect.');
        err.status = 400;
        throw err;
      }

      if (newPassword.length < 8) {
        const err = new Error('New password must be at least 8 characters long.');
        err.status = 400;
        throw err;
      }

      if (newPassword !== confirmPassword) {
        const err = new Error('New password confirmation does not match.');
        err.status = 400;
        throw err;
      }

      u.password = newPassword;
      save(STORAGE_KEY_USERS, users);
      return { success: true, message: 'Password updated successfully.' };
    }

    // 6. /categories
    if (endpoint === '/categories') {
      const name = (body.name || '').trim();
      if (!name) {
        const err = new Error('Category name is required.');
        err.status = 400;
        throw err;
      }

      if (categories.some(c => c.user_id === user.id && c.name.toLowerCase() === name.toLowerCase())) {
        const err = new Error('A category with this name already exists.');
        err.status = 409;
        throw err;
      }

      const newCat = {
        id: 'cat_' + Date.now(),
        user_id: user.id,
        name,
        color: body.color || '#4f46e5',
        created_at: Date.now()
      };
      categories.push(newCat);
      save(STORAGE_KEY_CATEGORIES, categories);
      return { success: true, message: 'Category created.', category: newCat };
    }

    // 7. /tags
    if (endpoint === '/tags') {
      const name = (body.name || '').trim().toLowerCase();
      if (!name) {
        const err = new Error('Tag name is required.');
        err.status = 400;
        throw err;
      }

      if (tags.some(t => t.user_id === user.id && t.name.toLowerCase() === name.toLowerCase())) {
        const err = new Error('A tag with this name already exists.');
        err.status = 409;
        throw err;
      }

      const newTag = {
        id: 'tag_' + Date.now(),
        user_id: user.id,
        name,
        created_at: Date.now()
      };
      tags.push(newTag);
      save(STORAGE_KEY_TAGS, tags);
      return { success: true, message: 'Tag created.', tag: newTag };
    }

    // 8. /todos
    if (endpoint === '/todos') {
      const title = (body.title || '').trim();
      if (!title) {
        const err = new Error('Task title is required.');
        err.status = 400;
        throw err;
      }

      const cat = categories.find(c => c.id === body.categoryId && c.user_id === user.id);
      const selectedTags = (body.tagIds || [])
        .map(id => tags.find(t => t.id === id && t.user_id === user.id))
        .filter(Boolean);

      const newTodo = {
        id: 'tdo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        user_id: user.id,
        title,
        description: body.description ? body.description.trim() : '',
        priority: body.priority || 'medium',
        status: body.status || 'pending',
        due_date: body.dueDate || null,
        category_id: body.categoryId || null,
        category_name: cat ? cat.name : null,
        category_color: cat ? cat.color : null,
        tags: selectedTags,
        completed_at: body.status === 'completed' ? Date.now() : null,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      tasks.unshift(newTodo);
      save(STORAGE_KEY_TASKS, tasks);
      return { success: true, message: 'Task created.', todo: newTodo };
    }

    return { success: true };
  }

  function handlePut(endpoint, body = {}) {
    const user = requireAuth();
    const users = load(STORAGE_KEY_USERS, []);
    const categories = load(STORAGE_KEY_CATEGORIES, []);
    const tags = load(STORAGE_KEY_TAGS, []);
    const tasks = load(STORAGE_KEY_TASKS, []);

    // /users/profile
    if (endpoint === '/users/profile') {
      const name = (body.name || '').trim();
      if (!name || name.length < 2) {
        const err = new Error('Name must be at least 2 characters long.');
        err.status = 400;
        throw err;
      }

      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx !== -1) {
        users[uIdx].name = name;
        save(STORAGE_KEY_USERS, users);
      }

      const updatedUser = { ...user, name };
      save(STORAGE_KEY_CURRENT_USER, updatedUser);

      return { success: true, message: 'Profile updated.', user: updatedUser };
    }

    // /categories/:id
    if (endpoint.startsWith('/categories/')) {
      const id = endpoint.split('/')[2];
      const idx = categories.findIndex(c => c.id === id && c.user_id === user.id);
      if (idx !== -1) {
        if (body.name) categories[idx].name = body.name.trim();
        if (body.color) categories[idx].color = body.color;
        save(STORAGE_KEY_CATEGORIES, categories);

        tasks.forEach(t => {
          if (t.category_id === id && t.user_id === user.id) {
            if (body.name) t.category_name = body.name.trim();
            if (body.color) t.category_color = body.color;
          }
        });
        save(STORAGE_KEY_TASKS, tasks);
        return { success: true, message: 'Category updated.', category: categories[idx] };
      }
    }

    // /todos/:id
    if (endpoint.startsWith('/todos/')) {
      const id = endpoint.split('/')[2];
      const idx = tasks.findIndex(t => t.id === id && t.user_id === user.id);
      if (idx !== -1) {
        const cat = categories.find(c => c.id === body.categoryId && c.user_id === user.id);
        const selectedTags = (body.tagIds || [])
          .map(tid => tags.find(t => t.id === tid && t.user_id === user.id))
          .filter(Boolean);

        const current = tasks[idx];
        const isCompleted = body.status === 'completed';

        tasks[idx] = {
          ...current,
          title: body.title !== undefined ? body.title.trim() : current.title,
          description: body.description !== undefined ? body.description.trim() : current.description,
          priority: body.priority || current.priority,
          status: body.status || current.status,
          due_date: body.dueDate !== undefined ? body.dueDate : current.due_date,
          category_id: body.categoryId !== undefined ? body.categoryId : current.category_id,
          category_name: cat ? cat.name : (body.categoryId === null ? null : current.category_name),
          category_color: cat ? cat.color : (body.categoryId === null ? null : current.category_color),
          tags: body.tagIds ? selectedTags : current.tags,
          completed_at: isCompleted ? (current.completed_at || Date.now()) : null,
          updated_at: Date.now()
        };

        save(STORAGE_KEY_TASKS, tasks);
        return { success: true, message: 'Task updated.', todo: tasks[idx] };
      }
    }

    return { success: true };
  }

  function handlePatch(endpoint) {
    const user = requireAuth();
    const tasks = load(STORAGE_KEY_TASKS, []);

    // /todos/:id/toggle
    if (endpoint.startsWith('/todos/') && endpoint.endsWith('/toggle')) {
      const id = endpoint.split('/')[2];
      const task = tasks.find(t => t.id === id && t.user_id === user.id);
      if (task) {
        const isNowCompleted = task.status !== 'completed';
        task.status = isNowCompleted ? 'completed' : 'pending';
        task.completed_at = isNowCompleted ? Date.now() : null;
        task.updated_at = Date.now();
        save(STORAGE_KEY_TASKS, tasks);
        return {
          success: true,
          message: isNowCompleted ? 'Task marked as completed.' : 'Task restored to active.',
          todo: task
        };
      }
    }

    return { success: true };
  }

  function handleDelete(endpoint) {
    const user = requireAuth();
    const categories = load(STORAGE_KEY_CATEGORIES, []);
    const tags = load(STORAGE_KEY_TAGS, []);
    const tasks = load(STORAGE_KEY_TASKS, []);

    // /todos/:id
    if (endpoint.startsWith('/todos/')) {
      const id = endpoint.split('/')[2];
      const filtered = tasks.filter(t => !(t.id === id && t.user_id === user.id));
      save(STORAGE_KEY_TASKS, filtered);
      return { success: true, message: 'Task deleted.' };
    }

    // /categories/:id
    if (endpoint.startsWith('/categories/')) {
      const id = endpoint.split('/')[2];
      const filtered = categories.filter(c => !(c.id === id && c.user_id === user.id));
      save(STORAGE_KEY_CATEGORIES, filtered);
      
      tasks.forEach(t => {
        if (t.category_id === id && t.user_id === user.id) {
          t.category_id = null;
          t.category_name = null;
          t.category_color = null;
        }
      });
      save(STORAGE_KEY_TASKS, tasks);
      return { success: true, message: 'Category deleted.' };
    }

    // /tags/:id
    if (endpoint.startsWith('/tags/')) {
      const id = endpoint.split('/')[2];
      const filtered = tags.filter(t => !(t.id === id && t.user_id === user.id));
      save(STORAGE_KEY_TAGS, filtered);

      tasks.forEach(t => {
        if (t.user_id === user.id && t.tags) {
          t.tags = t.tags.filter(tg => tg.id !== id);
        }
      });
      save(STORAGE_KEY_TASKS, tasks);
      return { success: true, message: 'Tag deleted.' };
    }

    return { success: true };
  }

  return {
    getToken,
    setToken,
    get: async (endpoint, params = null) => handleGet(endpoint, params),
    post: async (endpoint, body) => handlePost(endpoint, body),
    put: async (endpoint, body) => handlePut(endpoint, body),
    patch: async (endpoint, body) => handlePatch(endpoint, body),
    delete: async (endpoint) => handleDelete(endpoint),
  };
})();
