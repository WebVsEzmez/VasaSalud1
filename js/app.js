// === MAIN APP CONTROLLER ===

// ========== INIT ==========
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await initSupabase();
    const sb = getSupabase();

    // Check existing session
    const { data: { session } } = await sb.auth.getSession();

    if (session?.user) {
      await loadUserProfile(session.user);
      enterApp();
    } else {
      showAuthSection();
    }

    // Listen for auth changes
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (!currentUser) {
          await loadUserProfile(session.user);
          enterApp();
        }
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
        showAuthSection();
        showPage('login-page');
      }
    });
  } catch (e) {
    console.error('Init error:', e);
    showAuthSection();
  } finally {
    // Hide loading screen
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transform = 'scale(1.05)';
        setTimeout(() => loadingScreen.remove(), 500);
      }
    }, 1200);

    document.getElementById('app')?.classList.remove('hidden');
  }
});

// ========== ROUTING ==========
function showAuthSection() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('main-app').classList.add('hidden');
}

function enterApp() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('main-app').classList.remove('hidden');

  const role = currentProfile?.role;
  updateNavUser();

  // Show correct dashboard
  document.querySelectorAll('.dashboard').forEach(d => d.classList.add('hidden'));

  if (role === VASA_CONFIG.roles.SUPER_ADMIN) {
    document.getElementById('superadmin-dashboard').classList.remove('hidden');
    populateSuperDashboard();
  } else if (role === VASA_CONFIG.roles.ADMIN) {
    document.getElementById('admin-dashboard').classList.remove('hidden');
    populateAdminDashboard();
  } else {
    document.getElementById('user-dashboard').classList.remove('hidden');
    populateUserDashboard();
  }
}

function updateNavUser() {
  const name = currentProfile?.full_name || currentProfile?.email?.split('@')[0] || 'Usuario';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('nav-username').textContent = name.split(' ')[0];
  document.getElementById('nav-avatar').textContent = initials;
}

// ========== DASHBOARD POPULATE ==========
function populateUserDashboard() {
  const p = currentProfile || {};
  const name = p.full_name || 'Usuario';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('user-welcome-name').textContent = `Hola, ${name.split(' ')[0]}!`;
  document.getElementById('user-welcome-detail').textContent = `DNI ${p.dni || '—'} · ${p.email || ''}`;
  document.getElementById('user-avatar-big').textContent = initials;

  // Inline profile edit button in header
  const header = document.querySelector('#user-dashboard .dashboard-header');
  if (header && !header.querySelector('.edit-profile-btn')) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline btn-sm edit-profile-btn';
    btn.style.marginLeft = 'auto';
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:15px;height:15px"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg> Editar Perfil`;
    btn.onclick = openEditProfileModal;
    header.querySelector('.welcome-card').appendChild(btn);
  }

  updateSolicitudesBadge();
}

function populateAdminDashboard() {
  const p = currentProfile || {};
  const name = p.full_name || 'Admin';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('admin-welcome-name').textContent = name;
  document.getElementById('admin-welcome-detail').textContent = `DNI ${p.dni || '—'} · ${p.email || ''}`;
  document.getElementById('admin-avatar-big').textContent = initials;

  // Load pending count
  dbGetPendingRequests().then(reqs => {
    if (reqs.length > 0) updateAdminPendingBadge(reqs.length);
  }).catch(() => {});
}

function populateSuperDashboard() {
  const p = currentProfile || {};
  const name = p.full_name || 'Super Admin';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('super-welcome-name').textContent = name;
  document.getElementById('super-welcome-detail').textContent = p.email || '';
  document.getElementById('super-avatar-big').textContent = initials;
}

// ========== UI HELPERS ==========
function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu) menu.classList.toggle('hidden');
}

// Close menu on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-menu');
  const nav = document.querySelector('.nav-user');
  if (menu && nav && !menu.contains(e.target) && !nav.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = html;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// Prevent scroll behind modal
document.getElementById('modal-overlay').addEventListener('touchmove', (e) => {
  if (e.target === document.getElementById('modal-overlay')) e.preventDefault();
}, { passive: false });

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>`,
    error: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>`,
    info: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>`
  };

  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ========== UTILS ==========
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function safeParseJSON(str) {
  if (!str) return {};
  try { return JSON.parse(str); } catch { return {}; }
}

// Allow pressing Enter on auth forms
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const activePage = document.querySelector('.auth-page.active');
  if (!activePage) return;
  const id = activePage.id;
  if (id === 'login-page') handleLogin();
  else if (id === 'register-page') handleRegister();
  else if (id === 'forgot-page') handleForgotPassword();
});
