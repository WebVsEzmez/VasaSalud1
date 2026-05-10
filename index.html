// === USER MODULE ===

let userSectionActive = null;

function showUserSection(sectionName) {
  const container = document.getElementById('user-sections');
  if (!container) return;

  if (userSectionActive === sectionName) {
    container.innerHTML = '';
    userSectionActive = null;
    return;
  }
  userSectionActive = sectionName;

  switch (sectionName) {
    case 'mis-solicitudes': renderMisSolicitudes(); break;
    case 'mi-familia': renderMiFamilia(); break;
    case 'pedir-receta': renderPedirReceta(); break;
    case 'pedir-orden': renderPedirOrden(); break;
    case 'transcripcion': renderTranscripcion(); break;
  }
}

// ===== MIS SOLICITUDES =====
async function renderMisSolicitudes() {
  const container = document.getElementById('user-sections');
  container.innerHTML = sectionPanelHTML('Mis Solicitudes', 'Historial de tus pedidos', `<div class="loading-center"><div class="spinner"></div></div>`);

  try {
    const requests = await dbGetUserRequests(currentUser.id);
    const body = document.querySelector('#user-sections .section-body');

    if (!requests.length) {
      body.innerHTML = emptyStateHTML('No tenés solicitudes', 'Tus pedidos aparecerán aquí');
      return;
    }

    body.innerHTML = requests.map(r => requestCardHTML(r)).join('');
  } catch (e) {
    showToast('Error al cargar solicitudes', 'error');
  }
}

// ===== MI FAMILIA =====
async function renderMiFamilia() {
  const container = document.getElementById('user-sections');
  container.innerHTML = sectionPanelHTML(
    'Mi Familia',
    'Familiares registrados',
    `<div class="loading-center"><div class="spinner"></div></div>`,
    `<button class="btn btn-primary btn-sm" onclick="openAddFamiliarModal()">+ Agregar</button>`
  );

  try {
    const members = await dbGetFamilyMembers(currentUser.id);
    const body = document.querySelector('#user-sections .section-body');

    if (!members.length) {
      body.innerHTML = emptyStateHTML('Sin familiares', 'Agregá tus familiares para tenerlos registrados');
      return;
    }

    body.innerHTML = `<div class="family-list">${members.map(m => familyItemHTML(m)).join('')}</div>`;
  } catch (e) {
    showToast('Error al cargar familiares', 'error');
  }
}

function familyItemHTML(m) {
  const initials = m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `
    <div class="family-item">
      <div class="family-info">
        <div class="family-avatar">${initials}</div>
        <div>
          <div style="font-weight:700;font-size:15px;color:var(--gray-800)">${m.name}</div>
          <div style="font-size:12px;color:var(--gray-500)">DNI: ${m.dni || '—'} · Edad: ${m.age || '—'}</div>
        </div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteFamiliar('${m.id}')">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
      </button>
    </div>`;
}

function openAddFamiliarModal() {
  openModal(`
    <h2 class="modal-title">Agregar Familiar</h2>
    <p class="modal-subtitle">Ingresá los datos del familiar</p>
    <div id="familiar-error" class="alert alert-error hidden"></div>
    <div class="form-group"><label>Nombre y Apellido</label><input type="text" id="fam-name" placeholder="María Pérez" /></div>
    <div class="profile-info-row">
      <div class="form-group"><label>DNI</label><input type="text" id="fam-dni" placeholder="12345678" /></div>
      <div class="form-group"><label>Edad</label><input type="number" id="fam-age" placeholder="35" min="0" max="120" /></div>
    </div>
    <button class="btn btn-primary btn-full mt-12" onclick="addFamiliar()">Guardar Familiar</button>
  `);
}

async function addFamiliar() {
  const name = document.getElementById('fam-name')?.value?.trim();
  const dni = document.getElementById('fam-dni')?.value?.trim();
  const age = document.getElementById('fam-age')?.value?.trim();
  const errEl = document.getElementById('familiar-error');

  if (!name) { showAlert(errEl, 'El nombre es obligatorio.'); return; }

  try {
    await dbAddFamilyMember({ user_id: currentUser.id, name, dni, age: age ? parseInt(age) : null });
    closeModal();
    showToast('Familiar agregado', 'success');
    renderMiFamilia();
  } catch (e) {
    showAlert(errEl, 'Error al guardar. Intentá nuevamente.');
  }
}

async function deleteFamiliar(id) {
  if (!confirm('¿Eliminar este familiar?')) return;
  try {
    await dbDeleteFamilyMember(id);
    showToast('Familiar eliminado', 'info');
    renderMiFamilia();
  } catch {
    showToast('Error al eliminar', 'error');
  }
}

