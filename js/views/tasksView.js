/**
 * TaskFlow Pro - Premium Tasks View (My Tasks, Today, Upcoming, Completed)
 */

const TasksView = (function () {
  
  function formatDueDateDisplay(dateString) {
    if (!dateString) return null;
    const [y, m, d] = dateString.split('-');
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = date < today;
    const isToday = date.getTime() === today.getTime();

    let text = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    if (isToday) text = 'Today';

    return { text, isOverdue, isToday };
  }

  function renderTaskCard(task, callbacks) {
    const isCompleted = task.status === 'completed';
    const dueInfo = formatDueDateDisplay(task.due_date);

    const li = document.createElement('li');
    li.className = `task-card ${isCompleted ? 'completed' : ''}`;
    li.dataset.id = task.id;

    // Badges HTML
    let badgesHtml = '';

    // Status Badge
    badgesHtml += `
      <span class="badge badge-status-${task.status}">
        ${task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
      </span>
    `;

    // Priority Badge
    badgesHtml += `
      <span class="badge badge-priority-${task.priority}">
        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
      </span>
    `;

    // Category Badge
    if (task.category_name) {
      badgesHtml += `
        <span class="badge badge-category" style="color: ${task.category_color};">
          <i data-lucide="folder"></i>
          ${task.category_name}
        </span>
      `;
    }

    // Due Date Badge
    if (dueInfo) {
      const cls = dueInfo.isOverdue && !isCompleted ? 'overdue' : dueInfo.isToday && !isCompleted ? 'today' : '';
      badgesHtml += `
        <span class="badge badge-due-date ${cls}">
          <i data-lucide="calendar"></i>
          ${dueInfo.isOverdue && !isCompleted ? 'Overdue: ' : ''}${dueInfo.text}
        </span>
      `;
    }

    // Tags
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach(tg => {
        badgesHtml += `<span class="tag-pill">#${tg.name}</span>`;
      });
    }

    li.innerHTML = `
      <div class="task-checkbox-wrap">
        <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} aria-label="Toggle task completion" />
      </div>
      <div class="task-body">
        <div class="task-title-row">
          <span class="task-card-title">${task.title}</span>
        </div>
        ${task.description ? `<p class="task-card-desc">${task.description}</p>` : ''}
        <div class="task-badges-row">
          ${badgesHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon edit-task-btn" title="Edit Task" aria-label="Edit Task">
          <i data-lucide="edit-2"></i>
        </button>
        <button class="btn-icon delete-task-btn text-danger" title="Delete Task" aria-label="Delete Task">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    // Events
    const checkbox = li.querySelector('.task-checkbox');
    checkbox.onchange = () => {
      if (callbacks.onToggleTask) callbacks.onToggleTask(task.id);
    };

    const editBtn = li.querySelector('.edit-task-btn');
    editBtn.onclick = () => {
      if (callbacks.onEditTask) callbacks.onEditTask(task);
    };

    const deleteBtn = li.querySelector('.delete-task-btn');
    deleteBtn.onclick = () => {
      if (callbacks.onDeleteTask) callbacks.onDeleteTask(task);
    };

    return li;
  }

  function render(container, viewType = 'tasks', callbacks = {}) {
    const { tasks, categories, tags, filters } = State.get();

    // 1. Render toolbar for "tasks" view
    let toolbarHtml = '';
    if (viewType === 'tasks') {
      toolbarHtml = `
        <div class="filter-toolbar">
          <div class="status-tabs">
            <button class="tab-btn ${filters.status === 'all' ? 'active' : ''}" data-filter-status="all">All</button>
            <button class="tab-btn ${filters.status === 'pending' ? 'active' : ''}" data-filter-status="pending">Pending</button>
            <button class="tab-btn ${filters.status === 'in_progress' ? 'active' : ''}" data-filter-status="in_progress">In Progress</button>
            <button class="tab-btn ${filters.status === 'completed' ? 'active' : ''}" data-filter-status="completed">Completed</button>
          </div>

          <div class="filter-dropdowns">
            <!-- Priority Filter -->
            <select class="filter-select" id="taskPriorityFilter" title="Priority">
              <option value="all" ${filters.priority === 'all' ? 'selected' : ''}>All Priorities</option>
              <option value="high" ${filters.priority === 'high' ? 'selected' : ''}>High Priority</option>
              <option value="medium" ${filters.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
              <option value="low" ${filters.priority === 'low' ? 'selected' : ''}>Low Priority</option>
            </select>

            <!-- Category Filter -->
            <select class="filter-select" id="taskCategoryFilter" title="Category">
              <option value="all" ${filters.categoryId === 'all' ? 'selected' : ''}>All Categories</option>
              ${categories.map(c => `
                <option value="${c.id}" ${filters.categoryId === c.id ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>

            <!-- Tag Filter -->
            <select class="filter-select" id="taskTagFilter" title="Tag">
              <option value="all" ${filters.tagId === 'all' ? 'selected' : ''}>All Tags</option>
              ${tags.map(t => `
                <option value="${t.id}" ${filters.tagId === t.id ? 'selected' : ''}>#${t.name}</option>
              `).join('')}
            </select>

            <!-- Sort Option -->
            <select class="filter-select" id="taskSortSelect" title="Sort by">
              <option value="newest" ${filters.sortBy === 'newest' ? 'selected' : ''}>Newest</option>
              <option value="oldest" ${filters.sortBy === 'oldest' ? 'selected' : ''}>Oldest</option>
              <option value="due_date" ${filters.sortBy === 'due_date' ? 'selected' : ''}>Due Date</option>
              <option value="priority" ${filters.sortBy === 'priority' ? 'selected' : ''}>Priority</option>
              <option value="alphabetical" ${filters.sortBy === 'alphabetical' ? 'selected' : ''}>Alphabetical</option>
            </select>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="tasks-view-wrap">
        ${toolbarHtml}
        <div id="tasksContentContainer"></div>
      </div>
    `;

    const tasksContentContainer = container.querySelector('#tasksContentContainer');

    // Attach Toolbar events if "tasks" view
    if (viewType === 'tasks') {
      const tabBtns = container.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.onclick = () => {
          State.setFilter('status', btn.dataset.filterStatus);
          if (callbacks.onFilterChange) callbacks.onFilterChange();
        };
      });

      const prioritySelect = container.querySelector('#taskPriorityFilter');
      prioritySelect.onchange = (e) => {
        State.setFilter('priority', e.target.value);
        if (callbacks.onFilterChange) callbacks.onFilterChange();
      };

      const categorySelect = container.querySelector('#taskCategoryFilter');
      categorySelect.onchange = (e) => {
        State.setFilter('categoryId', e.target.value);
        if (callbacks.onFilterChange) callbacks.onFilterChange();
      };

      const tagSelect = container.querySelector('#taskTagFilter');
      tagSelect.onchange = (e) => {
        State.setFilter('tagId', e.target.value);
        if (callbacks.onFilterChange) callbacks.onFilterChange();
      };

      const sortSelect = container.querySelector('#taskSortSelect');
      sortSelect.onchange = (e) => {
        State.setFilter('sortBy', e.target.value);
        if (callbacks.onFilterChange) callbacks.onFilterChange();
      };
    }

    // Render based on viewType
    if (viewType === 'upcoming') {
      renderUpcomingView(tasksContentContainer, tasks, callbacks);
    } else if (viewType === 'today') {
      renderTodayView(tasksContentContainer, tasks, callbacks);
    } else if (viewType === 'completed') {
      renderCompletedView(tasksContentContainer, tasks, callbacks);
    } else {
      renderStandardList(tasksContentContainer, tasks, callbacks);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function renderStandardList(container, tasks, callbacks) {
    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon-circle">
            <i data-lucide="clipboard-list"></i>
          </div>
          <h3 class="empty-title">No tasks found</h3>
          <p class="empty-desc">No tasks match your current criteria. Create a new task to get started.</p>
          <button class="btn btn-primary btn-sm" id="emptyCreateTaskBtn">
            <i data-lucide="plus"></i> Add Task
          </button>
        </div>
      `;
      const btn = container.querySelector('#emptyCreateTaskBtn');
      if (btn && callbacks.onCreateTask) btn.onclick = () => callbacks.onCreateTask();
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'tasks-list';
    tasks.forEach(task => ul.appendChild(renderTaskCard(task, callbacks)));
    container.appendChild(ul);
  }

  function renderTodayView(container, tasks, callbacks) {
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'completed');
    const todayTasks = tasks.filter(t => t.due_date === todayStr);

    if (overdueTasks.length === 0 && todayTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon-circle">
            <i data-lucide="calendar-check"></i>
          </div>
          <h3 class="empty-title">All clear for today</h3>
          <p class="empty-desc">You have no pending tasks scheduled for today.</p>
        </div>
      `;
      return;
    }

    if (overdueTasks.length > 0) {
      const section = document.createElement('div');
      section.className = 'task-group-section';
      section.innerHTML = `
        <div class="group-header text-danger">
          <i data-lucide="alert-circle"></i> Overdue (${overdueTasks.length})
        </div>
        <ul class="tasks-list"></ul>
      `;
      const ul = section.querySelector('ul');
      overdueTasks.forEach(t => ul.appendChild(renderTaskCard(t, callbacks)));
      container.appendChild(section);
    }

    if (todayTasks.length > 0) {
      const section = document.createElement('div');
      section.className = 'task-group-section';
      section.innerHTML = `
        <div class="group-header">
          <i data-lucide="calendar"></i> Due Today (${todayTasks.length})
        </div>
        <ul class="tasks-list"></ul>
      `;
      const ul = section.querySelector('ul');
      todayTasks.forEach(t => ul.appendChild(renderTaskCard(t, callbacks)));
      container.appendChild(section);
    }
  }

  function renderUpcomingView(container, tasks, callbacks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const in7Days = new Date(today.getTime() + 7 * 86400000);

    const formatYMD = (d) => d.toISOString().split('T')[0];
    const todayStr = formatYMD(today);
    const tomorrowStr = formatYMD(tomorrow);

    const tomorrowTasks = tasks.filter(t => t.due_date === tomorrowStr);
    const thisWeekTasks = tasks.filter(t => t.due_date && t.due_date > tomorrowStr && t.due_date <= formatYMD(in7Days));
    const laterTasks = tasks.filter(t => t.due_date && t.due_date > formatYMD(in7Days));

    if (tomorrowTasks.length === 0 && thisWeekTasks.length === 0 && laterTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon-circle">
            <i data-lucide="calendar-days"></i>
          </div>
          <h3 class="empty-title">No upcoming tasks scheduled</h3>
          <p class="empty-desc">You don't have any future tasks with due dates. Add due dates when creating tasks to plan ahead.</p>
        </div>
      `;
      return;
    }

    const groups = [
      { title: 'Tomorrow', icon: 'sunrise', tasks: tomorrowTasks },
      { title: 'This Week', icon: 'calendar', tasks: thisWeekTasks },
      { title: 'Later', icon: 'calendar-range', tasks: laterTasks }
    ];

    groups.forEach(g => {
      if (g.tasks.length > 0) {
        const section = document.createElement('div');
        section.className = 'task-group-section';
        section.innerHTML = `
          <div class="group-header">
            <i data-lucide="${g.icon}"></i> ${g.title} (${g.tasks.length})
          </div>
          <ul class="tasks-list"></ul>
        `;
        const ul = section.querySelector('ul');
        g.tasks.forEach(t => ul.appendChild(renderTaskCard(t, callbacks)));
        container.appendChild(section);
      }
    });
  }

  function renderCompletedView(container, tasks, callbacks) {
    const completedTasks = tasks.filter(t => t.status === 'completed');

    if (completedTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon-circle">
            <i data-lucide="check-check"></i>
          </div>
          <h3 class="empty-title">No completed tasks yet</h3>
          <p class="empty-desc">Tasks you check off will appear here for archival and review.</p>
        </div>
      `;
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'tasks-list';
    completedTasks.forEach(task => ul.appendChild(renderTaskCard(task, callbacks)));
    container.appendChild(ul);
  }

  return { render };
})();
