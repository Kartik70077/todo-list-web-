/**
 * TaskFlow Pro - Client-Side Storage & API Service (Pure Frontend / Vercel Ready)
 * Persists all tasks, categories, tags, profile, and stats in browser localStorage.
 */

const API = (function () {
  const STORAGE_KEY_TASKS = 'taskflow_pro_tasks_v2';
  const STORAGE_KEY_CATEGORIES = 'taskflow_pro_categories_v2';
  const STORAGE_KEY_TAGS = 'taskflow_pro_tags_v2';
  const STORAGE_KEY_USER = 'taskflow_pro_user_v2';
  const STORAGE_KEY_TOKEN = 'taskflow_pro_token_v2';

  // Default Seed Data
  const DEFAULT_USER = {
    id: 'usr_demo_123',
    name: 'Alex Morgan',
    email: 'demo@taskflow.dev',
    created_at: Date.now() - 30 * 86400000
  };

  const DEFAULT_CATEGORIES = [
    { id: 'cat_1', name: 'Work', color: '#0284c7', created_at: Date.now() - 20 * 86400000 },
    { id: 'cat_2', name: 'Personal', color: '#16a34a', created_at: Date.now() - 20 * 86400000 },
    { id: 'cat_3', name: 'Study', color: '#7c3aed', created_at: Date.now() - 20 * 86400000 },
    { id: 'cat_4', name: 'Health', color: '#db2777', created_at: Date.now() - 20 * 86400000 },
    { id: 'cat_5', name: 'Shopping', color: '#ea580c', created_at: Date.now() - 20 * 86400000 }
  ];

  const DEFAULT_TAGS = [
    { id: 'tag_1', name: 'urgent', created_at: Date.now() - 20 * 86400000 },
    { id: 'tag_2', name: 'client', created_at: Date.now() - 20 * 86400000 },
    { id: 'tag_3', name: 'project', created_at: Date.now() - 20 * 86400000 },
    { id: 'tag_4', name: 'bug', created_at: Date.now() - 20 * 86400000 },
    { id: 'tag_5', name: 'routine', created_at: Date.now() - 20 * 86400000 }
  ];

  function getFormatYMD(d) {
    return d.toISOString().split('T')[0];
  }

  function getInitialTasks() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    const tomorrow = new Date(today.getTime() + 86400000);
    const in4Days = new Date(today.getTime() + 4 * 86400000);

    return [
      {
        id: 'tdo_1',
        title: 'Review executive presentation slides and system roadmap',
        description: 'Prepare talking points on quarterly infrastructure scaling.',
        status: 'pending',
        priority: 'high',
        due_date: getFormatYMD(today),
        category_id: 'cat_1',
        category_name: 'Work',
        category_color: '#0284c7',
        tags: [{ id: 'tag_1', name: 'urgent' }, { id: 'tag_3', name: 'project' }],
        completed_at: null,
        created_at: Date.now() - 3600000,
        updated_at: Date.now() - 3600000
      },
      {
        id: 'tdo_2',
        title: 'Fix responsive navigation layout on mobile viewports',
        description: 'Ensure touch targets and dropdown menus collapse smoothly.',
        status: 'in_progress',
        priority: 'high',
        due_date: getFormatYMD(today),
        category_id: 'cat_1',
        category_name: 'Work',
        category_color: '#0284c7',
        tags: [{ id: 'tag_1', name: 'urgent' }, { id: 'tag_4', name: 'bug' }],
        completed_at: null,
        created_at: Date.now() - 7200000,
        updated_at: Date.now() - 7200000
      },
      {
        id: 'tdo_3',
        title: 'Submit quarterly health insurance receipts',
        description: 'Upload pharmacy claim receipts to portal.',
        status: 'pending',
        priority: 'medium',
        due_date: getFormatYMD(yesterday), // Overdue
        category_id: 'cat_4',
        category_name: 'Health',
        category_color: '#db2777',
        tags: [{ id: 'tag_5', name: 'routine' }],
        completed_at: null,
        created_at: Date.now() - 86400000,
        updated_at: Date.now() - 86400000
      },
      {
        id: 'tdo_4',
        title: 'Complete Chapter 4 of System Design Architecture',
        description: 'Focus on distributed consensus, Raft, and data replication.',
        status: 'in_progress',
        priority: 'medium',
        due_date: getFormatYMD(tomorrow),
        category_id: 'cat_3',
        category_name: 'Study',
        category_color: '#7c3aed',
        tags: [{ id: 'tag_3', name: 'project' }],
        completed_at: null,
        created_at: Date.now() - 14400000,
        updated_at: Date.now() - 14400000
      },
      {
        id: 'tdo_5',
        title: 'Buy groceries: espresso beans, almond milk, organic oats',
        description: 'Stop by local market on Saturday.',
        status: 'pending',
        priority: 'low',
        due_date: getFormatYMD(in4Days),
        category_id: 'cat_5',
        category_name: 'Shopping',
        category_color: '#ea580c',
        tags: [{ id: 'tag_5', name: 'routine' }],
        completed_at: null,
        created_at: Date.now() - 28800000,
        updated_at: Date.now() - 28800000
      },
      {
        id: 'tdo_6',
        title: 'Setup automated CI/CD pipeline and static deployment',
        description: 'Configured automated tests and deployment workflow.',
        status: 'completed',
        priority: 'high',
        due_date: getFormatYMD(yesterday),
        category_id: 'cat_1',
        category_name: 'Work',
        category_color: '#0284c7',
        tags: [{ id: 'tag_3', name: 'project' }],
        completed_at: Date.now() - 3600000,
        created_at: Date.now() - 86400000,
        updated_at: Date.now() - 3600000
      }
    ];
  }

  // LocalStorage Helpers
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

  // Initialize store if empty
  if (!localStorage.getItem(STORAGE_KEY_CATEGORIES)) {
    save(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
  }
  if (!localStorage.getItem(STORAGE_KEY_TAGS)) {
    save(STORAGE_KEY_TAGS, DEFAULT_TAGS);
  }
  if (!localStorage.getItem(STORAGE_KEY_TASKS)) {
    save(STORAGE_KEY_TASKS, getInitialTasks());
  }
  if (!localStorage.getItem(STORAGE_KEY_USER)) {
    save(STORAGE_KEY_USER, DEFAULT_USER);
  }
  if (!localStorage.getItem(STORAGE_KEY_TOKEN)) {
    save(STORAGE_KEY_TOKEN, 'local_jwt_session_token_alex_morgan');
  }

  // Token management
  function getToken() {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }

  // In-Memory operations simulating REST API endpoints
  function handleGet(endpoint, params) {
    const categories = load(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
    const tags = load(STORAGE_KEY_TAGS, DEFAULT_TAGS);
    const tasks = load(STORAGE_KEY_TASKS, []);
    const user = load(STORAGE_KEY_USER, DEFAULT_USER);

    // /auth/me
    if (endpoint === '/auth/me' || endpoint === '/users/profile') {
      return { success: true, user };
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
    const categories = load(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
    const tags = load(STORAGE_KEY_TAGS, DEFAULT_TAGS);
    const tasks = load(STORAGE_KEY_TASKS, []);

    // /auth/login
    if (endpoint === '/auth/login') {
      const user = load(STORAGE_KEY_USER, DEFAULT_USER);
      const token = 'session_' + Date.now();
      setToken(token);
      return { success: true, message: 'Login successful', token, user };
    }

    // /auth/register
    if (endpoint === '/auth/register') {
      const user = {
        id: 'usr_' + Date.now(),
        name: body.name || 'Alex Morgan',
        email: body.email || 'user@taskflow.dev',
        created_at: Date.now()
      };
      save(STORAGE_KEY_USER, user);
      const token = 'session_' + Date.now();
      setToken(token);
      return { success: true, message: 'Account created', token, user };
    }

    // /auth/forgot-password
    if (endpoint === '/auth/forgot-password') {
      return {
        success: true,
        message: 'Password reset token generated.',
        devResetToken: 'reset_token_' + Math.random().toString(36).substring(2, 9)
      };
    }

    // /auth/reset-password
    if (endpoint === '/auth/reset-password') {
      return { success: true, message: 'Password has been reset successfully.' };
    }

    // /users/change-password
    if (endpoint === '/users/change-password') {
      return { success: true, message: 'Password updated successfully.' };
    }

    // /categories
    if (endpoint === '/categories') {
      const newCat = {
        id: 'cat_' + Date.now(),
        name: body.name.trim(),
        color: body.color || '#4f46e5',
        created_at: Date.now()
      };
      categories.push(newCat);
      save(STORAGE_KEY_CATEGORIES, categories);
      return { success: true, message: 'Category created', category: newCat };
    }

    // /tags
    if (endpoint === '/tags') {
      const newTag = {
        id: 'tag_' + Date.now(),
        name: body.name.trim().toLowerCase(),
        created_at: Date.now()
      };
      tags.push(newTag);
      save(STORAGE_KEY_TAGS, tags);
      return { success: true, message: 'Tag created', tag: newTag };
    }

    // /todos
    if (endpoint === '/todos') {
      const cat = categories.find(c => c.id === body.categoryId);
      const selectedTags = (body.tagIds || [])
        .map(id => tags.find(t => t.id === id))
        .filter(Boolean);

      const newTodo = {
        id: 'tdo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: body.title.trim(),
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
      return { success: true, message: 'Task created', todo: newTodo };
    }

    return { success: true };
  }

  function handlePut(endpoint, body = {}) {
    const categories = load(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
    const tags = load(STORAGE_KEY_TAGS, DEFAULT_TAGS);
    const tasks = load(STORAGE_KEY_TASKS, []);

    // /users/profile
    if (endpoint === '/users/profile') {
      const user = load(STORAGE_KEY_USER, DEFAULT_USER);
      user.name = body.name || user.name;
      save(STORAGE_KEY_USER, user);
      return { success: true, message: 'Profile updated', user };
    }

    // /categories/:id
    if (endpoint.startsWith('/categories/')) {
      const id = endpoint.split('/')[2];
      const idx = categories.findIndex(c => c.id === id);
      if (idx !== -1) {
        if (body.name) categories[idx].name = body.name;
        if (body.color) categories[idx].color = body.color;
        save(STORAGE_KEY_CATEGORIES, categories);

        // Update task category labels
        tasks.forEach(t => {
          if (t.category_id === id) {
            if (body.name) t.category_name = body.name;
            if (body.color) t.category_color = body.color;
          }
        });
        save(STORAGE_KEY_TASKS, tasks);
        return { success: true, message: 'Category updated', category: categories[idx] };
      }
    }

    // /todos/:id
    if (endpoint.startsWith('/todos/')) {
      const id = endpoint.split('/')[2];
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        const cat = categories.find(c => c.id === body.categoryId);
        const selectedTags = (body.tagIds || [])
          .map(tid => tags.find(t => t.id === tid))
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
        return { success: true, message: 'Task updated', todo: tasks[idx] };
      }
    }

    return { success: true };
  }

  function handlePatch(endpoint) {
    const tasks = load(STORAGE_KEY_TASKS, []);

    // /todos/:id/toggle
    if (endpoint.startsWith('/todos/') && endpoint.endsWith('/toggle')) {
      const id = endpoint.split('/')[2];
      const task = tasks.find(t => t.id === id);
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
    const categories = load(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
    const tags = load(STORAGE_KEY_TAGS, DEFAULT_TAGS);
    const tasks = load(STORAGE_KEY_TASKS, []);

    // /todos/:id
    if (endpoint.startsWith('/todos/')) {
      const id = endpoint.split('/')[2];
      const filtered = tasks.filter(t => t.id !== id);
      save(STORAGE_KEY_TASKS, filtered);
      return { success: true, message: 'Task deleted' };
    }

    // /categories/:id
    if (endpoint.startsWith('/categories/')) {
      const id = endpoint.split('/')[2];
      const filtered = categories.filter(c => c.id !== id);
      save(STORAGE_KEY_CATEGORIES, filtered);
      // Remove category from associated tasks
      tasks.forEach(t => {
        if (t.category_id === id) {
          t.category_id = null;
          t.category_name = null;
          t.category_color = null;
        }
      });
      save(STORAGE_KEY_TASKS, tasks);
      return { success: true, message: 'Category deleted' };
    }

    // /tags/:id
    if (endpoint.startsWith('/tags/')) {
      const id = endpoint.split('/')[2];
      const filtered = tags.filter(t => t.id !== id);
      save(STORAGE_KEY_TAGS, filtered);
      // Remove tag from tasks
      tasks.forEach(t => {
        if (t.tags) {
          t.tags = t.tags.filter(tg => tg.id !== id);
        }
      });
      save(STORAGE_KEY_TASKS, tasks);
      return { success: true, message: 'Tag deleted' };
    }

    return { success: true };
  }

  // Promise wrapper to maintain async API compatibility
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