// ===== PEDIR RECETA =====
function renderPedirReceta() {
  const container = document.getElementById('user-sections');
  container.innerHTML = sectionPanelHTML('Pedir Receta', 'Indicá la medicación que necesitás', `
    <div id="receta-error" class="alert alert-error hidden"></div>
    <div id="receta-success" class="alert alert-success hidden"></div>
    <div class="form-group"><label>Nombre del Fármaco</label><input type="text" id="rec-farmaco" placeholder="Ej: Ibuprofeno" /></div>
    <div class="profile-info-row">
      <div class="form-group"><label>Dosis</label><input type="text" id="rec-dosis" placeholder="Ej: 400mg" /></div>
      <div class="form-group"><label>Cantidad</label><input type="text" id="rec-cantidad" placeholder="Ej: 20 comprimidos" /></div>
    </div>
    <div class="form-group"><label>Observaciones (opcional)</label><textarea id="rec-obs" placeholder="Indicaciones adicionales..."></textarea></div>
    <button class="btn btn-primary btn-full mt-8" onclick="enviarReceta()">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
      Enviar Solicitud
    </button>
  `);
}

async function enviarReceta() {
  const farmaco = document.getElementById('rec-farmaco')?.value?.trim();
  const dosis = document.getElementById('rec-dosis')?.value?.trim();
  const cantidad = document.getElementById('rec-cantidad')?.value?.trim();
  const obs = document.getElementById('rec-obs')?.value?.trim();
  const errEl = document.getElementById('receta-error');
  const sucEl = document.getElementById('receta-success');

  if (!farmaco || !dosis || !cantidad) {
    showAlert(errEl, 'Completá fármaco, dosis y cantidad.');
    return;
  }

  try {
    await dbCreateRequest({
      user_id: currentUser.id,
      type: 'receta',
      status: 'pending',
      details: JSON.stringify({ farmaco, dosis, cantidad, observaciones: obs }),
      title: `Receta: ${farmaco} ${dosis}`
    });
    errEl.classList.add('hidden');
    showAlert(sucEl, '✓ Solicitud enviada. El médico responderá a la brevedad.');
    ['rec-farmaco','rec-dosis','rec-cantidad','rec-obs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    updateSolicitudesBadge();
  } catch (e) {
    showAlert(errEl, 'Error al enviar. Intentá nuevamente.');
  }
}

// ===== PEDIR ORDEN =====
function renderPedirOrden() {
  const container = document.getElementById('user-sections');
  container.innerHTML = sectionPanelHTML('Pedir Orden Médica', 'Indicá qué orden necesitás', `
    <div id="orden-error" class="alert alert-error hidden"></div>
    <div id="orden-success" class="alert alert-success hidden"></div>
    <div class="form-group"><label>Detalle de la Orden</label><textarea id="ord-detalle" rows="4" placeholder="Describí qué orden médica necesitás (estudios, derivaciones, etc.)..."></textarea></div>
    <div class="form-group"><label>Observaciones adicionales (opcional)</label><textarea id="ord-obs" placeholder="Más información..."></textarea></div>
    <button class="btn btn-primary btn-full mt-8" onclick="enviarOrden()">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
      Enviar Solicitud
    </button>
  `);
}

async function enviarOrden() {
  const detalle = document.getElementById('ord-detalle')?.value?.trim();
  const obs = document.getElementById('ord-obs')?.value?.trim();
  const errEl = document.getElementById('orden-error');
  const sucEl = document.getElementById('orden-success');

  if (!detalle) { showAlert(errEl, 'Describí la orden que necesitás.'); return; }

  try {
    await dbCreateRequest({
      user_id: currentUser.id,
      type: 'orden',
      status: 'pending',
      details: JSON.stringify({ detalle, observaciones: obs }),
      title: 'Orden Médica'
    });
    errEl.classList.add('hidden');
    showAlert(sucEl, '✓ Solicitud enviada. El médico responderá a la brevedad.');
    document.getElementById('ord-detalle').value = '';
    if (document.getElementById('ord-obs')) document.getElementById('ord-obs').value = '';
    updateSolicitudesBadge();
  } catch (e) {
    showAlert(errEl, 'Error al enviar. Intentá nuevamente.');
  }
}

// ===== TRANSCRIPCION =====
let transcripcionFile = null;

function renderTranscripcion() {
  const container = document.getElementById('user-sections');
  container.innerHTML = sectionPanelHTML('Transcripción de Receta', 'Subí la foto de tu receta', `
    <div id="trans-error" class="alert alert-error hidden"></div>
    <div id="trans-success" class="alert alert-success hidden"></div>
    <div class="upload-area" onclick="document.getElementById('trans-file').click()">
      <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/></svg>
      <p>Tocá para seleccionar una foto</p>
      <small>JPG, PNG, PDF · Máx. 5 MB</small>
    </div>
    <input type="file" id="trans-file" accept="image/*,.pdf" style="display:none" onchange="previewTranscripcion(this)" />
    <div id="trans-preview" class="upload-preview" style="display:none"></div>
    <div class="form-group mt-12"><label>Observaciones (opcional)</label><textarea id="trans-obs" placeholder="Alguna aclaración sobre la receta..."></textarea></div>
    <button class="btn btn-primary btn-full mt-8" onclick="enviarTranscripcion()">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
      Enviar Transcripción
    </button>
  `);
}

function previewTranscripcion(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];
  transcripcionFile = file;

  if (file.size > 5 * 1024 * 1024) {
    showToast('El archivo supera los 5 MB', 'error');
    transcripcionFile = null;
    return;
  }

  const preview = document.getElementById('trans-preview');
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.style.display = 'block';
      preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" />`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = 'block';
    preview.innerHTML = `<div style="padding:12px;background:var(--gray-100);border-radius:8px;font-size:14px;color:var(--gray-700)">📄 ${file.name}</div>`;
  }
}

