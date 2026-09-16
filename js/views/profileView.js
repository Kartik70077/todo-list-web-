/**
 * TaskFlow Pro - Profile & Settings View
 */

const ProfileView = (function () {
  function render(container, callbacks = {}) {
    const { user } = State.get();

    container.innerHTML = `
      <div class="settings-grid">
        
        <!-- Profile Details Card -->
        <div class="settings-card">
          <h3 class="settings-card-title"><i data-lucide="user"></i> Profile Information</h3>
          <form id="profileUpdateForm" style="display:flex; flex-direction:column; gap:1.15rem;">
            <div class="form-group">
              <label for="profileNameInput">Full Name</label>
              <input type="text" id="profileNameInput" value="${user ? user.name : ''}" required />
            </div>

            <div class="form-group">
              <label for="profileEmailInput">Email Address</label>
              <input type="email" id="profileEmailInput" value="${user ? user.email : ''}" disabled style="opacity:0.75; cursor:not-allowed;" />
              <span class="text-sm text-muted">Email address cannot be modified directly for security reasons.</span>
            </div>

            <button type="submit" class="btn btn-primary" id="saveProfileBtn">
              <i data-lucide="save"></i> Save Profile
            </button>
          </form>
        </div>

        <!-- Change Password Card -->
        <div class="settings-card">
          <h3 class="settings-card-title"><i data-lucide="lock"></i> Change Password</h3>
          <form id="changePasswordForm" style="display:flex; flex-direction:column; gap:1.15rem;">
            <div class="form-group">
              <label for="currentPasswordInput">Current Password</label>
              <input type="password" id="currentPasswordInput" placeholder="••••••••" required />
            </div>

            <div class="form-group">
              <label for="newPasswordInput">New Password (min 8 chars)</label>
              <input type="password" id="newPasswordInput" placeholder="••••••••" required minlength="8" />
            </div>

            <div class="form-group">
              <label for="confirmNewPasswordInput">Confirm New Password</label>
              <input type="password" id="confirmNewPasswordInput" placeholder="••••••••" required minlength="8" />
            </div>

            <button type="submit" class="btn btn-primary" id="changePassBtn">
              <i data-lucide="shield-check"></i> Update Password
            </button>
          </form>
        </div>

      </div>
    `;

    // Events
    const profileForm = container.querySelector('#profileUpdateForm');
    profileForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = container.querySelector('#profileNameInput').value.trim();
      if (callbacks.onUpdateProfile) {
        await callbacks.onUpdateProfile(name);
      }
    };

    const passForm = container.querySelector('#changePasswordForm');
    passForm.onsubmit = async (e) => {
      e.preventDefault();
      const currentPassword = container.querySelector('#currentPasswordInput').value;
      const newPassword = container.querySelector('#newPasswordInput').value;
      const confirmPassword = container.querySelector('#confirmNewPasswordInput').value;

      if (newPassword !== confirmPassword) {
        Toast.error('New passwords do not match.');
        return;
      }

      if (callbacks.onChangePassword) {
        const success = await callbacks.onChangePassword(currentPassword, newPassword, confirmPassword);
        if (success) passForm.reset();
      }
    };

    if (window.lucide) window.lucide.createIcons();
  }

  return { render };
})();
