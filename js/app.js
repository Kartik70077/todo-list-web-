/**
 * TaskFlow Pro - Main Application Coordinator
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'taskflow_pro_theme';

  // DOM Elements
  const appSidebar = document.getElementById('appSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');

  const currentViewTitle = document.getElementById('currentViewTitle');
  const currentViewSubtitle = document.getElementById('currentViewSubtitle');
  const viewContainer = document.getElementById('viewContainer');

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const globalSearchInput = document.getElementById('globalSearchInput');
  const clearGlobalSearchBtn = document.getElementById('clearGlobalSearchBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const headerProfileBtn = document.getElementById('headerProfileBtn');
  const quickCreateTaskBtn = document.getElementById('quickCreateTaskBtn');

  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
  const headerUserAvatar = document.getElementById('headerUserAvatar');

  const navTasksCount = document.getElementById('navTasksCount');
  const navTodayCount = document.getElementById('navTodayCount');
  const navUpcomingCount = document.getElementById('navUpcomingCount');
  const navCompletedCount = document.getElementById('navCompletedCount');

  // --- Theme Management ---
  function initTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    if (window.lucide) window.lucide.createIcons();
  }

  // --- Mobile Sidebar Drawer ---
  function openSidebar() {
    appSidebar.classList.add('open');
    sidebarBackdrop.classList.add('active');
  }

  function closeSidebar() {
    appSidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('active');
  }

  // --- Navigation & View Titles ---
  const VIEW_META = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your productivity and upcoming tasks' },
    tasks: { title: 'My Tasks', subtitle: 'View, filter, sort, and manage all your tasks' },
    today: { title: 'Today', subtitle: 'Focus on tasks scheduled or overdue for today' },
    upcoming: { title: 'Upcoming', subtitle: 'Plan ahead for upcoming deadlines and milestones' },
    completed: { title: 'Completed Tasks', subtitle: 'Archive and review your completed achievements' },
    categories: { title: 'Categories', subtitle: 'Organize your tasks into dedicated category buckets' },
    tags: { title: 'Tags', subtitle: 'Manage cross-category tags to connect related tasks' },
    settings: { title: 'Settings', subtitle: 'Manage your account details and security preferences' },
  };

  function updateActiveNav(view) {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    navLinks.forEach(link => {
      if (link.dataset.view === view) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const meta = VIEW_META[view] || VIEW_META.dashboard;
    currentViewTitle.textContent = meta.title;
    currentViewSubtitle.textContent = meta.subtitle;
  }

  function navigateTo(view) {
    State.setView(view);
    updateActiveNav(view);
    closeSidebar();
    window.location.hash = view;
    renderCurrentView();
  }

  // --- Data Loading ---
  async function loadAllData() {
    try {
      const filters = State.get().filters;
      const currentView = State.get().currentView;

      const params = {};
      if (currentView === 'tasks') {
        if (filters.status !== 'all') params.status = filters.status;
        if (filters.priority !== 'all') params.priority = filters.priority;
        if (filters.categoryId !== 'all') params.categoryId = filters.categoryId;
        if (filters.tagId !== 'all') params.tagId = filters.tagId;
        if (filters.sortBy) params.sortBy = filters.sortBy;
      }
      if (filters.search) params.search = filters.search;

      const [todosRes, categoriesRes, tagsRes, statsRes] = await Promise.all([
        API.get('/todos', params),
        API.get('/categories'),
        API.get('/tags'),
        API.get('/stats'),
      ]);

      State.setTasks(todosRes.todos || []);
      State.setCategories(categoriesRes.categories || []);
      State.setTags(tagsRes.tags || []);
      State.setStats(statsRes.stats || null);

      updateSidebarCounts(statsRes.stats);
      renderCurrentView();
    } catch (err) {
      console.error('Error loading application data:', err);
    }
  }

  function updateSidebarCounts(stats) {
    if (!stats) return;
    navTasksCount.textContent = stats.pending + stats.in_progress;
    navTodayCount.textContent = stats.due_today + stats.overdue;
    navUpcomingCount.textContent = stats.upcoming;
    navCompletedCount.textContent = stats.completed;
  }

  function updateUserProfileUI(user) {
    if (!user) return;
    const initials = user.name
      .split(' ')
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    sidebarUserName.textContent = user.name;
    sidebarUserEmail.textContent = user.email;
    sidebarUserAvatar.textContent = initials;
    headerUserAvatar.textContent = initials;
  }

  // --- Render Active View ---
  function renderCurrentView() {
    const view = State.get().currentView;
    viewContainer.innerHTML = '';

    const callbacks = {
      onNavigate: navigateTo,
      onFilterChange: () => loadAllData(),
      onCreateTask: () => Modal.openTaskModal(),
      onEditTask: (task) => Modal.openTaskModal(task),
      onDeleteTask: (task) => {
        Modal.openDeleteConfirm(`Are you sure you want to delete "${task.title}"?`, async () => {
          try {
            await API.delete(`/todos/${task.id}`);
            Toast.success('Task deleted.');
            await loadAllData();
          } catch (err) {
            Toast.error(err.message || 'Failed to delete task.');
          }
        });
      },
      onToggleTask: async (id) => {
        try {
          const res = await API.patch(`/todos/${id}/toggle`);
          Toast.success(res.message);
          await loadAllData();
        } catch (err) {
          Toast.error(err.message || 'Failed to update task.');
        }
      },
      onCreateCategory: () => Modal.openCategoryModal(),
      onEditCategory: (cat) => Modal.openCategoryModal(cat),
      onDeleteCategory: (cat) => {
        Modal.openDeleteConfirm(`Delete category "${cat.name}"? Tasks in this category will become uncategorized.`, async () => {
          try {
            await API.delete(`/categories/${cat.id}`);
            Toast.success('Category deleted.');
            await loadAllData();
          } catch (err) {
            Toast.error(err.message || 'Failed to delete category.');
          }
        });
      },
      onCreateTag: () => Modal.openTagModal(),
      onDeleteTag: (tag) => {
        Modal.openDeleteConfirm(`Delete tag "#${tag.name}"?`, async () => {
          try {
            await API.delete(`/tags/${tag.id}`);
            Toast.success('Tag deleted.');
            await loadAllData();
          } catch (err) {
            Toast.error(err.message || 'Failed to delete tag.');
          }
        });
      },
      onUpdateProfile: async (name) => {
        try {
          const res = await API.put('/users/profile', { name });
          State.setUser({ ...State.get().user, name: res.user.name });
          updateUserProfileUI(State.get().user);
          Toast.success('Profile updated.');
        } catch (err) {
          Toast.error(err.message || 'Failed to update profile.');
        }
      },
      onChangePassword: async (currentPassword, newPassword, confirmPassword) => {
        try {
          const res = await API.post('/users/change-password', { currentPassword, newPassword, confirmPassword });
          Toast.success(res.message);
          return true;
        } catch (err) {
          Toast.error(err.message || 'Failed to change password.');
          return false;
        }
      },
    };

    if (view === 'dashboard') {
      DashboardView.render(viewContainer, callbacks);
    } else if (['tasks', 'today', 'upcoming', 'completed'].includes(view)) {
      TasksView.render(viewContainer, view, callbacks);
    } else if (view === 'categories') {
      CategoriesView.render(viewContainer, callbacks);
    } else if (view === 'tags') {
      TagsView.render(viewContainer, callbacks);
    } else if (view === 'settings') {
      ProfileView.render(viewContainer, callbacks);
    }
  }

  // --- Modal Operations Callbacks ---
  function initModals() {
    Modal.setupEvents({
      onSaveTask: async (id, taskData) => {
        try {
          if (id) {
            await API.put(`/todos/${id}`, taskData);
            Toast.success('Task updated.');
          } else {
            await API.post('/todos', taskData);
            Toast.success('Task created.');
          }
          await loadAllData();
          return true;
        } catch (err) {
          Toast.error(err.message || 'Failed to save task.');
          return false;
        }
      },
      onSaveCategory: async (id, data) => {
        try {
          if (id) {
            await API.put(`/categories/${id}`, data);
            Toast.success('Category updated.');
          } else {
            await API.post('/categories', data);
            Toast.success('Category created.');
          }
          await loadAllData();
          return true;
        } catch (err) {
          Toast.error(err.message || 'Failed to save category.');
          return false;
        }
      },
      onSaveTag: async (data) => {
        try {
          await API.post('/tags', data);
          Toast.success('Tag created.');
          await loadAllData();
          return true;
        } catch (err) {
          Toast.error(err.message || 'Failed to create tag.');
          return false;
        }
      },
    });
  }

  // --- Keyboard Shortcuts & Event Listeners ---
  function setupEventListeners() {
    // Theme toggle
    themeToggleBtn.onclick = toggleTheme;

    // Mobile sidebar toggle
    openSidebarBtn.onclick = openSidebar;
    closeSidebarBtn.onclick = closeSidebar;
    sidebarBackdrop.onclick = closeSidebar;

    // Quick create task
    quickCreateTaskBtn.onclick = () => Modal.openTaskModal();

    // Global keyboard shortcuts (Ctrl+K for search, N for new task)
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = ['input', 'textarea', 'select'].includes(activeTag);

      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        globalSearchInput.focus();
        globalSearchInput.select();
      }

      // 'N' to create new task when not typing inside an input
      if (!isInput && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        Modal.openTaskModal();
      }
    });

    // Sidebar navigation clicks
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    navLinks.forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        navigateTo(link.dataset.view);
      };
    });

    // Profile button in top header
    headerProfileBtn.onclick = () => navigateTo('settings');

    // Global Search
    let searchTimeout = null;
    globalSearchInput.oninput = (e) => {
      const query = e.target.value.trim();
      clearGlobalSearchBtn.style.display = query ? 'flex' : 'none';
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        State.setFilter('search', query);
        loadAllData();
      }, 200);
    };

    clearGlobalSearchBtn.onclick = () => {
      globalSearchInput.value = '';
      clearGlobalSearchBtn.style.display = 'none';
      State.setFilter('search', '');
      loadAllData();
    };

    // Logout
    logoutBtn.onclick = () => {
      API.setToken(null);
      State.setUser(null);
      Toast.info('Signed out.');
      AuthView.show();
    };

    // Listen for unauthorized 401 event
    window.addEventListener('auth:unauthorized', () => {
      Toast.error('Session expired. Please sign in again.');
      AuthView.show();
    });

    // Hash change event (Browser Back/Forward)
    window.onhashchange = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      if (VIEW_META[hash] && State.get().currentView !== hash) {
        navigateTo(hash);
      }
    };
  }

  // --- Bootstrapping App ---
  async function boot() {
    initTheme();
    setupEventListeners();
    initModals();

    AuthView.init(async () => {
      AuthView.hide();
      updateUserProfileUI(State.get().user);
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      navigateTo(hash);
      await loadAllData();
    });

    const token = API.getToken();
    if (token) {
      try {
        const res = await API.get('/auth/me');
        State.setUser(res.user);
        updateUserProfileUI(res.user);
        AuthView.hide();
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        navigateTo(hash);
        await loadAllData();
      } catch (err) {
        API.setToken(null);
        AuthView.show();
      }
    } else {
      AuthView.show();
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
