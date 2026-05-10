// === ADMIN MODULE ===

let adminSectionActive = null;

function showAdminSection(sectionName) {
  const container = document.getElementById('admin-sections');
  if (!container) return;

  if (adminSectionActive === sectionName) {
    container.innerHTML = '';
    adminSectionActive = null;
    return;
  }
  adminSectionActive = sectionName;

  switch (sectionName) {
    case 'solicitudes-pendientes': renderSolicitudesPendientes(); break;
    case 'mis-pacientes': renderMisPacientes(); break;
    case 'nuevo-admin': renderNuevoAdmin(); break;
    case 'mi-perfil-admin': renderAdminPerfil(); break;
  }
}

// ===== SOLICITUDES PENDIENTES =====
async function renderSolicitudesPendientes() {
  const container = document.getElementById('admin-sections');
  container.innerHTML = sectionPanelHTML('Solicitudes Pendientes', 'Pedidos sin responder', `<div class="loading-center"><div class="spinner"></div></div>`);

  try {
    const requests = await dbGetPendingRequests();
    const body = document.querySelector('#admin-sections .section-body');

    if (!requests.length) {
      body.innerHTML = emptyStateHTML('Sin pendientes', 'No hay solicitudes esperando respuesta');
      return;
    }

    body.innerHTML = requests.map(r => adminRequestCardHTML(r)).join('');
    updateAdminPendingBadge(requests.length);
  } catch (e) {
    showToast('Error al cargar solicitudes', 'error');
  }
}

function adminRequestCardHTML(r) {
  const profile = r.profiles || {};
  const details = safeParseJSON(r.details);
  const typeBadge = {
    receta: `<span class="request-type-badge badge-receta">💊 Receta</span>`,
    orden: `<span class="request-type-badge badge-orden">📋 Orden</span>`,
    transcripcion: `<span class="request-type-badge badge-transcripcion">📸 Transcripción</span>`
  }[r.type] || '';

  let detailText = '';
  if (r.type === 'receta') detailText = `<b>Fármaco:</b> ${details.farmaco || '—'} | <b>Dosis:</b> ${details.dosis || '—'} | <b>Cantidad:</b> ${details.cantidad || '—'}${details.observaciones ? `<br><b>Obs:</b> ${details.observaciones}` : ''}`;
  if (r.type === 'orden') detailText = `<b>Detalle:</b> ${details.detalle || '—'}${details.observaciones ? `<br><b>Obs:</b> ${details.observaciones}` : ''}`;
  if (r.type === 'transcripcion') {
    detailText = details.observaciones ? `<b>Obs:</b> ${details.observaciones}` : 'Sin observaciones';
    if (details.file_url && details.file_url !== '[archivo adjunto]') {
      detailText += `<br><a href="${details.file_url}" target="_blank" rel="noopener" style="color:var(--teal);font-weight:600">Ver imagen adjunta →</a>`;
    }
  }

  return `
    <div class="request-card">
      <div class="request-card-header">
        ${typeBadge}
        <span class="status-badge status-pending">Pendiente</span>
      </div>
      <div style="margin-bottom:8px">
        <div style="font-weight:700;font-size:15px">${profile.full_name || 'Paciente'}</div>
        <div style="font-size:12px;color:var(--gray-500)">DNI: ${profile.dni || '—'} · ${profile.email || '—'}</div>
      </div>
      <div class="request-info">${detailText}</div>
      <div class="flex-between mt-12">
        <div class="request-date">${formatDateTime(r.created_at)}</div>
        <button class="btn btn-primary btn-sm" onclick="openResponderModal('${r.id}', '${(profile.full_name || '').replace(/'/g, '')}')">
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>
          Responder
        </button>
      </div>
    </div>
  `;
}

function openResponderModal(requestId, patientName) {
  openModal(`
    <h2 class="modal-title">Responder Solicitud</h2>
    <p class="modal-subtitle">Paciente: <b>${patientName}</b></p>
    <div id="resp-error" class="alert alert-error hidden"></div>
    <div class="form-group">
      <label>Tu respuesta al paciente</label>
      <textarea id="resp-text" rows="4" placeholder="Ej: La receta fue enviada a tu correo. Cualquier consulta escribinos."></textarea>
    </div>
    <button class="btn btn-primary btn-full mt-8" onclick="enviarRespuesta('${requestId}')">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
      Enviar Respuesta
    </button>
  `);
}

async function enviarRespuesta(requestId) {
  const response = document.getElementById('resp-text')?.value?.trim();
  const errEl = document.getElementById('resp-error');
  if (!response) { showAlert(errEl, 'Escribí una respuesta.'); return; }

  try {
    await dbRespondRequest(requestId, response);
    closeModal();
    showToast('Respuesta enviada', 'success');
    renderSolicitudesPendientes();
  } catch {
    showAlert(errEl, 'Error al responder. Intentá nuevamente.');
  }
}

