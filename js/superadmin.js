// === SUPER ADMIN MODULE ===

let superSectionActive = null;

function showSuperSection(sectionName) {
  const container = document.getElementById('super-sections');
  if (!container) return;

  if (superSectionActive === sectionName) {
    container.innerHTML = '';
    superSectionActive = null;
    return;
  }
  superSectionActive = sectionName;

  switch (sectionName) {
    case 'todos-usuarios': renderTodosUsuarios(); break;
    case 'todos-admins': renderTodosAdmins(); break;
    case 'todas-solicitudes': renderTodasSolicitudes(); break;
    case 'crear-admin': renderCrearAdmin(); break;
  }
}

// ===== TODOS USUARIOS =====
async function renderTodosUsuarios() {
  const container = document.getElementById('super-sections');
  container.innerHTML = sectionPanelHTML('Todos los Usuarios', 'Trabajadores registrados', `<div class="loading-center"><div class="spinner"></div></div>`);

  try {
    const users = await dbGetAllUsers();
    const body = document.querySelector('#super-sections .section-body');

    if (!users.length) {
      body.innerHTML = emptyStateHTML('Sin usuarios', 'No hay trabajadores registrados');
      return;
    }

    body.innerHTML = `
      <div class="search-bar">
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input type="text" id="super-user-search" placeholder="Buscar usuario..." oninput="filterSuperUsers()" />
      </div>
      <ul class="patient-list" id="super-user-list">
        ${users.map(u => superUserItemHTML(u)).join('')}
      </ul>
    `;
    window._superUsers = users;
  } catch {
    showToast('Error al cargar usuarios', 'error');
  }
}

