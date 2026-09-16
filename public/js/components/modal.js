/**
 * TaskFlow Pro - Modal Dialog Manager
 */

const Modal = (function () {
  // Elements
  const taskModal = document.getElementById('taskModal');
  const taskForm = document.getElementById('taskForm');
  const taskModalTitle = document.getElementById('taskModalTitle');
  const taskFormId = document.getElementById('taskFormId');
  const taskFormTitle = document.getElementById('taskFormTitle');
  const taskFormDescription = document.getElementById('taskFormDescription');
  const taskFormPriority = document.getElementById('taskFormPriority');
  const taskFormStatus = document.getElementById('taskFormStatus');
  const taskFormCategory = document.getElementById('taskFormCategory');
  const taskFormDueDate = document.getElementById('taskFormDueDate');
  const taskFormTagCheckboxes = document.getElementById('taskFormTagCheckboxes');

  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const deleteConfirmMessage = document.getElementById('deleteConfirmMessage');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  const categoryModal = document.getElementById('categoryModal');
  const categoryForm = document.getElementById('categoryForm');
  const categoryFormId = document.getElementById('categoryFormId');
  const categoryFormName = document.getElementById('categoryFormName');
  const categoryFormColor = document.getElementById('categoryFormColor');
  const categoryColorHex = document.getElementById('categoryColorHex');
  const categoryModalTitle = document.getElementById('categoryModalTitle');

  const tagModal = document.getElementById('tagModal');
  const tagForm = document.getElementById('tagForm');
  const tagFormName = document.getElementById('tagFormName');

  let onConfirmDeleteCallback = null;

  function open(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    const firstInput = modalEl.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
    if (window.lucide) window.lucide.createIcons();
  }

  function close(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');
  }

  // Task Modal Handlers
  function populateCategoriesSelect(selectedId = '') {
    const categories = State.get().categories || [];
    taskFormCategory.innerHTML = '<option value="">No Category</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (cat.id === selectedId) opt.selected = true;
      taskFormCategory.appendChild(opt);
    });
  }

  function populateTagCheckboxes(selectedTagIds = []) {
    const tags = State.get().tags || [];
    taskFormTagCheckboxes.innerHTML = '';
    if (tags.length === 0) {
      taskFormTagCheckboxes.innerHTML = '<span class="text-sm text-muted">No tags created yet.</span>';
      return;
    }

    tags.forEach(tag => {
      const label = document.createElement('label');
      label.className = 'tag-checkbox-label';
      const isChecked = selectedTagIds.includes(tag.id);

      label.innerHTML = `
        <input type="checkbox" value="${tag.id}" ${isChecked ? 'checked' : ''} />
        <span>#${tag.name}</span>
      `;
      taskFormTagCheckboxes.appendChild(label);
    });
  }

  function openTaskModal(task = null) {
    taskForm.reset();
    if (task) {
      taskModalTitle.textContent = 'Edit Task';
      taskFormId.value = task.id;
      taskFormTitle.value = task.title;
      taskFormDescription.value = task.description || '';
      taskFormPriority.value = task.priority;
      taskFormStatus.value = task.status;
      taskFormDueDate.value = task.due_date || '';
      populateCategoriesSelect(task.category_id);
      populateTagCheckboxes((task.tags || []).map(t => t.id));
    } else {
      taskModalTitle.textContent = 'Create New Task';
      taskFormId.value = '';
      taskFormPriority.value = 'medium';
      taskFormStatus.value = 'pending';
      taskFormDueDate.value = '';
      populateCategoriesSelect();
      populateTagCheckboxes();
    }
    open(taskModal);
  }

  function openDeleteConfirm(message, onConfirm) {
    deleteConfirmMessage.textContent = message || 'Are you sure you want to delete this item?';
    onConfirmDeleteCallback = onConfirm;
    open(deleteConfirmModal);
  }

  function openCategoryModal(category = null) {
    categoryForm.reset();
    if (category) {
      categoryModalTitle.textContent = 'Edit Category';
      categoryFormId.value = category.id;
      categoryFormName.value = category.name;
      categoryFormColor.value = category.color || '#4f46e5';
      categoryColorHex.textContent = category.color || '#4f46e5';
    } else {
      categoryModalTitle.textContent = 'Add Category';
      categoryFormId.value = '';
      categoryFormColor.value = '#4f46e5';
      categoryColorHex.textContent = '#4f46e5';
    }
    open(categoryModal);
  }

  function openTagModal() {
    tagForm.reset();
    open(tagModal);
  }

  function setupEvents(callbacks = {}) {
    // Task modal close
    document.getElementById('closeTaskModalBtn').onclick = () => close(taskModal);
    document.getElementById('cancelTaskModalBtn').onclick = () => close(taskModal);

    // Delete modal close & confirm
    document.getElementById('closeDeleteModalBtn').onclick = () => close(deleteConfirmModal);
    document.getElementById('cancelDeleteBtn').onclick = () => close(deleteConfirmModal);
    confirmDeleteBtn.onclick = async () => {
      if (typeof onConfirmDeleteCallback === 'function') {
        await onConfirmDeleteCallback();
      }
      close(deleteConfirmModal);
    };

    // Category modal
    document.getElementById('closeCategoryModalBtn').onclick = () => close(categoryModal);
    document.getElementById('cancelCategoryModalBtn').onclick = () => close(categoryModal);
    categoryFormColor.oninput = (e) => {
      categoryColorHex.textContent = e.target.value;
    };

    // Tag modal
    document.getElementById('closeTagModalBtn').onclick = () => close(tagModal);
    document.getElementById('cancelTagModalBtn').onclick = () => close(tagModal);

    // Click outside to close
    [taskModal, deleteConfirmModal, categoryModal, tagModal].forEach(m => {
      m.onclick = (e) => {
        if (e.target === m) close(m);
      };
    });

    // Escape key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        [taskModal, deleteConfirmModal, categoryModal, tagModal].forEach(close);
      }
    });

    // Forms submission handlers
    taskForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = taskFormId.value;
      const tagIds = Array.from(taskFormTagCheckboxes.querySelectorAll('input:checked')).map(i => i.value);

      const taskData = {
        title: taskFormTitle.value.trim(),
        description: taskFormDescription.value.trim(),
        priority: taskFormPriority.value,
        status: taskFormStatus.value,
        categoryId: taskFormCategory.value || null,
        dueDate: taskFormDueDate.value || null,
        tagIds,
      };

      if (callbacks.onSaveTask) {
        const success = await callbacks.onSaveTask(id, taskData);
        if (success) close(taskModal);
      }
    };

    categoryForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = categoryFormId.value;
      const data = {
        name: categoryFormName.value.trim(),
        color: categoryFormColor.value,
      };
      if (callbacks.onSaveCategory) {
        const success = await callbacks.onSaveCategory(id, data);
        if (success) close(categoryModal);
      }
    };

    tagForm.onsubmit = async (e) => {
      e.preventDefault();
      const data = { name: tagFormName.value.trim() };
      if (callbacks.onSaveTag) {
        const success = await callbacks.onSaveTag(data);
        if (success) close(tagModal);
      }
    };
  }

  return {
    openTaskModal,
    openDeleteConfirm,
    openCategoryModal,
    openTagModal,
    setupEvents,
  };
})();