// ===== MIS PACIENTES =====
async function renderMisPacientes() {
  const container = document.getElementById('admin-sections');
  container.innerHTML = sectionPanelHTML('Mis Pacientes', 'Todos los usuarios registrados', `
    <div class="search-bar">
      <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
      <input type="text" id="patient-search" placeholder="Buscar paciente..." oninput="filterPatients()" />
    </div>
    <div class="loading-center"><div class="spinner"></div></div>
  `);

  try {
    const users = await dbGetAllUsers();
    const body = document.querySelector('#admin-sections .section-body');

    if (!users.length) {
      const searchBar = body.querySelector('.search-bar');
      body.innerHTML = '';
      body.appendChild(searchBar);
      body.innerHTML += emptyStateHTML('Sin pacientes', 'No hay usuarios registrados todavía');
      return;
    }

    // Build alphabetical list
    window._adminPatients = users;
    renderPatientList(users);
  } catch (e) {
    showToast('Error al cargar pacientes', 'error');
  }
}

function filterPatients() {
  const q = document.getElementById('patient-search')?.value?.toLowerCase() || '';
  const filtered = (window._adminPatients || []).filter(p =>
    (p.full_name || '').toLowerCase().includes(q) ||
    (p.dni || '').includes(q) ||
    (p.email || '').toLowerCase().includes(q)
  );
  renderPatientList(filtered);
}

