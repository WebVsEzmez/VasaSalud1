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
async function renderPedirReceta() {
  const container = document.getElementById('user-sections');

  // Cargar familiares del usuario
  let familiares = [];
  try { familiares = await dbGetFamilyMembers(currentUser.id); } catch {}

  // Selector de para quién solo si tiene familiares
  const paraquienHTML = familiares.length > 0 ? `
    <div class="form-group">
      <label>¿Para quién es la receta?</label>
      <div class="paraquien-options" id="paraquien-options">
        <button type="button" class="paraquien-btn active" data-val="yo" onclick="selectParaquien(this)">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>
          Para mí
        </button>
        ${familiares.map(f => `
          <button type="button" class="paraquien-btn" data-val="${f.name}" onclick="selectParaquien(this)">
            <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/></svg>
            ${f.name}
          </button>
        `).join('')}
      </div>
    </div>
  ` : '';

  container.innerHTML = sectionPanelHTML('Pedir Receta', 'Indicá la medicación que necesitás', `
    <div id="receta-error" class="alert alert-error hidden"></div>
    <div id="receta-success" class="alert alert-success hidden"></div>
    ${paraquienHTML}
    <div class="form-group">
      <label>Nombre del Fármaco</label>
      <input type="text" id="rec-farmaco" placeholder="Ej: Ibuprofeno" />
    </div>
    <button class="btn btn-primary btn-full mt-8" onclick="enviarReceta()">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
      Enviar Solicitud
    </button>
  `);
}

function selectParaquien(btn) {
  document.querySelectorAll('.paraquien-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function enviarReceta() {
  const farmaco = document.getElementById('rec-farmaco')?.value?.trim();
  const errEl = document.getElementById('receta-error');
  const sucEl = document.getElementById('receta-success');
  const activeBtn = document.querySelector('.paraquien-btn.active');
  const paraquien = activeBtn ? activeBtn.dataset.val : 'yo';
  const paraquienLabel = paraquien === 'yo'
    ? (currentProfile?.full_name || 'el trabajador')
    : paraquien;

  if (!farmaco) {
    showAlert(errEl, 'Ingresá el nombre del fármaco.');
    return;
  }

  try {
    await dbCreateRequest({
      user_id: currentUser.id,
      type: 'receta',
      status: 'pending',
      details: JSON.stringify({ farmaco, para: paraquienLabel }),
      title: `Receta: ${farmaco} — Para: ${paraquienLabel}`
    });
    errEl.classList.add('hidden');
    showAlert(sucEl, '✓ Solicitud enviada. El médico responderá a la brevedad.');
    const el = document.getElementById('rec-farmaco');
    if (el) el.value = '';
    // Reset selector
    document.querySelectorAll('.paraquien-btn').forEach((b, i) => {
      b.classList.toggle('active', i === 0);
    });
    updateSolicitudesBadge();
  } catch (e) {
    showAlert(errEl, 'Error al enviar. Intentá nuevamente.');
  }
}

// ===== PEDIR ORDEN =====
function renderPedirOrden() {
  const container = document.getElementById('user-sections');
  container.innerHTML = sectionPanelHTML('Pedir Orden Médica', 'Describí la orden que necesitás', `
    <div id="orden-error" class="alert alert-error hidden"></div>
    <div id="orden-success" class="alert alert-success hidden"></div>
    <div class="form-group">
      <label>Detalle de la Orden</label>
      <textarea id="ord-detalle" rows="4" placeholder="Describí qué orden médica necesitás (estudios, derivaciones, etc.)..."></textarea>
    </div>
    <button class="btn btn-primary btn-full mt-8" onclick="enviarOrden()">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
      Enviar Solicitud
    </button>
  `);
}

async function enviarOrden() {
  const detalle = document.getElementById('ord-detalle')?.value?.trim();
  const errEl = document.getElementById('orden-error');
  const sucEl = document.getElementById('orden-success');

  if (!detalle) { showAlert(errEl, 'Describí la orden que necesitás.'); return; }

  try {
    await dbCreateRequest({
      user_id: currentUser.id,
      type: 'orden',
      status: 'pending',
      details: JSON.stringify({ detalle }),
      title: 'Orden Médica'
    });
    errEl.classList.add('hidden');
    showAlert(sucEl, '✓ Solicitud enviada. El médico responderá a la brevedad.');
    document.getElementById('ord-detalle').value = '';
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

    <div class="upload-area" id="upload-area" onclick="document.getElementById('trans-file').click()">
      <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/></svg>
      <p>Tocá para seleccionar una foto</p>
      <small>JPG, PNG · Se comprime automáticamente</small>
    </div>
    <input type="file" id="trans-file" accept="image/*" style="display:none" onchange="previewTranscripcion(this)" />

    <div id="trans-preview" style="display:none;margin-top:12px">
      <div style="position:relative;border-radius:12px;overflow:hidden;background:var(--gray-100)">
        <img id="trans-preview-img" style="width:100%;max-height:220px;object-fit:cover;display:block" />
        <button onclick="quitarFoto()" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.55);border:none;color:white;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">×</button>
      </div>
      <div id="trans-file-info" style="font-size:12px;color:var(--gray-400);margin-top:6px;text-align:center"></div>
    </div>

    <div class="form-group mt-12">
      <label>Observaciones (opcional)</label>
      <textarea id="trans-obs" placeholder="Alguna aclaración sobre la receta..."></textarea>
    </div>

    <button class="btn btn-primary btn-full mt-8" id="trans-btn" onclick="enviarTranscripcion()">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
      Enviar Transcripción
    </button>
  `);
}

// Comprimir imagen antes de guardarla
function comprimirImagen(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Escalar si es más ancha que maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (!blob) { reject(new Error('Error al comprimir')); return; }
            // Crear nuevo File con el blob comprimido
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressed);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function previewTranscripcion(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];

  // Solo imágenes
  if (!file.type.startsWith('image/')) {
    showToast('Solo se aceptan imágenes (JPG, PNG)', 'error');
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    showToast('La imagen supera los 20 MB', 'error');
    return;
  }

  // Mostrar estado de compresión
  const uploadArea = document.getElementById('upload-area');
  if (uploadArea) {
    uploadArea.innerHTML = `
      <div class="spinner" style="width:24px;height:24px;margin:0 auto 8px"></div>
      <p style="font-size:13px;color:var(--gray-500)">Comprimiendo imagen...</p>
    `;
  }

  try {
    const originalSize = file.size;
    const compressed = await comprimirImagen(file, 1200, 0.72);
    const compressedSize = compressed.size;
    const saving = Math.round((1 - compressedSize / originalSize) * 100);

    transcripcionFile = compressed;

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('trans-preview');
      const previewImg = document.getElementById('trans-preview-img');
      const fileInfo = document.getElementById('trans-file-info');

      if (preview) preview.style.display = 'block';
      if (previewImg) previewImg.src = e.target.result;
      if (fileInfo) {
        fileInfo.innerHTML = saving > 5
          ? `✅ Comprimida: ${formatBytes(originalSize)} → <b>${formatBytes(compressedSize)}</b> (−${saving}% menos espacio)`
          : `📷 ${formatBytes(compressedSize)}`;
      }

      // Restaurar upload area
      if (uploadArea) {
        uploadArea.innerHTML = `
          <svg viewBox="0 0 24 24" style="width:24px;height:24px;color:var(--teal)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
          <p style="color:var(--teal);font-weight:700">Foto cargada</p>
          <small>Tocá para cambiarla</small>
        `;
      }
    };
    reader.readAsDataURL(compressed);

  } catch (err) {
    // Si falla la compresión, usar original
    transcripcionFile = file;
    showToast('Se usará la imagen original', 'info');
    const preview = document.getElementById('trans-preview');
    const reader = new FileReader();
    reader.onload = e => {
      if (preview) {
        preview.style.display = 'block';
        document.getElementById('trans-preview-img').src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }
}

function quitarFoto() {
  transcripcionFile = null;
  const preview = document.getElementById('trans-preview');
  if (preview) preview.style.display = 'none';
  const fileInput = document.getElementById('trans-file');
  if (fileInput) fileInput.value = '';
  const uploadArea = document.getElementById('upload-area');
  if (uploadArea) {
    uploadArea.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/></svg>
      <p>Tocá para seleccionar una foto</p>
      <small>JPG, PNG · Se comprime automáticamente</small>
    `;
  }
}

