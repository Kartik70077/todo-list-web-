/**
 * TaskFlow Pro - Reactive State Store
 */

const State = (function () {
  const state = {
    user: null,
    currentView: 'dashboard', // dashboard | tasks | today | upcoming | completed | categories | tags | settings
    tasks: [],
    categories: [],
    tags: [],
    stats: null,
    filters: {
      status: 'all',
      priority: 'all',
      categoryId: 'all',
      tagId: 'all',
      sortBy: 'newest',
      search: '',
    },
  };

  const listeners = new Set();

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify() {
    listeners.forEach(fn => fn(state));
  }

  function setUser(user) {
    state.user = user;
    notify();
  }

  function setView(view) {
    state.currentView = view;
    notify();
  }

  function setTasks(tasks) {
    state.tasks = tasks;
    notify();
  }

  function setCategories(categories) {
    state.categories = categories;
    notify();
  }

  function setTags(tags) {
    state.tags = tags;
    notify();
  }

  function setStats(stats) {
    state.stats = stats;
    notify();
  }

  function setFilter(key, value) {
    state.filters[key] = value;
    notify();
  }

  function resetFilters() {
    state.filters = {
      status: 'all',
      priority: 'all',
      categoryId: 'all',
      tagId: 'all',
      sortBy: 'newest',
      search: '',
    };
    notify();
  }

  return {
    get: () => state,
    subscribe,
    setUser,
    setView,
    setTasks,
    setCategories,
    setTags,
    setStats,
    setFilter,
    resetFilters,
  };
})();