async function enviarTranscripcion() {
  const obs = document.getElementById('trans-obs')?.value?.trim();
  const errEl = document.getElementById('trans-error');
  const sucEl = document.getElementById('trans-success');

  if (!transcripcionFile) {
    showAlert(errEl, 'Seleccioná una imagen o PDF de tu receta.');
    return;
  }

  const btn = document.querySelector('#user-sections .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Subiendo...'; }

  try {
    let fileUrl = null;
    try {
      fileUrl = await dbUploadTranscription(transcripcionFile, currentUser.id);
    } catch (uploadErr) {
      // If storage not configured, save without URL
      fileUrl = '[archivo adjunto]';
    }

    await dbCreateRequest({
      user_id: currentUser.id,
      type: 'transcripcion',
      status: 'pending',
      details: JSON.stringify({ observaciones: obs, file_url: fileUrl, file_name: transcripcionFile.name }),
      title: 'Transcripción de Receta'
    });

    errEl.classList.add('hidden');
    showAlert(sucEl, '✓ Transcripción enviada correctamente.');
    transcripcionFile = null;
    document.getElementById('trans-preview').style.display = 'none';
    if (document.getElementById('trans-obs')) document.getElementById('trans-obs').value = '';
    updateSolicitudesBadge();
  } catch (e) {
    showAlert(errEl, 'Error al enviar. Intentá nuevamente.');
  } finally {
    if (btn) { btn.disabled = false; }
  }
}

// ===== PROFILE USER =====
function renderUserProfile() {
  return `
    <div class="section-panel">
      <div class="section-header">
        <span class="section-title">Mi Perfil</span>
        <button class="btn btn-outline btn-sm" onclick="toggleEditProfile()">Editar</button>
      </div>
      <div class="section-body" id="profile-body">
        ${profileViewHTML(currentProfile)}
      </div>
    </div>
  `;
}

function profileViewHTML(p) {
  if (!p) return '';
  return `
    <div style="display:grid;gap:14px">
      <div class="profile-info-row">
        <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">NOMBRE Y APELLIDO</div><div style="font-weight:700">${p.full_name || '—'}</div></div>
        <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">DNI</div><div style="font-weight:700">${p.dni || '—'}</div></div>
      </div>
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">FECHA DE NACIMIENTO</div><div style="font-weight:700">${p.birthdate ? formatDate(p.birthdate) : '—'}</div></div>
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">OBRA SOCIAL · PLAN · N° AFILIADO</div><div style="font-weight:700">${p.obra_social || '—'} · ${p.plan || '—'} · ${p.nro_afiliado || '—'}</div></div>
      <div class="profile-info-row">
        <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">CELULAR</div><div style="font-weight:700">${p.phone || '—'}</div></div>
        <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">EMAIL</div><div style="font-weight:700;font-size:13px;word-break:break-all">${p.email || '—'}</div></div>
      </div>
    </div>
  `;
}