async function enviarTranscripcion() {
  const obs = document.getElementById('trans-obs')?.value?.trim();
  const errEl = document.getElementById('trans-error');
  const sucEl = document.getElementById('trans-success');

  if (!transcripcionFile) {
    showAlert(errEl, 'Seleccioná una foto de tu receta.');
    return;
  }

  const btn = document.getElementById('trans-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;margin:0;border-width:2px"></div> Subiendo...';
  }

  try {
    let fileUrl = null;
    try {
      fileUrl = await dbUploadTranscription(transcripcionFile, currentUser.id);
    } catch {
      fileUrl = '[archivo adjunto]';
    }

    await dbCreateRequest({
      user_id: currentUser.id,
      type: 'transcripcion',
      status: 'pending',
      details: JSON.stringify({
        observaciones: obs,
        file_url: fileUrl,
        file_name: transcripcionFile.name,
        file_size: formatBytes(transcripcionFile.size)
      }),
      title: 'Transcripción de Receta'
    });

    errEl.classList.add('hidden');
    showAlert(sucEl, '✓ Transcripción enviada correctamente.');
    transcripcionFile = null;
    quitarFoto();
    if (document.getElementById('trans-obs')) document.getElementById('trans-obs').value = '';
    updateSolicitudesBadge();
  } catch (e) {
    showAlert(errEl, 'Error al enviar. Intentá nuevamente.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg> Enviar Transcripción`;
    }
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
        <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">LEGAJO</div><div style="font-weight:700">${p.legajo || '—'}</div></div>
      </div>
      <div><div style="font-size:12px;color:var(--gray-400);font-weight:600;margin-bottom:3px">EMAIL</div><div style="font-weight:700;font-size:13px;word-break:break-all">${p.email || '—'}</div></div>
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
    legajo: document.getElementById('p-legajo')?.value?.trim(),
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
    <div class="form-group"><label>Legajo</label><input type="text" id="p-legajo" value="${p.legajo || ''}" placeholder="Número de legajo" /></div>
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
