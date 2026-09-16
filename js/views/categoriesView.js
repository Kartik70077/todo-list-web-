/**
 * TaskFlow Pro - Categories View
 */

const CategoriesView = (function () {
  function render(container, callbacks = {}) {
    const { categories } = State.get();

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:800;">Manage Categories</h3>
            <p class="text-sm text-muted">Organize your tasks into structured buckets.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="createCategoryBtn">
            <i data-lucide="plus"></i> Add Category
          </button>
        </div>

        <div class="management-grid" id="categoriesGrid">
          ${
            categories.length === 0
              ? `
                <div class="empty-state-box" style="grid-column: 1 / -1;">
                  <div class="empty-icon-circle"><i data-lucide="folder-plus"></i></div>
                  <h3 class="empty-title">No categories yet</h3>
                  <p class="empty-desc">Create your first category to group your tasks.</p>
                </div>
              `
              : categories.map(cat => `
                <div class="manage-card" data-id="${cat.id}">
                  <div class="manage-card-left">
                    <span class="category-chip" style="background-color: ${cat.color};"></span>
                    <div>
                      <div class="manage-card-name">${cat.name}</div>
                      <div class="manage-card-count">${cat.task_count || 0} task(s)</div>
                    </div>
                  </div>
                  <div style="display:flex; gap:0.25rem;">
                    <button class="btn-icon edit-cat-btn" title="Edit Category"><i data-lucide="edit-2"></i></button>
                    <button class="btn-icon delete-cat-btn text-danger" title="Delete Category"><i data-lucide="trash-2"></i></button>
                  </div>
                </div>
              `).join('')
          }
        </div>
      </div>
    `;

    // Events
    const createBtn = container.querySelector('#createCategoryBtn');
    if (createBtn && callbacks.onCreateCategory) {
      createBtn.onclick = () => callbacks.onCreateCategory();
    }

    const cards = container.querySelectorAll('.manage-card');
    cards.forEach(card => {
      const id = card.dataset.id;
      const cat = categories.find(c => c.id === id);

      const editBtn = card.querySelector('.edit-cat-btn');
      if (editBtn && callbacks.onEditCategory) {
        editBtn.onclick = () => callbacks.onEditCategory(cat);
      }

      const delBtn = card.querySelector('.delete-cat-btn');
      if (delBtn && callbacks.onDeleteCategory) {
        delBtn.onclick = () => callbacks.onDeleteCategory(cat);
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  return { render };
})();