function filterSuperUsers() {
  const q = document.getElementById('super-user-search')?.value?.toLowerCase() || '';
  const filtered = (window._superUsers || []).filter(u =>
    (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  );
  const list = document.getElementById('super-user-list');
  if (list) list.innerHTML = filtered.map(u => superUserItemHTML(u)).join('');
}

function superUserItemHTML(u) {
  const initials = (u.full_name || u.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `
    <li class="patient-item" onclick="openPatientDetail('${u.id}', '${(u.full_name || '').replace(/'/g, '')}')">
      <div class="patient-avatar">${initials}</div>
      <div class="patient-info">
        <div class="patient-name">${u.full_name || 'Sin nombre'}</div>
        <div class="patient-detail">${u.email} · DNI: ${u.dni || '—'}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();confirmDeleteUser('${u.id}','${(u.full_name || '').replace(/'/g, '')}')">Eliminar</button>
    </li>
  `;
}

async function confirmDeleteUser(userId, name) {
  if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
  try {
    const sb = getSupabase();
    // Delete profile (auth user requires service_role, so we just soft-delete profile)
    const { error } = await sb.from('profiles').delete().eq('id', userId);
    if (error) throw error;
    showToast('Usuario eliminado', 'success');
    renderTodosUsuarios();
  } catch {
    showToast('Error al eliminar', 'error');
  }
}

// ===== TODOS ADMINS =====
async function renderTodosAdmins() {
  const container = document.getElementById('super-sections');
  container.innerHTML = sectionPanelHTML('Administradores', 'Médicas y enfermeras', `<div class="loading-center"><div class="spinner"></div></div>`);

  try {
    const admins = await dbGetAllAdmins();
    const body = document.querySelector('#super-sections .section-body');

    if (!admins.length) {
      body.innerHTML = emptyStateHTML('Sin administradores', 'No hay admins registrados');
      return;
    }

    body.innerHTML = `<ul class="patient-list">${admins.map(a => adminItemHTML(a)).join('')}</ul>`;
  } catch {
    showToast('Error al cargar', 'error');
  }
}

function adminItemHTML(a) {
  const initials = (a.full_name || a.email || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `
    <li class="patient-item">
      <div class="patient-avatar admin-avatar">${initials}</div>
      <div class="patient-info">
        <div class="patient-name">${a.full_name || 'Sin nombre'}</div>
        <div class="patient-detail">${a.email}</div>
      </div>
      <span class="role-badge admin-badge">Admin</span>
    </li>
  `;
}

// ===== TODAS SOLICITUDES =====
async function renderTodasSolicitudes() {
  const container = document.getElementById('super-sections');
  container.innerHTML = sectionPanelHTML('Todas las Solicitudes', 'Historial completo del sistema', `<div class="loading-center"><div class="spinner"></div></div>`);

  try {
    const requests = await dbGetAllRequests();
    const body = document.querySelector('#super-sections .section-body');

    if (!requests.length) {
      body.innerHTML = emptyStateHTML('Sin solicitudes', 'No hay solicitudes en el sistema');
      return;
    }

    body.innerHTML = requests.map(r => {
      const p = r.profiles || {};
      return `
        <div class="request-card">
          <div class="request-card-header">
            ${{receta:'<span class="request-type-badge badge-receta">💊 Receta</span>',orden:'<span class="request-type-badge badge-orden">📋 Orden</span>',transcripcion:'<span class="request-type-badge badge-transcripcion">📸 Transcripción</span>'}[r.type]||''}
            ${r.status==='pending'?'<span class="status-badge status-pending">Pendiente</span>':'<span class="status-badge status-responded">Respondida</span>'}
          </div>
          <div style="font-weight:700;margin-bottom:4px">${p.full_name || '—'}</div>
          <div class="request-info">${r.title || '—'}</div>
          <div class="request-date">${formatDateTime(r.created_at)}</div>
        </div>
      `;
    }).join('');
  } catch {
    showToast('Error al cargar', 'error');
  }
}

// ===== CREAR ADMIN (super version) =====
function renderCrearAdmin() {
  const container = document.getElementById('super-sections');
  container.innerHTML = sectionPanelHTML('Crear Administrador', 'Registrá un nuevo admin en el sistema', `
    <div id="ca-error" class="alert alert-error hidden"></div>
    <div id="ca-success" class="alert alert-success hidden"></div>
    <div class="form-group"><label>Nombre y Apellido</label><input type="text" id="ca-name" placeholder="Dra. Ana García" /></div>
    <div class="form-group"><label>Correo electrónico</label><input type="email" id="ca-email" placeholder="admin@vasasalud.com" /></div>
    <div class="form-group">
      <label>Contraseña temporal</label>
      <div class="input-wrapper">
        <svg class="input-icon" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/></svg>
        <input type="password" id="ca-password" placeholder="Mínimo 6 caracteres" />
        <button type="button" class="toggle-password" onclick="togglePassword('ca-password', this)">
          <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
    <div class="form-group">
      <label>Tipo de rol</label>
      <select id="ca-role" style="width:100%;padding:12px 14px;border:2px solid var(--gray-200);border-radius:10px;font-size:15px;outline:none">
        <option value="admin">Administrador (Médica/Enfermera)</option>
        <option value="super_admin">Super Administrador</option>
      </select>
    </div>
    <button class="btn btn-primary btn-full mt-8" onclick="crearAdminSuper()">Crear Cuenta</button>
  `);
}

async function crearAdminSuper() {
  const name = document.getElementById('ca-name')?.value?.trim();
  const email = document.getElementById('ca-email')?.value?.trim();
  const password = document.getElementById('ca-password')?.value;
  const role = document.getElementById('ca-role')?.value || VASA_CONFIG.roles.ADMIN;
  const errEl = document.getElementById('ca-error');
  const sucEl = document.getElementById('ca-success');

  if (!name || !email || !password) { showAlert(errEl, 'Completá todos los campos.'); return; }
  if (password.length < 6) { showAlert(errEl, 'La contraseña debe tener al menos 6 caracteres.'); return; }

  try {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;

    if (data.user) {
      await dbUpsertProfile({ id: data.user.id, email, full_name: name, role });
    }

    errEl.classList.add('hidden');
    showAlert(sucEl, `✓ Cuenta creada para ${name}. Rol: ${role}`);
    ['ca-name','ca-email','ca-password'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  } catch (e) {
    showAlert(errEl, getAuthError(e.message));
  }
}
