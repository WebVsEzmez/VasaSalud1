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
    case 'gestion-usuarios': renderGestionUsuarios(); break;
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
  container.innerHTML = sectionPanelHTML('Administradores', 'Médicas y enfermeras registradas', `<div class="loading-center"><div class="spinner"></div></div>`);

  try {
    const admins = await dbGetAllAdmins();
    const body = document.querySelector('#super-sections .section-body');
    window._gestionAdmins = admins;

    if (!admins.length) {
      body.innerHTML = emptyStateHTML('Sin administradores', 'No hay admins registrados todavía');
      return;
    }

    body.innerHTML = `
      <div class="search-bar" style="margin-bottom:16px">
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input type="text" id="gestion-admin-search" placeholder="Buscar por nombre, DNI o email..." oninput="filtrarGestionAdmins()" />
      </div>
      <div id="gestion-admin-lista">
        ${admins.map(a => gestionAdminCardHTML(a)).join('')}
      </div>
    `;
  } catch {
    showToast('Error al cargar', 'error');
  }
}

function filtrarGestionAdmins() {
  const q = document.getElementById('gestion-admin-search')?.value?.toLowerCase() || '';
  const filtered = (window._gestionAdmins || []).filter(a =>
    (a.full_name || '').toLowerCase().includes(q) ||
    (a.email || '').toLowerCase().includes(q) ||
    (a.dni || '').includes(q)
  );
  const lista = document.getElementById('gestion-admin-lista');
  if (lista) lista.innerHTML = filtered.map(a => gestionAdminCardHTML(a)).join('');
}

