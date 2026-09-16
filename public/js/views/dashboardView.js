/**
 * TaskFlow Pro - Premium Dashboard View
 */

const DashboardView = (function () {
  function render(container, callbacks = {}) {
    const { stats, tasks } = State.get();
    const st = stats || {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      due_today: 0,
      overdue: 0,
      upcoming: 0,
      completionRate: 0,
      priorities: { high: 0, medium: 0, low: 0 },
      categories: [],
    };

    container.innerHTML = `
      <div class="dashboard-grid">
        
        <!-- Focus Banner -->
        <div class="focus-banner">
          <div class="focus-banner-left">
            <i data-lucide="target"></i>
            <div>
              <div class="focus-banner-title">
                ${
                  st.overdue > 0 
                    ? `You have ${st.overdue} overdue task${st.overdue > 1 ? 's' : ''} requiring attention` 
                    : st.due_today > 0 
                    ? `You have ${st.due_today} task${st.due_today > 1 ? 's' : ''} scheduled for today`
                    : 'All caught up! Plan ahead or create a new task.'
                }
              </div>
              <div class="focus-banner-desc">
                ${st.completed} of ${st.total} tasks completed (${st.completionRate}% completion rate)
              </div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="dashViewTasksBtn">
            <span>View Tasks</span>
            <i data-lucide="arrow-right"></i>
          </button>
        </div>

        <!-- 4-Card Metric Grid -->
        <div class="metrics-grid">
          
          <div class="metric-card m-total">
            <div class="metric-header">
              <span class="metric-label">Total</span>
              <i data-lucide="list-todo"></i>
            </div>
            <span class="metric-value">${st.total}</span>
          </div>

          <div class="metric-card m-today">
            <div class="metric-header">
              <span class="metric-label">Due Today</span>
              <i data-lucide="calendar"></i>
            </div>
            <span class="metric-value">${st.due_today}</span>
          </div>

          <div class="metric-card m-overdue">
            <div class="metric-header">
              <span class="metric-label">Overdue</span>
              <i data-lucide="alert-circle"></i>
            </div>
            <span class="metric-value">${st.overdue}</span>
          </div>

          <div class="metric-card m-done">
            <div class="metric-header">
              <span class="metric-label">Completed</span>
              <i data-lucide="check-circle-2"></i>
            </div>
            <span class="metric-value">${st.completed}</span>
          </div>

        </div>

        <!-- 2-Column Analytics & Category Breakdown -->
        <div class="dashboard-columns">
          
          <!-- Left Column: Priority Distribution -->
          <div class="card-panel">
            <div class="panel-header">
              <h3 class="panel-title"><i data-lucide="pie-chart"></i> Priority Distribution</h3>
              <span class="text-sm text-muted">${st.pending + st.in_progress} active</span>
            </div>

            <div class="progress-track">
              <div class="progress-fill" style="width: ${st.completionRate}%"></div>
            </div>

            <div class="breakdown-list">
              <div class="breakdown-item">
                <div class="breakdown-left">
                  <span class="color-dot" style="background-color: var(--accent-rose);"></span>
                  <span>High Priority</span>
                </div>
                <span class="font-bold">${st.priorities.high}</span>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-left">
                  <span class="color-dot" style="background-color: var(--accent-amber);"></span>
                  <span>Medium Priority</span>
                </div>
                <span class="font-bold">${st.priorities.medium}</span>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-left">
                  <span class="color-dot" style="background-color: var(--accent-emerald);"></span>
                  <span>Low Priority</span>
                </div>
                <span class="font-bold">${st.priorities.low}</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Categories Overview -->
          <div class="card-panel">
            <div class="panel-header">
              <h3 class="panel-title"><i data-lucide="folder"></i> Category Activity</h3>
              <button class="btn btn-ghost btn-sm" id="dashManageCategoriesBtn">Manage</button>
            </div>

            <div class="breakdown-list" id="dashCategoryList">
              ${
                st.categories && st.categories.length > 0
                  ? st.categories.map(cat => `
                    <div class="breakdown-item">
                      <div class="breakdown-left">
                        <span class="color-dot" style="background-color: ${cat.color};"></span>
                        <span>${cat.name}</span>
                      </div>
                      <span class="text-muted text-sm">${cat.completed_tasks || 0} / ${cat.total_tasks} done</span>
                    </div>
                  `).join('')
                  : '<div class="text-muted text-sm" style="text-align:center; padding: 1.25rem;">No categories created.</div>'
              }
            </div>
          </div>

        </div>

      </div>
    `;

    // Event listeners
    const viewTasksBtn = container.querySelector('#dashViewTasksBtn');
    if (viewTasksBtn && callbacks.onNavigate) {
      viewTasksBtn.onclick = () => callbacks.onNavigate('tasks');
    }

    const manageCatBtn = container.querySelector('#dashManageCategoriesBtn');
    if (manageCatBtn && callbacks.onNavigate) {
      manageCatBtn.onclick = () => callbacks.onNavigate('categories');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  return { render };
})();
