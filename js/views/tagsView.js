/**
 * TaskFlow Pro - Tags View
 */

const TagsView = (function () {
  function render(container, callbacks = {}) {
    const { tags } = State.get();

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:800;">Manage Tags</h3>
            <p class="text-sm text-muted">Use tags to cross-reference related tasks across categories.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="createTagBtn">
            <i data-lucide="plus"></i> Add Tag
          </button>
        </div>

        <div class="management-grid" id="tagsGrid">
          ${
            tags.length === 0
              ? `
                <div class="empty-state-box" style="grid-column: 1 / -1;">
                  <div class="empty-icon-circle"><i data-lucide="tag"></i></div>
                  <h3 class="empty-title">No tags yet</h3>
                  <p class="empty-desc">Create tags like #urgent, #client, or #backend to tag your tasks.</p>
                </div>
              `
              : tags.map(tag => `
                <div class="manage-card" data-id="${tag.id}">
                  <div class="manage-card-left">
                    <i data-lucide="tag" style="color: var(--primary); width:18px; height:18px;"></i>
                    <div>
                      <div class="manage-card-name">#${tag.name}</div>
                      <div class="manage-card-count">${tag.task_count || 0} task(s)</div>
                    </div>
                  </div>
                  <div>
                    <button class="btn-icon delete-tag-btn text-danger" title="Delete Tag"><i data-lucide="trash-2"></i></button>
                  </div>
                </div>
              `).join('')
          }
        </div>
      </div>
    `;

    // Events
    const createBtn = container.querySelector('#createTagBtn');
    if (createBtn && callbacks.onCreateTag) {
      createBtn.onclick = () => callbacks.onCreateTag();
    }

    const cards = container.querySelectorAll('.manage-card');
    cards.forEach(card => {
      const id = card.dataset.id;
      const tag = tags.find(t => t.id === id);

      const delBtn = card.querySelector('.delete-tag-btn');
      if (delBtn && callbacks.onDeleteTag) {
        delBtn.onclick = () => callbacks.onDeleteTag(tag);
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  return { render };
})();
