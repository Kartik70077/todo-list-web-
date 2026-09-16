/**
 * TaskFlow - Modern Todo Application
 * Core JavaScript Logic
 */

(function () {
  'use strict';

  // --- State ---
  const STORAGE_KEY = 'taskflow_todos_v1';
  const THEME_KEY = 'taskflow_theme_pref';

  let tasks = [];
  let currentFilter = 'all'; // 'all' | 'active' | 'completed'
  let currentCategory = 'all';
  let searchQuery = '';
  let lastDeletedTask = null;
  let undoTimeout = null;

  // --- Initial Sample Tasks for first-time visitors ---
  const DEFAULT_TASKS = [
    {
      id: 'task-1',
      title: 'Welcome to TaskFlow! 🎉',
      completed: false,
      priority: 'high',
      category: 'General',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'task-2',
      title: 'Try checking this task off or editing it ✏️',
      completed: true,
      priority: 'medium',
      category: 'Work',
      dueDate: '',
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'task-3',
      title: 'Toggle dark mode using the icon at the top right 🌙',
      completed: false,
      priority: 'low',
      category: 'Personal',
      dueDate: '',
      createdAt: Date.now() - 10800000,
    },
  ];

  // --- DOM Elements ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const currentDateText = document.getElementById('currentDateText');

  // Stats
  const progressSummary = document.getElementById('progressSummary');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  const totalTasksCount = document.getElementById('totalTasksCount');
  const pendingTasksCount = document.getElementById('pendingTasksCount');
  const completedTasksCount = document.getElementById('completedTasksCount');

  // Form Inputs
  const addTaskForm = document.getElementById('addTaskForm');
  const taskInput = document.getElementById('taskInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const categorySelect = document.getElementById('categorySelect');
  const dueDateInput = document.getElementById('dueDateInput');

  // Filters & Search
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const categoryFilter = document.getElementById('categoryFilter');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');

  // Task List & Empty State
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  const emptyStateTitle = document.getElementById('emptyStateTitle');
  const emptyStateDesc = document.getElementById('emptyStateDesc');

  // Modal Elements
  const editModal = document.getElementById('editModal');
  const editTaskForm = document.getElementById('editTaskForm');
  const editTaskId = document.getElementById('editTaskId');
  const editTaskTitle = document.getElementById('editTaskTitle');
  const editPrioritySelect = document.getElementById('editPrioritySelect');
  const editCategorySelect = document.getElementById('editCategorySelect');
  const editDueDateInput = document.getElementById('editDueDateInput');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // --- Helper Functions ---
  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        tasks = JSON.parse(stored);
      } else {
        tasks = [...DEFAULT_TASKS];
        saveToLocalStorage();
      }
    } catch (err) {
      console.error('Failed to load tasks from localStorage:', err);
      tasks = [...DEFAULT_TASKS];
    }
  }

  function formatDateHeader() {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date().toLocaleDateString(undefined, options);
    currentDateText.textContent = today;
  }

  function formatDueDate(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = date < today;
    const isToday = date.getTime() === today.getTime();

    let display = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (isToday) display = 'Today';

    return { display, isOverdue };
  }

  function renderLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function showToast(message, actionLabel = null, onAction = null) {
    // Clear any existing toasts
    toastContainer.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'toast';

    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    if (actionLabel && onAction) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-undo-btn';
      actionBtn.textContent = actionLabel;
      actionBtn.addEventListener('click', () => {
        onAction();
        toast.remove();
      });
      toast.appendChild(actionBtn);
    }

    toastContainer.appendChild(toast);

    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 4500);
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    renderLucideIcons();
  }

  // --- Task CRUD Operations ---
  function addTask(title, priority, category, dueDate) {
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: title.trim(),
      completed: false,
      priority: priority || 'medium',
      category: category || 'General',
      dueDate: dueDate || '',
      createdAt: Date.now(),
    };

    tasks.unshift(newTask);
    saveToLocalStorage();
    renderTasks();
    showToast('Task added successfully!');
  }

  function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveToLocalStorage();
      renderTasks();
    }
  }

  function deleteTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      lastDeletedTask = { task: tasks[taskIndex], index: taskIndex };
      tasks.splice(taskIndex, 1);
      saveToLocalStorage();
      renderTasks();

      showToast('Task deleted', 'Undo', () => {
        if (lastDeletedTask) {
          tasks.splice(lastDeletedTask.index, 0, lastDeletedTask.task);
          saveToLocalStorage();
          renderTasks();
          lastDeletedTask = null;
          showToast('Task restored');
        }
      });
    }
  }

  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editTaskId.value = task.id;
    editTaskTitle.value = task.title;
    editPrioritySelect.value = task.priority;
    editCategorySelect.value = task.category;
    editDueDateInput.value = task.dueDate || '';

    editModal.classList.add('active');
    editModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => editTaskTitle.focus(), 100);
  }

  function closeEditModal() {
    editModal.classList.remove('active');
    editModal.setAttribute('aria-hidden', 'true');
    editTaskForm.reset();
  }

  function saveEditedTask(e) {
    e.preventDefault();
    const id = editTaskId.value;
    const title = editTaskTitle.value.trim();
    if (!title) return;

    const task = tasks.find(t => t.id === id);
    if (task) {
      task.title = title;
      task.priority = editPrioritySelect.value;
      task.category = editCategorySelect.value;
      task.dueDate = editDueDateInput.value;
      saveToLocalStorage();
      renderTasks();
      closeEditModal();
      showToast('Task updated');
    }
  }

  function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear.');
      return;
    }

    const removed = tasks.filter(t => t.completed);
    tasks = tasks.filter(t => !t.completed);
    saveToLocalStorage();
    renderTasks();

    showToast(`Cleared ${completedCount} completed task(s)`);
  }

  // --- Rendering ---
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalTasksCount.textContent = total;
    pendingTasksCount.textContent = pending;
    completedTasksCount.textContent = completed;
    progressSummary.textContent = `${completed} of ${total} completed`;
    progressPercent.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;
  }

  function getFilteredTasks() {
    return tasks.filter(task => {
      // Status filter
      if (currentFilter === 'active' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;

      // Category filter
      if (currentCategory !== 'all' && task.category !== currentCategory) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesCategory = task.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory) return false;
      }

      return true;
    });
  }

  function renderTasks() {
    updateStats();

    const filtered = getFilteredTasks();
    taskList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.add('active');
      if (searchQuery) {
        emptyStateTitle.textContent = 'No matching tasks';
        emptyStateDesc.textContent = `No results found for "${searchQuery}".`;
      } else if (currentFilter === 'completed') {
        emptyStateTitle.textContent = 'No completed tasks';
        emptyStateDesc.textContent = 'Finish some tasks to see them listed here!';
      } else if (currentFilter === 'active') {
        emptyStateTitle.textContent = 'No active tasks';
        emptyStateDesc.textContent = 'All caught up! Great job.';
      } else if (currentCategory !== 'all') {
        emptyStateTitle.textContent = `No ${currentCategory} tasks`;
        emptyStateDesc.textContent = `Add a task under the ${currentCategory} category.`;
      } else {
        emptyStateTitle.textContent = 'No tasks yet';
        emptyStateDesc.textContent = 'Add your first task above to get started!';
      }
    } else {
      emptyState.classList.remove('active');

      filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        // Checkbox wrapper
        const checkWrap = document.createElement('div');
        checkWrap.className = 'task-checkbox-wrap';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'active' : 'complete'}`);
        checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
        checkWrap.appendChild(checkbox);

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'task-content';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'task-title';
        titleDiv.textContent = task.title;
        contentDiv.appendChild(titleDiv);

        // Badges container
        const badgesDiv = document.createElement('div');
        badgesDiv.className = 'task-badges';

        // Priority badge
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `badge badge-priority-${task.priority}`;
        const priorityIcon = task.priority === 'high' ? 'alert-circle' : task.priority === 'medium' ? 'flag' : 'check';
        priorityBadge.innerHTML = `<i data-lucide="${priorityIcon}"></i> ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`;
        badgesDiv.appendChild(priorityBadge);

        // Category badge
        if (task.category) {
          const categoryBadge = document.createElement('span');
          categoryBadge.className = 'badge badge-category';
          categoryBadge.innerHTML = `<i data-lucide="tag"></i> ${task.category}`;
          badgesDiv.appendChild(categoryBadge);
        }

        // Due date badge
        if (task.dueDate) {
          const dueInfo = formatDueDate(task.dueDate);
          if (dueInfo) {
            const dueDateBadge = document.createElement('span');
            dueDateBadge.className = `badge badge-due-date ${dueInfo.isOverdue && !task.completed ? 'overdue' : ''}`;
            dueDateBadge.innerHTML = `<i data-lucide="calendar"></i> ${dueInfo.isOverdue && !task.completed ? 'Overdue: ' : ''}${dueInfo.display}`;
            badgesDiv.appendChild(dueDateBadge);
          }
        }

        contentDiv.appendChild(badgesDiv);

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.title = 'Edit task';
        editBtn.innerHTML = '<i data-lucide="edit-2"></i>';
        editBtn.addEventListener('click', () => openEditModal(task.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.title = 'Delete task';
        deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(checkWrap);
        li.appendChild(contentDiv);
        li.appendChild(actionsDiv);

        taskList.appendChild(li);
      });
    }

    renderLucideIcons();
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Form submission
    addTaskForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = taskInput.value.trim();
      if (!title) return;

      const priority = prioritySelect.value;
      const category = categorySelect.value;
      const dueDate = dueDateInput.value;

      addTask(title, priority, category, dueDate);

      taskInput.value = '';
      dueDateInput.value = '';
      prioritySelect.value = 'medium';
      categorySelect.value = 'General';
      taskInput.focus();
    });

    // Search input
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
      renderTasks();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      renderTasks();
    });

    // Filter tabs
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
      });
    });

    // Category filter dropdown
    categoryFilter.addEventListener('change', e => {
      currentCategory = e.target.value;
      renderTasks();
    });

    // Clear completed button
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Modal Events
    editTaskForm.addEventListener('submit', saveEditedTask);
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelModalBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', e => {
      if (e.target === editModal) closeEditModal();
    });

    // Keyboard shortcuts (Escape closes modal)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && editModal.classList.contains('active')) {
        closeEditModal();
      }
    });
  }

  // --- Initialization ---
  function init() {
    initTheme();
    formatDateHeader();
    loadFromLocalStorage();
    setupEventListeners();
    renderTasks();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