function gestionAdminCardHTML(a) {
  const initials = (a.full_name || a.email || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isActive = a.active !== false;

  return `
    <div class="gestion-card" id="gacard-${a.id}" style="${!isActive ? 'opacity:0.6' : ''}">
      <div class="gestion-card-top">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="patient-avatar admin-avatar" style="${!isActive ? 'background:var(--gray-300);color:var(--gray-500)' : ''}">${initials}</div>
          <div>
            <div style="font-family:var(--font-heading);font-weight:800;font-size:15px;color:var(--gray-800)">${a.full_name || 'Sin nombre'}</div>
            <div style="font-size:12px;color:var(--gray-500)">${a.email}</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
          <span class="role-badge admin-badge">Admin</span>
          <span class="status-badge ${isActive ? 'status-responded' : 'status-pending'}" style="font-size:11px">
            ${isActive ? '✓ Activo' : '✗ Inactivo'}
          </span>
        </div>
      </div>

      <!-- Datos del perfil -->
      <div class="gestion-datos">
        <div class="gestion-dato">
          <span class="gestion-dato-label">DNI</span>
          <span class="gestion-dato-val">${a.dni || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Celular</span>
          <span class="gestion-dato-val">${a.phone || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Nacimiento</span>
          <span class="gestion-dato-val">${a.birthdate ? formatDate(a.birthdate) : '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Obra Social</span>
          <span class="gestion-dato-val">${a.obra_social || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Plan</span>
          <span class="gestion-dato-val">${a.plan || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">N° Afiliado</span>
          <span class="gestion-dato-val">${a.nro_afiliado || '—'}</span>
        </div>
      </div>

      <!-- Acciones -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--gray-100);padding-top:12px">
        <button class="btn btn-outline btn-sm" onclick="abrirEditarAdmin('${a.id}')">
          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
          Editar datos
        </button>
        <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleActivarAdmin('${a.id}', ${isActive})">
          <svg viewBox="0 0 24 24"><path d="${isActive
            ? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z'
            : 'M8 5v14l11-7z'}" fill="currentColor"/></svg>
          ${isActive ? 'Desactivar' : 'Activar'}
        </button>
        <button class="btn btn-secondary btn-sm" onclick="cambiarRolAdminModal('${a.id}', '${(a.full_name||'').replace(/'/g,'')}', '${a.role}')">
          <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="currentColor"/></svg>
          Cambiar rol
        </button>
      </div>
    </div>
  `;
}

async function toggleActivarAdmin(adminId, currentlyActive) {
  const nuevoEstado = !currentlyActive;
  const accion = nuevoEstado ? 'activar' : 'desactivar';
  if (!confirm(`¿Querés ${accion} este administrador?`)) return;

  try {
    const sb = getSupabase();
    const { error } = await sb.from('profiles').update({ active: nuevoEstado }).eq('id', adminId);
    if (error) throw error;

    const idx = (window._gestionAdmins || []).findIndex(a => a.id === adminId);
    if (idx !== -1) window._gestionAdmins[idx].active = nuevoEstado;

    showToast(`Admin ${nuevoEstado ? 'activado' : 'desactivado'}`, nuevoEstado ? 'success' : 'info');
    renderTodosAdmins();
  } catch {
    showToast('Error al actualizar estado', 'error');
  }
}

function abrirEditarAdmin(adminId) {
  const a = (window._gestionAdmins || []).find(a => a.id === adminId);
  if (!a) return;

  openModal(`
    <h2 class="modal-title">Editar Administrador</h2>
    <p class="modal-subtitle">${a.email}</p>
    <div id="edit-admin-error" class="alert alert-error hidden"></div>
    <div id="edit-admin-success" class="alert alert-success hidden"></div>

    <div class="form-group"><label>Nombre y Apellido</label><input type="text" id="ea-name" value="${a.full_name || ''}" /></div>
    <div class="profile-info-row">
      <div class="form-group"><label>DNI</label><input type="text" id="ea-dni" value="${a.dni || ''}" /></div>
      <div class="form-group"><label>Fecha de nacimiento</label><input type="date" id="ea-birth" value="${a.birthdate || ''}" /></div>
    </div>
    <div class="form-group"><label>Obra Social</label><input type="text" id="ea-os" value="${a.obra_social || ''}" /></div>
    <div class="profile-info-row">
      <div class="form-group"><label>Plan</label><input type="text" id="ea-plan" value="${a.plan || ''}" /></div>
      <div class="form-group"><label>N° Afiliado</label><input type="text" id="ea-afil" value="${a.nro_afiliado || ''}" /></div>
    </div>
    <div class="form-group"><label>Celular</label><input type="tel" id="ea-phone" value="${a.phone || ''}" /></div>

    <button class="btn btn-primary btn-full mt-12" onclick="guardarEdicionAdmin('${adminId}')">
      <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
      Guardar Cambios
    </button>
  `);
}

async function guardarEdicionAdmin(adminId) {
  const errEl = document.getElementById('edit-admin-error');
  const sucEl = document.getElementById('edit-admin-success');

  const updates = {
    full_name: document.getElementById('ea-name')?.value?.trim(),
    dni: document.getElementById('ea-dni')?.value?.trim(),
    birthdate: document.getElementById('ea-birth')?.value || null,
    obra_social: document.getElementById('ea-os')?.value?.trim(),
    plan: document.getElementById('ea-plan')?.value?.trim(),
    nro_afiliado: document.getElementById('ea-afil')?.value?.trim(),
    phone: document.getElementById('ea-phone')?.value?.trim(),
  };

  try {
    const sb = getSupabase();
    const { error } = await sb.from('profiles').update(updates).eq('id', adminId);
    if (error) throw error;

    const idx = (window._gestionAdmins || []).findIndex(a => a.id === adminId);
    if (idx !== -1) window._gestionAdmins[idx] = { ...window._gestionAdmins[idx], ...updates };

    errEl.classList.add('hidden');
    showAlert(sucEl, '✓ Datos actualizados correctamente.');
    setTimeout(() => { closeModal(); renderTodosAdmins(); }, 1200);
  } catch {
    showAlert(errEl, 'Error al guardar. Intentá nuevamente.');
  }
}

function cambiarRolAdminModal(adminId, name, currentRole) {
  openModal(`
    <h2 class="modal-title">Cambiar Rol</h2>
    <p class="modal-subtitle"><b>${name}</b> · Rol actual: <b>${currentRole}</b></p>
    <div class="form-group mt-12">
      <label>Nuevo rol</label>
      <select id="nuevo-rol-select" style="width:100%;padding:12px 14px;border:2px solid var(--gray-200);border-radius:10px;font-size:15px;outline:none;background:white">
        <option value="user" ${currentRole==='user'?'selected':''}>Usuario (trabajador)</option>
        <option value="admin" ${currentRole==='admin'?'selected':''}>Administrador (Médica/Enfermera)</option>
      </select>
    </div>
    <button class="btn btn-primary btn-full mt-12" onclick="aplicarCambioRolAdmin('${adminId}')">Aplicar Cambio</button>
  `);
}

async function aplicarCambioRolAdmin(adminId) {
  const newRole = document.getElementById('nuevo-rol-select')?.value;
  if (!newRole) return;

  try {
    const sb = getSupabase();
    const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', adminId);
    if (error) throw error;

    closeModal();
    showToast(`Rol actualizado a ${newRole}`, 'success');
    renderTodosAdmins();
  } catch {
    showToast('Error al cambiar rol', 'error');
  }
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

// ===== GESTIÓN DE USUARIOS =====
async function renderGestionUsuarios() {
  const container = document.getElementById('super-sections');
  container.innerHTML = sectionPanelHTML(
    'Gestión de Usuarios',
    'Administrá perfiles, estados y datos de cada trabajador',
    `<div class="loading-center"><div class="spinner"></div></div>`
  );

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('*, family_members(count)')
      .eq('role', 'user')
      .order('full_name');
    if (error) throw error;

    window._gestionUsuarios = data || [];
    const body = document.querySelector('#super-sections .section-body');

    if (!data || !data.length) {
      body.innerHTML = emptyStateHTML('Sin usuarios', 'No hay trabajadores registrados');
      return;
    }

    body.innerHTML = `
      <div class="search-bar" style="margin-bottom:16px">
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        <input type="text" id="gestion-search" placeholder="Buscar por nombre, DNI o email..." oninput="filtrarGestionUsuarios()" />
      </div>
      <div id="gestion-lista">
        ${data.map(u => gestionUserCardHTML(u)).join('')}
      </div>
    `;
  } catch {
    showToast('Error al cargar usuarios', 'error');
  }
}

function filtrarGestionUsuarios() {
  const q = document.getElementById('gestion-search')?.value?.toLowerCase() || '';
  const filtered = (window._gestionUsuarios || []).filter(u =>
    (u.full_name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (u.dni || '').includes(q)
  );
  const lista = document.getElementById('gestion-lista');
  if (lista) lista.innerHTML = filtered.map(u => gestionUserCardHTML(u)).join('');
}

function gestionUserCardHTML(u) {
  const initials = (u.full_name || u.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isActive = u.active !== false; // activo por defecto
  const familyCount = u.family_members?.[0]?.count || 0;

  return `
    <div class="gestion-card" id="gcard-${u.id}" style="${!isActive ? 'opacity:0.6' : ''}">
      <div class="gestion-card-top">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="patient-avatar" style="${!isActive ? 'background:var(--gray-300);color:var(--gray-500)' : ''}">${initials}</div>
          <div>
            <div style="font-family:var(--font-heading);font-weight:800;font-size:15px;color:var(--gray-800)">${u.full_name || 'Sin nombre'}</div>
            <div style="font-size:12px;color:var(--gray-500)">${u.email}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="status-badge ${isActive ? 'status-responded' : 'status-pending'}" style="font-size:11px">
            ${isActive ? '✓ Activo' : '✗ Inactivo'}
          </span>
        </div>
      </div>

      <!-- Datos del perfil -->
      <div class="gestion-datos">
        <div class="gestion-dato">
          <span class="gestion-dato-label">DNI</span>
          <span class="gestion-dato-val">${u.dni || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Celular</span>
          <span class="gestion-dato-val">${u.phone || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Nacimiento</span>
          <span class="gestion-dato-val">${u.birthdate ? formatDate(u.birthdate) : '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Obra Social</span>
          <span class="gestion-dato-val">${u.obra_social || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Plan</span>
          <span class="gestion-dato-val">${u.plan || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">N° Afiliado</span>
          <span class="gestion-dato-val">${u.nro_afiliado || '—'}</span>
        </div>
        <div class="gestion-dato">
          <span class="gestion-dato-label">Legajo</span>
          <span class="gestion-dato-val">${u.legajo || '—'}</span>
        </div>
      </div>

      <!-- Familiares -->
      <div style="margin:10px 0 12px">
        <button class="btn btn-secondary btn-sm" onclick="verFamiliares('${u.id}', '${(u.full_name||'').replace(/'/g,'')}')">
          <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/></svg>
          Ver familiares ${familyCount > 0 ? `(${familyCount})` : ''}
        </button>
      </div>

      <!-- Acciones -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--gray-100);padding-top:12px">
        <button class="btn btn-outline btn-sm" onclick="abrirEditarUsuario('${u.id}')">
          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
          Editar datos
        </button>
        <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleActivarUsuario('${u.id}', ${isActive})">
          <svg viewBox="0 0 24 24"><path d="${isActive
            ? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z'
            : 'M8 5v14l11-7z'}" fill="currentColor"/></svg>
          ${isActive ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  `;
}

async function toggleActivarUsuario(userId, currentlyActive) {
  const nuevoEstado = !currentlyActive;
  const accion = nuevoEstado ? 'activar' : 'desactivar';
  if (!confirm(`¿Querés ${accion} este usuario?`)) return;

  try {
    const sb = getSupabase();
    const { error } = await sb
      .from('profiles')
      .update({ active: nuevoEstado })
      .eq('id', userId);
    if (error) throw error;

    // Actualizar en el array local
    const idx = (window._gestionUsuarios || []).findIndex(u => u.id === userId);
    if (idx !== -1) window._gestionUsuarios[idx].active = nuevoEstado;

    showToast(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`, nuevoEstado ? 'success' : 'info');
    renderGestionUsuarios();
  } catch {
    showToast('Error al actualizar estado', 'error');
  }
}

async function verFamiliares(userId, userName) {
  openModal(`
    <h2 class="modal-title">Familiares de ${userName}</h2>
    <div class="loading-center"><div class="spinner"></div></div>
  `);

  try {
    const members = await dbGetFamilyMembers(userId);
    const content = document.getElementById('modal-content');

    if (!members.length) {
      content.innerHTML = `
        <h2 class="modal-title">Familiares de ${userName}</h2>
        ${emptyStateHTML('Sin familiares', 'Este usuario no tiene familiares registrados')}
      `;
      return;
    }

    content.innerHTML = `
      <h2 class="modal-title">Familiares de ${userName}</h2>
      <p class="modal-subtitle">${members.length} familiar${members.length > 1 ? 'es' : ''} registrado${members.length > 1 ? 's' : ''}</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
        ${members.map(m => {
          const initials = m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
          return `
            <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--gray-50);border-radius:10px;border:1px solid var(--gray-200)">
              <div class="family-avatar">${initials}</div>
              <div>
                <div style="font-weight:700;font-size:15px">${m.name}</div>
                <div style="font-size:12px;color:var(--gray-500)">DNI: ${m.dni || '—'} · Edad: ${m.age || '—'} años</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch {
    showToast('Error al cargar familiares', 'error');
  }
}

function abrirEditarUsuario(userId) {
  const u = (window._gestionUsuarios || []).find(u => u.id === userId);
  if (!u) return;

  openModal(`
    <h2 class="modal-title">Editar Usuario</h2>
    <p class="modal-subtitle">${u.email}</p>
    <div id="edit-user-error" class="alert alert-error hidden"></div>
    <div id="edit-user-success" class="alert alert-success hidden"></div>

    <div class="form-group"><label>Nombre y Apellido</label><input type="text" id="eu-name" value="${u.full_name || ''}" /></div>
    <div class="profile-info-row">
      <div class="form-group"><label>DNI</label><input type="text" id="eu-dni" value="${u.dni || ''}" /></div>
      <div class="form-group"><label>Fecha de nacimiento</label><input type="date" id="eu-birth" value="${u.birthdate || ''}" /></div>
    </div>
    <div class="form-group"><label>Obra Social</label><input type="text" id="eu-os" value="${u.obra_social || ''}" /></div>
    <div class="profile-info-row">
      <div class="form-group"><label>Plan</label><input type="text" id="eu-plan" value="${u.plan || ''}" /></div>
      <div class="form-group"><label>N° Afiliado</label><input type="text" id="eu-afil" value="${u.nro_afiliado || ''}" /></div>
    </div>
    <div class="form-group"><label>Celular</label><input type="tel" id="eu-phone" value="${u.phone || ''}" /></div>
    <div class="form-group"><label>Legajo</label><input type="text" id="eu-legajo" value="${u.legajo || ''}" placeholder="Número de legajo" /></div>

    <button class="btn btn-primary btn-full mt-12" onclick="guardarEdicionUsuario('${userId}')">
      <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
      Guardar Cambios
    </button>
  `);
}

async function guardarEdicionUsuario(userId) {
  const errEl = document.getElementById('edit-user-error');
  const sucEl = document.getElementById('edit-user-success');

  const updates = {
    full_name: document.getElementById('eu-name')?.value?.trim(),
    dni: document.getElementById('eu-dni')?.value?.trim(),
    birthdate: document.getElementById('eu-birth')?.value || null,
    obra_social: document.getElementById('eu-os')?.value?.trim(),
    plan: document.getElementById('eu-plan')?.value?.trim(),
    nro_afiliado: document.getElementById('eu-afil')?.value?.trim(),
    phone: document.getElementById('eu-phone')?.value?.trim(),
    legajo: document.getElementById('eu-legajo')?.value?.trim(),
  };

  try {
    const sb = getSupabase();
    const { error } = await sb.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;

    // Actualizar en array local
    const idx = (window._gestionUsuarios || []).findIndex(u => u.id === userId);
    if (idx !== -1) window._gestionUsuarios[idx] = { ...window._gestionUsuarios[idx], ...updates };

    errEl.classList.add('hidden');
    showAlert(sucEl, '✓ Datos actualizados correctamente.');
    setTimeout(() => {
      closeModal();
      renderGestionUsuarios();
    }, 1200);
  } catch {
    showAlert(errEl, 'Error al guardar. Intentá nuevamente.');
  }
}
