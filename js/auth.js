// === AUTH MODULE ===

let currentUser = null;
let currentProfile = null;

// Toggle password visibility
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword
    ? `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/></svg>`
    : `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>`;
}

// Show a specific auth page
function showPage(pageId) {
  document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
  // Clear alerts
  document.querySelectorAll('.alert').forEach(a => a.classList.add('hidden'));
}

// Handle login
async function handleLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const errorEl = document.getElementById('login-error');

  if (!email || !password) {
    showAlert(errorEl, 'Completá todos los campos.');
    return;
  }

  setButtonLoading('login-page', true);

  try {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    await loadUserProfile(data.user);
    enterApp();
  } catch (err) {
    showAlert(errorEl, getAuthError(err.message));
  } finally {
    setButtonLoading('login-page', false);
  }
}

// Handle register
async function handleRegister() {
  const name = document.getElementById('reg-name')?.value?.trim();
  const email = document.getElementById('reg-email')?.value?.trim();
  const password = document.getElementById('reg-password')?.value;
  const errorEl = document.getElementById('register-error');
  const successEl = document.getElementById('register-success');

  if (!name || !email || !password) {
    showAlert(errorEl, 'Completá todos los campos.');
    return;
  }
  if (password.length < 6) {
    showAlert(errorEl, 'La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  setButtonLoading('register-page', true);

  try {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw error;

    // Create profile
    if (data.user) {
      await dbUpsertProfile({
        id: data.user.id,
        email,
        full_name: name,
        role: VASA_CONFIG.roles.USER
      });
    }

    showAlert(successEl, '¡Cuenta creada! Revisá tu correo para confirmar tu cuenta.');
    errorEl.classList.add('hidden');
    setTimeout(() => showPage('login-page'), 2500);
  } catch (err) {
    showAlert(errorEl, getAuthError(err.message));
  } finally {
    setButtonLoading('register-page', false);
  }
}

// Handle forgot password
async function handleForgotPassword() {
  const email = document.getElementById('forgot-email')?.value?.trim();
  const errorEl = document.getElementById('forgot-error');
  const successEl = document.getElementById('forgot-success');

  if (!email) {
    showAlert(errorEl, 'Ingresá tu correo electrónico.');
    return;
  }

  setButtonLoading('forgot-page', true);

  try {
    const sb = getSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) throw error;
    showAlert(successEl, '¡Enlace enviado! Revisá tu correo.');
    errorEl.classList.add('hidden');
  } catch (err) {
    showAlert(errorEl, getAuthError(err.message));
  } finally {
    setButtonLoading('forgot-page', false);
  }
}

// Logout
async function logout() {
  try {
    const sb = getSupabase();
    await sb.auth.signOut();
  } catch (e) {}
  currentUser = null;
  currentProfile = null;
  showAuthSection();
  showPage('login-page');
  showToast('Sesión cerrada', 'info');
}

// Load user profile from DB
async function loadUserProfile(user) {
  currentUser = user;
  try {
    currentProfile = await dbGetProfile(user.id);
  } catch {
    // Profile might not exist yet - create minimal one
    currentProfile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      role: VASA_CONFIG.roles.USER
    };
    await dbUpsertProfile(currentProfile);
  }
}

// Get translated auth errors
function getAuthError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Confirmá tu correo antes de ingresar.';
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese correo.';
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('network')) return 'Error de conexión. Intentá nuevamente.';
  return 'Ocurrió un error. Intentá nuevamente.';
}

// Show alert helper
function showAlert(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

// Set button loading state
function setButtonLoading(pageId, loading) {
  const page = document.getElementById(pageId);
  if (!page) return;
  const btn = page.querySelector('.btn-primary');
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn._originalHTML = btn.innerHTML;
    btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0;border-width:2px"></div>';
  } else if (btn._originalHTML) {
    btn.innerHTML = btn._originalHTML;
  }
}