async function saveUserProfile() {
  const updatedProfile = {
    id: currentUser.id,
    email: currentUser.email,
    full_name: document.getElementById('p-name')?.value?.trim(),
    dni: document.getElementById('p-dni')?.value?.trim(),
    birthdate: document.getElementById('p-birth')?.value,
    obra_social: document.getElementById('p-os')?.value?.trim(),
    plan: document.getElementById('p-plan')?.value?.trim(),
    nro_afiliado: document.getElementById('p-afil')?.value?.trim(),
    phone: document.getElementById('p-phone')?.value?.trim(),
    role: currentProfile?.role || VASA_CONFIG.roles.USER
  };

  try {
    currentProfile = await dbUpsertProfile(updatedProfile);
    updateNavUser();
    closeModal();
    showToast('Perfil actualizado', 'success');
  } catch (e) {
    showToast('Error al guardar', 'error');
  }
}

function openEditProfileModal() {
  const p = currentProfile || {};
  openModal(`
    <h2 class="modal-title">Editar Mi Perfil</h2>
    <div id="profile-save-error" class="alert alert-error hidden"></div>
    <div class="form-group"><label>Nombre y Apellido</label><input type="text" id="p-name" value="${p.full_name || ''}" /></div>
    <div class="profile-info-row">
      <div class="form-group"><label>DNI</label><input type="text" id="p-dni" value="${p.dni || ''}" /></div>
      <div class="form-group"><label>Fecha de nacimiento</label><input type="date" id="p-birth" value="${p.birthdate || ''}" /></div>
    </div>
    <div class="form-group"><label>Obra Social</label><input type="text" id="p-os" value="${p.obra_social || ''}" placeholder="OSDE, Swiss Medical..." /></div>
    <div class="profile-info-row">
      <div class="form-group"><label>Plan</label><input type="text" id="p-plan" value="${p.plan || ''}" /></div>
      <div class="form-group"><label>N° Afiliado</label><input type="text" id="p-afil" value="${p.nro_afiliado || ''}" /></div>
    </div>
    <div class="form-group"><label>Celular</label><input type="tel" id="p-phone" value="${p.phone || ''}" placeholder="+54 9 11 1234-5678" /></div>
    <button class="btn btn-primary btn-full mt-12" onclick="saveUserProfile()">Guardar Cambios</button>
  `);
}

async function updateSolicitudesBadge() {
  try {
    const requests = await dbGetUserRequests(currentUser.id);
    const pending = requests.filter(r => r.status === 'pending').length;
    const badge = document.getElementById('solicitudes-badge');
    if (badge) {
      if (pending > 0) { badge.style.display = 'flex'; badge.textContent = pending; }
      else { badge.style.display = 'none'; }
    }
  } catch {}
}

// ===== HELPERS =====
function requestCardHTML(r) {
  const details = safeParseJSON(r.details);
  const typeBadge = {
    receta: `<span class="request-type-badge badge-receta">💊 Receta</span>`,
    orden: `<span class="request-type-badge badge-orden">📋 Orden</span>`,
    transcripcion: `<span class="request-type-badge badge-transcripcion">📸 Transcripción</span>`
  }[r.type] || '';

  const statusBadge = r.status === 'pending'
    ? `<span class="status-badge status-pending">Pendiente</span>`
    : `<span class="status-badge status-responded">Respondida</span>`;

  let detailText = '';
  if (r.type === 'receta') detailText = `${details.farmaco || ''} ${details.dosis || ''} · ${details.cantidad || ''}`;
  if (r.type === 'orden') detailText = details.detalle?.slice(0, 80) + (details.detalle?.length > 80 ? '...' : '') || '';
  if (r.type === 'transcripcion') detailText = 'Receta fotografiada adjunta';

  const responseHTML = r.admin_response
    ? `<div style="margin-top:10px;padding:10px;background:var(--green-light);border-radius:8px;border-left:3px solid var(--green)"><div style="font-size:12px;color:#27ae60;font-weight:700;margin-bottom:3px">RESPUESTA MÉDICA</div><div style="font-size:14px;color:var(--gray-700)">${r.admin_response}</div></div>`
    : '';

  return `
    <div class="request-card">
      <div class="request-card-header">
        ${typeBadge}
        ${statusBadge}
      </div>
      <div class="request-info">${detailText}</div>
      ${responseHTML}
      <div class="request-date">${formatDateTime(r.created_at)}</div>
    </div>
  `;
}

function sectionPanelHTML(title, subtitle, bodyContent, headerAction = '') {
  return `
    <div class="section-panel">
      <div class="section-header">
        <div>
          <div class="section-title">${title}</div>
          ${subtitle ? `<div style="font-size:12px;color:var(--gray-400);margin-top:2px">${subtitle}</div>` : ''}
        </div>
        ${headerAction}
      </div>
      <div class="section-body">${bodyContent}</div>
    </div>
  `;
}

function emptyStateHTML(title, desc) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor"/></svg>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}
