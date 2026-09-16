/**
 * TaskFlow Pro - Authentication View
 */

const AuthView = (function () {
  const authContainer = document.getElementById('authContainer');
  const mainAppContainer = document.getElementById('mainAppContainer');
  const authSubtitle = document.getElementById('authSubtitle');

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');
  const resetForm = document.getElementById('resetForm');

  const goToRegisterBtn = document.getElementById('goToRegisterBtn');
  const goToLoginBtn = document.getElementById('goToLoginBtn');
  const goToForgotBtn = document.getElementById('goToForgotBtn');
  const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');
  const backToLoginFromReset = document.getElementById('backToLoginFromReset');

  function showForm(formEl, subtitle) {
    [loginForm, registerForm, forgotForm, resetForm].forEach(f => f.classList.remove('active'));
    formEl.classList.add('active');
    if (subtitle) authSubtitle.textContent = subtitle;
    const firstInput = formEl.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  function init(onLoginSuccess) {
    // Switch forms
    goToRegisterBtn.onclick = () => showForm(registerForm, 'Create your account to start managing tasks');
    goToLoginBtn.onclick = () => showForm(loginForm, 'Sign in to organize your tasks effortlessly');
    goToForgotBtn.onclick = () => showForm(forgotForm, 'Recover your account password');
    backToLoginFromForgot.onclick = () => showForm(loginForm, 'Sign in to organize your tasks effortlessly');
    backToLoginFromReset.onclick = () => showForm(loginForm, 'Sign in to organize your tasks effortlessly');

    // 1. Handle Login
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = document.getElementById('loginSubmitBtn');

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Signing In...</span>';

        const res = await API.post('/auth/login', { email, password });
        API.setToken(res.token);
        State.setUser(res.user);
        Toast.success(`Welcome back, ${res.user.name}!`);
        onLoginSuccess();
      } catch (err) {
        Toast.error(err.message || 'Login failed.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right"></i>';
        if (window.lucide) window.lucide.createIcons();
      }
    };

    // 2. Handle Register
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;
      const submitBtn = document.getElementById('registerSubmitBtn');

      if (password !== confirmPassword) {
        Toast.error('Passwords do not match.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Creating Account...</span>';

        const res = await API.post('/auth/register', { name, email, password, confirmPassword });
        API.setToken(res.token);
        State.setUser(res.user);
        Toast.success('Account created successfully!');
        onLoginSuccess();
      } catch (err) {
        Toast.error(err.message || 'Registration failed.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span><i data-lucide="user-plus"></i>';
        if (window.lucide) window.lucide.createIcons();
      }
    };

    // 3. Handle Forgot Password
    forgotForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();
      const submitBtn = document.getElementById('forgotSubmitBtn');

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Processing...</span>';

        const res = await API.post('/auth/forgot-password', { email });
        Toast.info(res.message);

        // In development/testing, if devResetToken is provided, auto-switch to Reset Password form
        if (res.devResetToken) {
          document.getElementById('resetTokenInput').value = res.devResetToken;
          showForm(resetForm, 'Enter new password for your account');
          Toast.success('Development reset token automatically loaded!');
        } else {
          showForm(loginForm, 'Sign in with your credentials');
        }
      } catch (err) {
        Toast.error(err.message || 'Password reset request failed.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send Reset Token</span><i data-lucide="send"></i>';
        if (window.lucide) window.lucide.createIcons();
      }
    };

    // 4. Handle Reset Password
    resetForm.onsubmit = async (e) => {
      e.preventDefault();
      const token = document.getElementById('resetTokenInput').value.trim();
      const newPassword = document.getElementById('resetNewPassword').value;
      const confirmPassword = document.getElementById('resetConfirmPassword').value;
      const submitBtn = document.getElementById('resetSubmitBtn');

      if (newPassword !== confirmPassword) {
        Toast.error('Passwords do not match.');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Updating...</span>';

        const res = await API.post('/auth/reset-password', { token, newPassword, confirmPassword });
        Toast.success(res.message);
        showForm(loginForm, 'Sign in with your new password');
      } catch (err) {
        Toast.error(err.message || 'Failed to reset password.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Update Password</span><i data-lucide="check"></i>';
        if (window.lucide) window.lucide.createIcons();
      }
    };
  }

  function show() {
    authContainer.style.display = 'flex';
    mainAppContainer.style.display = 'none';
    showForm(loginForm, 'Sign in to organize your tasks effortlessly');
    if (window.lucide) window.lucide.createIcons();
  }

  function hide() {
    authContainer.style.display = 'none';
    mainAppContainer.style.display = 'flex';
  }

  return {
    init,
    show,
    hide,
  };
})();