function renderPatientList(users) {
  const body = document.querySelector('#admin-sections .section-body');
  const searchBar = body.querySelector('.search-bar');
  if (!searchBar) return;

  // Remove old list
  const oldList = body.querySelector('.patient-list-wrapper');
  if (oldList) oldList.remove();

  if (!users.length) {
    const div = document.createElement('div');
    div.className = 'patient-list-wrapper';
    div.innerHTML = emptyStateHTML('Sin resultados', 'No encontramos pacientes con ese criterio');
    body.appendChild(div);
    return;
  }

  // Group by first letter
  const grouped = {};
  users.forEach(u => {
    const letter = (u.full_name || u.email || '?')[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(u);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'patient-list-wrapper';

  Object.keys(grouped).sort().forEach(letter => {
    wrapper.innerHTML += `<div class="alpha-header">${letter}</div>`;
    wrapper.innerHTML += `<ul class="patient-list">${grouped[letter].map(u => patientItemHTML(u)).join('')}</ul>`;
  });

  body.appendChild(wrapper);
}

function patientItemHTML(u) {
  const initials = (u.full_name || u.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `
    <li class="patient-item" onclick="openPatientDetail('${u.id}', '${(u.full_name || '').replace(/'/g, '')}')">
      <div class="patient-avatar">${initials}</div>
      <div class="patient-info">
        <div class="patient-name">${u.full_name || 'Sin nombre'}</div>
        <div class="patient-detail">DNI: ${u.dni || '—'} · ${u.email}</div>
      </div>
      <svg viewBox="0 0 24 24" style="width:20px;height:20px;color:var(--gray-300);flex-shrink:0"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
    </li>
  `;
}

async function openPatientDetail(userId, name) {
  openModal(`
    <h2 class="modal-title">${name}</h2>
    <p class="modal-subtitle">Historial de solicitudes</p>
    <div class="loading-center"><div class="spinner"></div></div>
  `);

  try {
    const [profile, requests] = await Promise.all([
      dbGetProfile(userId),
      dbGetPatientRequests(userId)
    ]);

    const content = document.getElementById('modal-content');

    let profileHTML = `
      <div style="background:var(--gray-50);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <div><div style="color:var(--gray-400);font-weight:600;font-size:11px;margin-bottom:2px">DNI</div><div style="font-weight:700">${profile.dni || '—'}</div></div>
          <div><div style="color:var(--gray-400);font-weight:600;font-size:11px;margin-bottom:2px">CELULAR</div><div style="font-weight:700">${profile.phone || '—'}</div></div>
          <div style="grid-column:1/-1"><div style="color:var(--gray-400);font-weight:600;font-size:11px;margin-bottom:2px">OBRA SOCIAL</div><div style="font-weight:700">${profile.obra_social || '—'} ${profile.plan ? '· ' + profile.plan : ''} ${profile.nro_afiliado ? '· N° ' + profile.nro_afiliado : ''}</div></div>
        </div>
      </div>
    `;

    // Frequency analysis
    const freq = {};
    requests.forEach(r => {
      const d = safeParseJSON(r.details);
      const key = r.type === 'receta' ? `Receta: ${d.farmaco || '?'}` : r.type === 'orden' ? 'Orden Médica' : 'Transcripción';
      freq[key] = (freq[key] || 0) + 1;
    });

    const freqHTML = Object.keys(freq).length
      ? `<div style="margin-bottom:14px"><div style="font-family:var(--font-heading);font-size:13px;font-weight:700;color:var(--gray-500);margin-bottom:8px">MÁS FRECUENTE</div>${Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-100);font-size:14px"><span>${k}</span><span style="font-weight:700;color:var(--teal)">${v}x</span></div>`).join('')}</div>`
      : '';

    const histHTML = requests.length
      ? requests.slice(0, 5).map(r => requestCardHTML(r)).join('')
      : emptyStateHTML('Sin solicitudes', 'Este paciente no ha realizado pedidos');

    content.innerHTML = `
      <h2 class="modal-title">${name}</h2>
      ${profileHTML}
      ${freqHTML}
      <div style="font-family:var(--font-heading);font-size:13px;font-weight:700;color:var(--gray-500);margin-bottom:8px">ÚLTIMAS SOLICITUDES</div>
      ${histHTML}
    `;
  } catch {
    showToast('Error al cargar datos del paciente', 'error');
  }
}

// ===== NUEVO ADMIN =====
function renderNuevoAdmin() {
  const container = document.getElementById('admin-sections');
  container.innerHTML = sectionPanelHTML('Nuevo Administrador', 'Asigná rol a un usuario ya registrado', `
    <div style="background:var(--blue-light);border-radius:12px;padding:16px;margin-bottom:20px">
      <div style="font-family:var(--font-heading);font-weight:800;font-size:14px;color:var(--blue);margin-bottom:6px">📋 ¿Cómo funciona?</div>
      <div style="font-size:13px;color:var(--gray-700);line-height:1.6">
        1. La persona se registra normalmente con <b>"Crear cuenta"</b><br>
        2. Ingresás su email acá y le asignás el rol de Administrador
      </div>
    </div>
    <div id="newadmin-error" class="alert alert-error hidden"></div>
    <div id="newadmin-success" class="alert alert-success hidden"></div>
    <div class="form-group"><label>Email del usuario</label><input type="email" id="na-email" placeholder="medica@vasasalud.com" /></div>
    <button class="btn btn-primary btn-full mt-8" onclick="crearNuevoAdmin()">Asignar Rol Admin</button>
  `);
}

async function crearNuevoAdmin() {
  const email = document.getElementById('na-email')?.value?.trim().toLowerCase();
  const errEl = document.getElementById('newadmin-error');
  const sucEl = document.getElementById('newadmin-success');

  if (!email) { showAlert(errEl, 'Ingresá el email del usuario.'); return; }

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .update({ role: VASA_CONFIG.roles.ADMIN })
      .eq('email', email)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      showAlert(errEl, 'No se encontró ningún usuario con ese email. ¿Ya se registró en la app?');
      return;
    }

    errEl.classList.add('hidden');
    showAlert(sucEl, `✓ Rol Admin asignado a ${email} correctamente.`);
    document.getElementById('na-email').value = '';
  } catch (e) {
    showAlert(errEl, 'Error al asignar rol. Intentá nuevamente.');
  }
}

// ===== ADMIN PROFILE =====
function renderAdminPerfil() {
  const container = document.getElementById('admin-sections');
  const p = currentProfile || {};
  container.innerHTML = sectionPanelHTML('Mi Perfil', 'Tus datos de administrador', `
    <div style="display:grid;gap:14px;margin-bottom:16px">
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">NOMBRE Y APELLIDO</div><div style="font-weight:700">${p.full_name || '—'}</div></div>
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">DNI</div><div style="font-weight:700">${p.dni || '—'}</div></div>
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">EMAIL</div><div style="font-weight:700">${p.email || '—'}</div></div>
    </div>
    <button class="btn btn-outline" onclick="openEditAdminProfileModal()">Editar mis datos</button>
  `);
}

function openEditAdminProfileModal() {
  const p = currentProfile || {};
  openModal(`
    <h2 class="modal-title">Editar Perfil</h2>
    <div class="form-group"><label>Nombre y Apellido</label><input type="text" id="ap-name" value="${p.full_name || ''}" /></div>
    <div class="form-group"><label>DNI</label><input type="text" id="ap-dni" value="${p.dni || ''}" /></div>
    <button class="btn btn-primary btn-full mt-12" onclick="saveAdminProfile()">Guardar Cambios</button>
  `);
}

async function saveAdminProfile() {
  const name = document.getElementById('ap-name')?.value?.trim();
  const dni = document.getElementById('ap-dni')?.value?.trim();
  try {
    currentProfile = await dbUpsertProfile({ ...currentProfile, full_name: name, dni });
    updateNavUser();
    closeModal();
    showToast('Perfil actualizado', 'success');
    renderAdminPerfil();
  } catch {
    showToast('Error al guardar', 'error');
  }
}

async function updateAdminPendingBadge(count) {
  const badge = document.getElementById('admin-pending-badge');
  if (badge) {
    if (count > 0) { badge.style.display = 'flex'; badge.textContent = count; }
    else { badge.style.display = 'none'; }
  }
}
