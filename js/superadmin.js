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
      body.innerHTML = emptyStateHTML('Sin administradores', 'No hay admins registrados todavía');
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
  container.innerHTML = sectionPanelHTML(
    'Todas las Solicitudes',
    'Historial completo del sistema',
    `<div class="loading-center"><div class="spinner"></div></div>`,
    `<button class="btn btn-danger btn-sm" onclick="confirmarEliminarTodas()">
      <svg viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
      Eliminar todas
    </button>`
  );

  try {
    const requests = await dbGetAllRequests();
    const body = document.querySelector('#super-sections .section-body');

    if (!requests.length) {
      body.innerHTML = emptyStateHTML('Sin solicitudes', 'No hay solicitudes en el sistema');
      return;
    }

    // Filtros
    body.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <button class="btn btn-sm" id="filter-all" onclick="filtrarSolicitudes('all')"
          style="background:var(--gray-800);color:white">Todas</button>
        <button class="btn btn-sm btn-secondary" id="filter-pending" onclick="filtrarSolicitudes('pending')">Pendientes</button>
        <button class="btn btn-sm btn-secondary" id="filter-responded" onclick="filtrarSolicitudes('responded')">Respondidas</button>
      </div>
      <div id="solicitudes-lista">
        ${superSolicitudesHTML(requests)}
      </div>
    `;
    window._superRequests = requests;
  } catch {
    showToast('Error al cargar', 'error');
  }
}

function filtrarSolicitudes(estado) {
  const all = window._superRequests || [];
  const filtered = estado === 'all' ? all : all.filter(r => r.status === estado);
  const lista = document.getElementById('solicitudes-lista');
  if (lista) lista.innerHTML = superSolicitudesHTML(filtered);

  // Actualizar botones activos
  ['all','pending','responded'].forEach(f => {
    const btn = document.getElementById('filter-' + f);
    if (!btn) return;
    if (f === estado) {
      btn.style.background = 'var(--gray-800)';
      btn.style.color = 'white';
      btn.className = 'btn btn-sm';
    } else {
      btn.style.background = '';
      btn.style.color = '';
      btn.className = 'btn btn-sm btn-secondary';
    }
  });
}

function superSolicitudesHTML(requests) {
  if (!requests.length) return emptyStateHTML('Sin resultados', 'No hay solicitudes con ese filtro');

  const badges = {
    receta: '<span class="request-type-badge badge-receta">💊 Receta</span>',
    orden: '<span class="request-type-badge badge-orden">📋 Orden</span>',
    transcripcion: '<span class="request-type-badge badge-transcripcion">📸 Transcripción</span>'
  };

  return requests.map(r => {
    const p = r.profiles || {};
    return `
      <div class="request-card" id="req-card-${r.id}">
        <div class="request-card-header">
          ${badges[r.type] || ''}
          ${r.status === 'pending'
            ? '<span class="status-badge status-pending">Pendiente</span>'
            : '<span class="status-badge status-responded">Respondida</span>'}
        </div>
        <div style="font-weight:700;margin-bottom:4px">${p.full_name || '—'}</div>
        <div style="font-size:12px;color:var(--gray-500);margin-bottom:6px">${p.email || '—'}</div>
        <div class="request-info">${r.title || '—'}</div>
        ${r.admin_response ? `<div style="margin-top:8px;padding:8px 12px;background:var(--green-light);border-radius:8px;font-size:13px;color:var(--gray-700)"><b>Respuesta:</b> ${r.admin_response}</div>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px">
          <div class="request-date">${formatDateTime(r.created_at)}</div>
          <button class="btn btn-danger btn-sm" onclick="confirmarEliminarSolicitud('${r.id}')">
            <svg viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function confirmarEliminarSolicitud(requestId) {
  openModal(`
    <div style="text-align:center;padding:8px 0 16px">
      <div style="width:64px;height:64px;background:var(--red-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg viewBox="0 0 24 24" style="width:32px;height:32px;color:var(--red)"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
      </div>
      <h2 class="modal-title" style="text-align:center">¿Eliminar solicitud?</h2>
      <p style="font-size:14px;color:var(--gray-500);margin:8px 0 20px">Esta acción no se puede deshacer.</p>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" style="flex:1" onclick="eliminarSolicitud('${requestId}')">
        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
        Sí, eliminar
      </button>
    </div>
  `);
}

async function eliminarSolicitud(requestId) {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('requests').delete().eq('id', requestId);
    if (error) throw error;

    // Quitar del array local
    window._superRequests = (window._superRequests || []).filter(r => r.id !== requestId);

    // Quitar la card del DOM sin recargar todo
    const card = document.getElementById('req-card-' + requestId);
    if (card) {
      card.style.transition = 'opacity 0.3s, transform 0.3s';
      card.style.opacity = '0';
      card.style.transform = 'translateX(20px)';
      setTimeout(() => card.remove(), 300);
    }

    closeModal();
    showToast('Solicitud eliminada', 'success');
  } catch {
    closeModal();
    showToast('Error al eliminar', 'error');
  }
}

function confirmarEliminarTodas() {
  const total = (window._superRequests || []).length;
  if (!total) { showToast('No hay solicitudes para eliminar', 'info'); return; }

  openModal(`
    <div style="text-align:center;padding:8px 0 16px">
      <div style="width:64px;height:64px;background:var(--red-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg viewBox="0 0 24 24" style="width:32px;height:32px;color:var(--red)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
      </div>
      <h2 class="modal-title" style="text-align:center">¿Eliminar TODAS las solicitudes?</h2>
      <p style="font-size:14px;color:var(--gray-500);margin:8px 0 4px">Hay <b>${total} solicitudes</b> en el sistema.</p>
      <p style="font-size:14px;color:var(--red);font-weight:700;margin-bottom:20px">Esta acción es irreversible.</p>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" style="flex:1" onclick="eliminarTodasSolicitudes()">Sí, eliminar todo</button>
    </div>
  `);
}

async function eliminarTodasSolicitudes() {
  try {
    const sb = getSupabase();
    const ids = (window._superRequests || []).map(r => r.id);
    if (!ids.length) return;

    const { error } = await sb.from('requests').delete().in('id', ids);
    if (error) throw error;

    window._superRequests = [];
    closeModal();
    showToast('Todas las solicitudes eliminadas', 'success');
    renderTodasSolicitudes();
  } catch {
    closeModal();
    showToast('Error al eliminar', 'error');
  }
}

// ===== CREAR ADMIN =====
// El anon key no puede crear usuarios auth desde el cliente.
// El flujo correcto: el admin se registra solo con "Crear cuenta",
// y el super admin le asigna el rol desde acá.

function renderCrearAdmin() {
  const container = document.getElementById('super-sections');
  container.innerHTML = sectionPanelHTML('Crear Administrador', 'Asigná rol admin a un usuario registrado', `

    <!-- OPCIÓN A: Asignar rol a usuario existente -->
    <div style="background:var(--blue-light);border-radius:12px;padding:16px;margin-bottom:20px">
      <div style="font-family:var(--font-heading);font-weight:800;font-size:14px;color:var(--blue);margin-bottom:6px">
        📋 ¿Cómo funciona?
      </div>
      <div style="font-size:13px;color:var(--gray-700);line-height:1.6">
        1. La persona se registra normalmente con "Crear cuenta"<br>
        2. Buscás su email acá abajo y le asignás el rol de Admin
      </div>
    </div>

    <div id="ca-error" class="alert alert-error hidden"></div>
    <div id="ca-success" class="alert alert-success hidden"></div>

    <div class="form-group">
      <label>Email del usuario a promover</label>
      <input type="email" id="ca-email" placeholder="medica@vasasalud.com" />
    </div>

    <div class="form-group">
      <label>Tipo de rol</label>
      <select id="ca-role" style="width:100%;padding:12px 14px;border:2px solid var(--gray-200);border-radius:10px;font-size:15px;outline:none;background:white;color:var(--gray-800)">
        <option value="admin">Administrador (Médica/Enfermera)</option>
        <option value="super_admin">Super Administrador</option>
        <option value="user">Usuario (trabajador)</option>
      </select>
    </div>

    <button class="btn btn-primary btn-full mt-8" onclick="asignarRolAdmin()">
      <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="currentColor"/></svg>
      Asignar Rol
    </button>

    <div style="border-top:1px solid var(--gray-200);margin:24px 0"></div>

    <!-- OPCIÓN B: Ver todos los perfiles y cambiar rol -->
    <div style="font-family:var(--font-heading);font-weight:800;font-size:15px;color:var(--gray-700);margin-bottom:12px">
      Todos los perfiles registrados
    </div>
    <div id="all-profiles-list">
      <div class="loading-center"><div class="spinner"></div></div>
    </div>
  `);

  // Cargar todos los perfiles
  loadAllProfilesForRoleManagement();
}

async function loadAllProfilesForRoleManagement() {
  const container = document.getElementById('all-profiles-list');
  if (!container) return;

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .order('full_name');
    if (error) throw error;

    if (!data || !data.length) {
      container.innerHTML = emptyStateHTML('Sin perfiles', 'No hay usuarios registrados');
      return;
    }

    container.innerHTML = `
      <ul class="patient-list">
        ${data.map(p => profileRoleItemHTML(p)).join('')}
      </ul>
    `;
  } catch {
    container.innerHTML = '<p style="color:var(--gray-400);font-size:14px">Error al cargar perfiles</p>';
  }
}

function profileRoleItemHTML(p) {
  const initials = (p.full_name || p.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const roleColors = {
    super_admin: 'super-badge',
    admin: 'admin-badge',
    user: 'user-badge'
  };
  const roleLabels = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'Usuario'
  };

  return `
    <li class="patient-item" style="flex-wrap:wrap;gap:8px">
      <div class="patient-avatar ${p.role === 'admin' ? 'admin-avatar' : p.role === 'super_admin' ? 'super-avatar' : ''}">${initials}</div>
      <div class="patient-info" style="min-width:0;flex:1">
        <div class="patient-name">${p.full_name || 'Sin nombre'}</div>
        <div class="patient-detail" style="word-break:break-all">${p.email}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span class="role-badge ${roleColors[p.role] || 'user-badge'}">${roleLabels[p.role] || p.role}</span>
        <select onchange="cambiarRolDirecto('${p.id}', this.value, this)"
          style="padding:6px 8px;border:2px solid var(--gray-200);border-radius:8px;font-size:12px;font-weight:600;outline:none;cursor:pointer;background:white">
          <option value="user" ${p.role === 'user' ? 'selected' : ''}>Usuario</option>
          <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>Admin</option>
          <option value="super_admin" ${p.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
        </select>
      </div>
    </li>
  `;
}

async function cambiarRolDirecto(userId, newRole, selectEl) {
  const original = selectEl.dataset.original || selectEl.value;
  selectEl.dataset.original = newRole;

  try {
    const sb = getSupabase();
    const { error } = await sb
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
    showToast(`Rol actualizado a ${newRole}`, 'success');
    loadAllProfilesForRoleManagement();
  } catch {
    showToast('Error al cambiar rol', 'error');
    selectEl.value = original;
  }
}

async function asignarRolAdmin() {
  const email = document.getElementById('ca-email')?.value?.trim().toLowerCase();
  const role = document.getElementById('ca-role')?.value || 'admin';
  const errEl = document.getElementById('ca-error');
  const sucEl = document.getElementById('ca-success');

  if (!email) { showAlert(errEl, 'Ingresá el email del usuario.'); return; }

  try {
    const sb = getSupabase();

    // Buscar el perfil por email
    const { data, error } = await sb
      .from('profiles')
      .update({ role })
      .eq('email', email)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      showAlert(errEl, 'No se encontró ningún usuario con ese email. ¿Ya se registró en la app?');
      return;
    }

    errEl.classList.add('hidden');
    showAlert(sucEl, `✓ Rol "${role}" asignado a ${email} correctamente.`);
    document.getElementById('ca-email').value = '';

    // Recargar lista
    loadAllProfilesForRoleManagement();
  } catch (e) {
    showAlert(errEl, 'Error al asignar rol. Intentá nuevamente.');
  }
}
